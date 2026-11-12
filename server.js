
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --------------------------------------------------
// BASIC SETTINGS
// --------------------------------------------------

app.disable('x-powered-by');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// CORS — FRONTEND DOMAINS
// --------------------------------------------------

const allowedOrigins = [
  'https://sowji-collections.vercel.app',
  'https://srinuannapureddy.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without an Origin header (e.g. server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sowji Collections Backend API is running',
    database:
      mongoose.connection.readyState === 1
        ? 'Connected'
        : 'Disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    server: 'running',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected'
  });
});

// --------------------------------------------------
// MONGODB CONNECTION
// --------------------------------------------------

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is missing from environment variables.');
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB Connected successfully to Sowji Collections DB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
    });
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error.message);
});

// --------------------------------------------------
// API ROUTES
// These route files must exist in the backend root.
// --------------------------------------------------

app.use('/api/products', require('./productRoutes'));
app.use('/api/categories', require('./categoryRoutes'));
app.use('/api/auth', require('./authRoutes'));
app.use('/api/orders', require('./orderRoutes'));

// --------------------------------------------------
// NOT FOUND HANDLER
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl
  });
});

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error('Server error:', error.message);

  if (error.message && error.message.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      message: 'Request blocked by CORS policy'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sowji Collections API running on port ${PORT}`);
});
