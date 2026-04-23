const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Helper: generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { username, email, password }
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicates
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    // Create user (password hashed automatically via pre-save hook)
    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Mark user as online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me   [Protected]
// Returns current logged-in user profile
// ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/auth/language   [Protected]
// Body: { language }  — e.g. 'ur', 'hi', 'fr'
// ─────────────────────────────────────────────
router.put('/language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: 'Language code is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { language },
      { new: true }
    );

    res.status(200).json({ message: 'Language preference updated.', user });
  } catch (error) {
    console.error('Language update error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout   [Protected]
// Marks user as offline
// ─────────────────────────────────────────────
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
