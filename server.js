
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  'https://sowji-collections.vercel.app',
  'https://srinuannapureddy.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// Health checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sowji Collections Backend API is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    server: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/products', require('./productRoutes'));
app.use('/api/categories', require('./categoryRoutes'));
app.use('/api/auth', require('./authRoutes'));
app.use('/api/orders', require('./orderRoutes'));
app.use('/api/reviews', require('./reviewRoutes'));

// MongoDB and one-time sample product seeding
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully to Sowji Collections DB');

    if (process.env.SEED_SAMPLE_PRODUCTS === 'true') {
      const Product = require('./Product');
      const sampleProducts = require('./sampleProducts');

      const skus = sampleProducts.map(product => product.sku);

      const existing = await Product.find({
        sku: { $in: skus }
      }).select('sku').lean();

      const existingSkus = new Set(existing.map(product => product.sku));

      const missingProducts = sampleProducts.filter(
        product => !existingSkus.has(product.sku)
      );

      if (missingProducts.length > 0) {
        await Product.insertMany(missingProducts);
      }

      console.log(
        `SAMPLE SEED COMPLETE: ${missingProducts.length} products inserted; ${existingSkus.size} already existed.`
      );
    }
  } catch (error) {
    console.error('Startup/database error:', error.message);
  }
}

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl
  });
});

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sowji Collections API running on port ${PORT}`);
  startServer();
});
