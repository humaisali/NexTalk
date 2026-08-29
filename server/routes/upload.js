const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'audio/mp4',
  'application/pdf', 'application/zip', 'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv'
]);

const EXTENSIONS_BY_MIME = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
  'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/mp4': '.m4a',
  'application/pdf': '.pdf', 'application/zip': '.zip', 'application/json': '.json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt', 'text/csv': '.csv'
};

const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, index) => buffer[offset + index] === byte);

const hasValidSignature = (buffer, mimetype) => {
  if (!buffer?.length) return false;
  if (mimetype === 'image/jpeg') return startsWith(buffer, [0xff, 0xd8, 0xff]);
  if (mimetype === 'image/png') return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimetype === 'image/gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (mimetype === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimetype === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimetype === 'audio/webm') return startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
  if (mimetype === 'audio/ogg') return buffer.subarray(0, 4).toString('ascii') === 'OggS';
  if (mimetype === 'audio/wav') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
  if (mimetype === 'audio/mpeg') {
    return buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  }
  if (mimetype === 'audio/mp4') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  if (mimetype === 'application/zip' || mimetype.includes('openxmlformats-officedocument')) {
    return startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]);
  }
  if (['text/plain', 'text/csv', 'application/json'].includes(mimetype)) {
    return !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
  }
  return false;
};

// Setup multer memory storage (limit files to 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type'));
    }
    cb(null, true);
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  message: { message: 'Upload limit reached. Try again later.' }
});

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 415;
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 10MB.'
        : 'Unsupported file type.';
      return res.status(status).json({ message });
    }
    next(err);
  });
};

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ Cloudinary storage configured for file uploads.');
} else {
  const level = process.env.NODE_ENV === 'production' ? 'error' : 'log';
  console[level]('📁 Cloudinary is not configured. Local uploads are development-only.');
}

// POST /api/upload
router.post('/', authMiddleware, uploadLimiter, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    if (!hasValidSignature(buffer, mimetype)) {
      return res.status(415).json({ message: 'File contents do not match the declared file type.' });
    }
    const safeOriginalName = path.basename(originalname)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .slice(0, 255) || `attachment${EXTENSIONS_BY_MIME[mimetype] || ''}`;

    if (isCloudinaryConfigured) {
      // Upload stream to Cloudinary
      const options = {
        resource_type: 'auto',
        folder: 'nextalk_attachments'
      };

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        });
        stream.end(buffer);
      });

      return res.status(200).json({
        message: 'Uploaded to Cloudinary!',
        fileUrl: result.secure_url,
        fileName: safeOriginalName,
        fileType: mimetype,
        fileSize: size
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ message: 'Durable attachment storage is not configured.' });
      }
      // Local fallback: write to disk
      const dir = path.join(__dirname, '../uploads');
      await fs.promises.mkdir(dir, { recursive: true });

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXTENSIONS_BY_MIME[mimetype]}`;
      const filepath = path.join(dir, filename);

      await fs.promises.writeFile(filepath, buffer);

      // Return local server URL (e.g. /uploads/filename)
      const fileUrl = `/uploads/${filename}`;

      return res.status(200).json({
        message: 'Uploaded to local storage!',
        fileUrl,
        fileName: safeOriginalName,
        fileType: mimetype,
        fileSize: size
      });
    }
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'Failed to upload file.' });
  }
});

module.exports = router;
module.exports._test = { ALLOWED_MIME_TYPES, hasValidSignature };
