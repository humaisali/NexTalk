const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');

// Setup multer memory storage (limit files to 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

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
  console.log('📁 Local static storage configured for file uploads (No Cloudinary credentials).');
}

// POST /api/upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;

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
        fileName: originalname,
        fileType: mimetype,
        fileSize: size
      });
    } else {
      // Local fallback: write to disk
      const dir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalname)}`;
      const filepath = path.join(dir, filename);

      fs.writeFileSync(filepath, buffer);

      // Return local server URL (e.g. /uploads/filename)
      const fileUrl = `/uploads/${filename}`;

      return res.status(200).json({
        message: 'Uploaded to local storage!',
        fileUrl,
        fileName: originalname,
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
