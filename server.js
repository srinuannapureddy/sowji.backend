
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://srinuannapureddy.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.github.io')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected successfully to Sowji Collections DB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// API Routes — files are in the root folder
app.use('/api/products', require('./productRoutes'));
app.use('/api/categories', require('./categoryRoutes'));
app.use('/api/auth', require('./authRoutes'));
app.use('/api/orders', require('./orderRoutes'));

app.get('/', (req, res) => {
  res.json({
    status: 'Sowji Collections Backend API is running successfully'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
