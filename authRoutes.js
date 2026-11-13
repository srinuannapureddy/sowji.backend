
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');

const router = express.Router();

const ADMIN_EMAIL = 'akshathacgowda75@gmail.com';

function makeToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
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

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in first.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired login. Please log in again.'
    });
  }
}

// CUSTOMER REGISTRATION
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      passwordHash,
      role: 'customer'
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token: makeToken(user),
      user: safeUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed.'
    });
  }
});

// CUSTOMER / ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase()
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
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
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed.'
    });
  }
});

// CURRENT LOGGED-IN USER
router.get('/me', authenticate, (req, res) => {
  return res.json({
    success: true,
    user: safeUser(req.user)
  });
});

// ONE-TIME ADMIN PROMOTION
router.post('/promote-admin', authenticate, async (req, res) => {
  try {
    const configuredEmail = String(
      process.env.ADMIN_EMAIL || ''
    ).trim().toLowerCase();

    const bootstrapKey = String(
      process.env.ADMIN_BOOTSTRAP_KEY || ''
    ).trim();

    const suppliedKey = String(
      req.headers['x-admin-bootstrap-key'] || ''
    ).trim();

    if (!configuredEmail || !bootstrapKey || !suppliedKey) {
      return res.status(503).json({
        success: false,
        message: 'Administrator setup is not configured.'
      });
    }

    if (configuredEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Administrator email configuration is invalid.'
      });
    }

    if (String(req.user.email).toLowerCase() !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'This account is not authorised to become administrator.'
      });
    }

    if (suppliedKey !== bootstrapKey) {
      return res.status(403).json({
        success: false,
        message: 'Administrator setup key is incorrect.'
      });
    }

    const existingAdmin = await User.findOne({
      role: 'admin',
      _id: { $ne: req.user._id }
    });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: 'An administrator has already been configured.'
      });
    }

    req.user.role = 'admin';
    await req.user.save();

    return res.json({
      success: true,
      message: 'Administrator account activated.',
      token: makeToken(req.user),
      user: safeUser(req.user)
    });
  } catch (error) {
    console.error('Admin promotion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Administrator setup failed.'
    });
  }
});

module.exports = router;
