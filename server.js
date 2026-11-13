
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'https://sowji-collections.vercel.app',
  'https://srinuannapureddy.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-admin-bootstrap-key'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/products', require('./productRoutes'));
app.use('/api/categories', require('./categoryRoutes'));
app.use('/api/auth', require('./authRoutes'));
app.use('/api/orders', require('./orderRoutes'));
app.use('/api/reviews', require('./reviewRoutes'));
app.use('/api/uploads', require('./uploadRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sowji Collections Backend API is running',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Sowji backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
