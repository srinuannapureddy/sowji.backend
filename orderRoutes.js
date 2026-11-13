
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const router = express.Router();

const Order = require('./Order');
const Product = require('./Product');
const adminAuth = require('./adminAuth');
const jwt = require('jsonwebtoken');
const User = require('./User');

// Verify customer login
async function customerAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please log in first.'
      });
    }

    const decoded = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    );

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
      message: 'Invalid or expired login.'
    });
  }
}

const allowedStatuses = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned'
];

// CUSTOMER: CREATE ORDER
router.post('/', customerAuth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.'
      });
    }

    if (items.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Too many different products in one order.'
      });
    }

    if (!['COD', 'ONLINE'].includes(paymentMethod || 'COD')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.'
      });
    }

    // Online payments are not enabled until a payment gateway is connected.
    if (paymentMethod === 'ONLINE') {
      return res.status(400).json({
        success: false,
        message: 'Online payment is not available yet. Please choose Cash on Delivery.'
      });
    }

    const address = shippingAddress || {};

    const requiredAddressFields = [
      'fullName',
      'phone',
      'address',
      'city',
      'state',
      'postalCode'
    ];

    for (const field of requiredAddressFields) {
      if (!String(address[field] || '').trim()) {
        return res.status(400).json({
          success: false,
          message: `Please provide your delivery ${field}.`
        });
      }
    }

    // Validate IDs and quantities.
    const quantities = new Map();

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product in cart.'
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product quantity.'
        });
      }

      const id = String(item.productId);
      quantities.set(id, (quantities.get(id) || 0) + quantity);
    }

    const productIds = [...quantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      isVerified: true,
      isPublished: true
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products are unavailable.'
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const product of products) {
      const quantity = quantities.get(String(product._id));

      if (product.stock !== null && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not have enough stock.`
        });
      }

      const price =
        product.discountPrice !== null &&
        product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      if (price === null || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available for online ordering.`
        });
      }

      const mainImage = product.images.find(image => image.isMain)
        || product.images[0];

      const lineTotal = price * quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: mainImage ? mainImage.url : '',
        price,
        quantity,
        lineTotal
      });
    }

    const safeAddress = {
      fullName: String(address.fullName).trim(),
      phone: String(address.phone).trim(),
      address: String(address.address).trim(),
      city: String(address.city).trim(),
      state: String(address.state).trim(),
      postalCode: String(address.postalCode).trim(),
      country: String(address.country || 'India').trim()
    };

    const order = await Order.create({
      orderNumber: 'SWJ-' + Date.now() + '-' +
        crypto.randomBytes(3).toString('hex').toUpperCase(),

      user: req.user._id,

      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      },

      items: orderItems,
      shippingAddress: safeAddress,
      subtotal,
      discount: 0,
      shipping: 0,
      total: subtotal,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      status: 'Placed'
    });

    return res.status(201).json({
      success: true,
      message: 'Your order has been placed.',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to place your order.'
    });
  }
});

// CUSTOMER: VIEW OWN ORDERS
router.get('/mine', customerAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Customer orders error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to load your orders.'
    });
  }
});

// ADMIN: VIEW ALL ORDERS
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const filter = {};

    if (req.query.status && allowedStatuses.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Admin orders error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to load orders.'
    });
  }
});

// ADMIN: VIEW ONE ORDER
router.get('/:id', adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.'
      });
    }

    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Single order error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to load order.'
    });
  }
});

// ADMIN: UPDATE ORDER STATUS
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.'
      });
    }

    const { status, paymentStatus, notes } = req.body;

    const updates = {};

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status.'
        });
      }

      updates.status = status;
    }

    if (paymentStatus !== undefined) {
      const allowedPayments = [
        'Pending',
        'Paid',
        'Failed',
        'Refunded'
      ];

      if (!allowedPayments.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status.'
        });
      }

      updates.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updates.notes = String(notes).slice(0, 1000);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided.'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully.',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update order.'
    });
  }
});

module.exports = router;
