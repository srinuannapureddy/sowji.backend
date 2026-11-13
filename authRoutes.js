
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');

const router = express.Router();

function makeToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  return jwt.sign(
    { sub: user._id.toString(), role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').replace(/[\s()-]/g, '');
    const password = String(req.body.password || '');

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all fields.'
      });
    }

    if (name.length > 80 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^\+?[0-9]{10,15}$/.test(phone) ||
        password.length < 8 ||
        password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Check your name, email, phone and password. Password must be 8–72 characters.'
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'customer'
    });

    return res.status(201).json({
      success: true,
      message: 'Your account has been created successfully.',
      token: makeToken(user),
      user: safeUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email })
      .select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      token: makeToken(user),
      user: safeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    return res.json({
      success: true,
      user: safeUser(user)
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.'
    });
  }
});

module.exports = router;
