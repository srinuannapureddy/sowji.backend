
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./User');
const CustomerData = require('./CustomerData');

const router = express.Router();

async function authenticateCustomer(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to sync your shopping data.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please sign in again.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your login has expired. Please sign in again.'
    });
  }
}

router.use(authenticateCustomer);

// Load shopping data belonging to the signed-in customer.
router.get('/', async (req, res) => {
  try {
    const data = await CustomerData.findOne({
      user: req.user._id
    }).lean();

    res.json({
      success: true,
      initialized: Boolean(data),
      data: {
        cart: data?.cart || [],
        wishlist: data?.wishlist || [],
        compare: data?.compare || []
      }
    });
  } catch (error) {
    console.error('Customer data load error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not load your saved shopping data.'
    });
  }
});

// Save shopping data belonging to the signed-in customer.
router.put('/', async (req, res) => {
  try {
    const body = req.body || {};

    const cart = Array.isArray(body.cart) ? body.cart : [];
    const wishlist = Array.isArray(body.wishlist) ? body.wishlist : [];
    const compare = Array.isArray(body.compare) ? body.compare : [];

    if (
      cart.length > 100 ||
      wishlist.length > 200 ||
      compare.length > 4
    ) {
      return res.status(400).json({
        success: false,
        message: 'Too many saved items.'
      });
    }

    const data = await CustomerData.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: { cart, wishlist, compare },
        $setOnInsert: { user: req.user._id }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      success: true,
      initialized: true,
      message: 'Your shopping data has been saved.',
      data: {
        cart: data.cart,
        wishlist: data.wishlist,
        compare: data.compare
      }
    });
  } catch (error) {
    console.error('Customer data save error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not save your shopping data.'
    });
  }
});

module.exports = router;
