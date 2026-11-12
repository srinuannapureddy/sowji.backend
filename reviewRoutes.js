const express = require('express');
const router = express.Router();
const Review = require('./Review');

// Get approved reviews
router.get('/', async (req, res) => {
  try {
    const query = { approved: true };

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      items: reviews,
      total: reviews.length
    });
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reviews'
    });
  }
});

module.exports = router;
