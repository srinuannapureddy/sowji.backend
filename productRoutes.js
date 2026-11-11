
const express = require('express');
const router = express.Router();
const Product = require('./Product');

// --------------------------------------------------
// ADMIN PROTECTION
// Set ADMIN_API_KEY in Render environment variables.
// Never put this key in frontend JavaScript.
// --------------------------------------------------

function adminAuth(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;
  const suppliedKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.status(503).json({
      success: false,
      message: 'Admin API is not configured'
    });
  }

  if (!suppliedKey || suppliedKey !== adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized admin request'
    });
  }

  next();
}

// Escape search/filter text before using it in regular expressions.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --------------------------------------------------
// GET ALL PRODUCTS
// GET /api/products?limit=40
// --------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const {
      category,
      bestSeller,
      newArrival,
      sort,
      q,
      minPrice,
      maxPrice
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 40)
    );

    const query = {};

    if (category) {
      query.category = new RegExp(escapeRegex(category), 'i');
    }

    if (bestSeller === 'true') {
      query.isBestSeller = true;
    }

    if (newArrival === 'true') {
      query.isNewArrival = true;
    }

    if (q) {
      const search = new RegExp(escapeRegex(q), 'i');

      query.$or = [
        { name: search },
        { description: search },
        { fabric: search },
        { color: search },
        { category: search }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined) {
        const min = Number(minPrice);
        if (!Number.isFinite(min) || min < 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid minimum price'
          });
        }
        query.price.$gte = min;
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);
        if (!Number.isFinite(max) || max < 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid maximum price'
          });
        }
        query.price.$lte = max;
      }
    }

    let sortOption = { createdAt: -1 };

    if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      Product.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      items,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get products error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch products'
    });
  }
});

// --------------------------------------------------
// BULK ADD PRODUCTS
// POST /api/products/bulk
// Requires x-admin-key header
// --------------------------------------------------

router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const products = req.body.products;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Send a non-empty products array'
      });
    }

    if (products.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 products per request'
      });
    }

    const result = await Product.insertMany(products, {
      ordered: false
    });

    res.status(201).json({
      success: true,
      message: 'Products added successfully',
      count: result.length,
      items: result
    });

  } catch (error) {
    console.error('Bulk product insert error:', error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// GET SINGLE PRODUCT BY SLUG
// --------------------------------------------------

router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Get single product error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch product'
    });
  }
});

// --------------------------------------------------
// ADD ONE PRODUCT
// POST /api/products
// Requires x-admin-key header
// --------------------------------------------------

router.post('/', adminAuth, async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// UPDATE PRODUCT
// PUT /api/products/:id
// Requires x-admin-key header
// --------------------------------------------------

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// DELETE PRODUCT
// DELETE /api/products/:id
// Requires x-admin-key header
// --------------------------------------------------

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
