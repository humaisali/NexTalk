const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─────────────────────────────────────────────
// GET /api/auth/check-number?number=+1001234567
// Real-time availability check (no auth required)
// ─────────────────────────────────────────────
router.get('/check-number', async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) return res.status(400).json({ message: 'number query param required.' });

    // Strip spaces and validate format
    const cleaned = number.replace(/\s/g, '');
    const valid   = /^\+100\d{7}$/.test(cleaned);
    if (!valid) {
      return res.status(200).json({ available: false, message: 'Invalid format. Must be +100 followed by 7 digits.' });
    }

    const existing = await User.findOne({ nexTalkNumber: cleaned }).select('_id');
    res.status(200).json({
      available: !existing,
      message:   existing ? 'Number already taken.' : 'Number is available!'
    });
  } catch (err) {
    console.error('check-number error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { username, email, password, nexTalkNumber }
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nexTalkNumber } = req.body;

    // Basic validation
    if (!username || !email || !password || !nexTalkNumber) {
      return res.status(400).json({ message: 'All fields including NexTalk number are required.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Clean and validate NexTalk number
    const cleanedNumber = nexTalkNumber.replace(/\s/g, '');
    if (!/^\+100\d{7}$/.test(cleanedNumber)) {
      return res.status(400).json({ message: 'NexTalk number must be in format +100 followed by 7 digits.' });
    }

    // Check duplicates
    const [existingEmail, existingUsername, existingNumber] = await Promise.all([
      User.findOne({ email:         email.toLowerCase().trim() }),
      User.findOne({ username:      username.trim()            }),
      User.findOne({ nexTalkNumber: cleanedNumber              })
    ]);

    if (existingEmail)    return res.status(409).json({ message: 'Email already registered.' });
    if (existingUsername) return res.status(409).json({ message: 'Username already taken.' });
    if (existingNumber)   return res.status(409).json({ message: 'NexTalk number already taken. Choose a different one.' });

    // Create user
    const user  = await User.create({
      username:      username.trim(),
      email:         email.toLowerCase().trim(),
      password,
      nexTalkNumber: cleanedNumber
    });

    const token = generateToken(user._id);
    res.status(201).json({ message: 'Account created!', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ message: 'Logged in!', token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  [Protected]
// ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.status(200).json({ user: req.user });
});

// ─────────────────────────────────────────────
// PUT /api/auth/language  [Protected]
// Body: { language }
// ─────────────────────────────────────────────
router.put('/language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) return res.status(400).json({ message: 'language is required.' });
    const user = await User.findByIdAndUpdate(req.user._id, { language }, { new: true });
    res.status(200).json({ message: 'Language updated.', user });
  } catch (err) {
    console.error('Language error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout  [Protected]
// ─────────────────────────────────────────────
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    res.status(200).json({ message: 'Logged out.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/find-user?number=+1001234567  [Protected]
// Look up a user by their NexTalk number (for starting a DM)
// ─────────────────────────────────────────────
router.get('/find-user', authMiddleware, async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) return res.status(400).json({ message: 'number query param required.' });

    const cleaned = number.replace(/\s/g, '');
    const user    = await User.findOne({ nexTalkNumber: cleaned })
      .select('username avatar nexTalkNumber isOnline lastSeen');

    if (!user) return res.status(404).json({ message: 'No user found with that NexTalk number.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "That's your own NexTalk number!" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('find-user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────
// PUT /api/auth/profile  [Protected]
// Update username, password, and/or avatar.
// Body: { username?, currentPassword?, newPassword?, avatar? }
// avatar is a base64 data URL string (e.g. "data:image/jpeg;base64,...")
// ─────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, currentPassword, newPassword, avatar, bio, statusText, statusType } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const updates = {};

    // ── Username change ──────────────────────────────────────────
    if (username && username.trim() !== user.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters.' });
      }
      const taken = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ message: 'Username already taken.' });
      updates.username = trimmed;
    }

    // ── Password change ──────────────────────────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new one.' });
      }
      const match = await user.comparePassword(currentPassword);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      // Setting password triggers the pre-save bcrypt hook
      user.password = newPassword;
    }

    // ── Avatar change ────────────────────────────────────────────
    if (avatar !== undefined) {
      // Validate it's a data URL or empty string
      if (avatar && !avatar.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Avatar must be a valid image.' });
      }
      // Limit size — base64 of 500KB image ≈ 680KB string
      if (avatar && avatar.length > 700000) {
        return res.status(400).json({ message: 'Avatar image is too large. Max 500KB.' });
      }
      updates.avatar = avatar;
    }

    // ── Bio and Status changes ───────────────────────────────────
    if (bio !== undefined) {
      updates.bio = bio.substring(0, 250);
    }
    if (statusText !== undefined) {
      updates.statusText = statusText.substring(0, 80);
    }
    if (statusType !== undefined) {
      if (['active', 'away', 'busy', 'dnd'].includes(statusType)) {
        updates.statusType = statusType;
      }
    }

    // Apply non-password updates
    Object.assign(user, updates);
    await user.save();

    // Broadcast presence / status update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('user_presence_update', {
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        statusType: user.statusType,
        statusText: user.statusText,
        bio: user.bio
      });
    }

    res.status(200).json({ message: 'Profile updated successfully!', user });
  } catch (err) {
    console.error('PUT /profile error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});
