
const express = require('express');
const router = express.Router();
const Product = require('./Product');

// --------------------------------------------------
// ADMIN AUTHENTICATION
// ADMIN_API_KEY must be set in Render environment.
// Never expose this key in frontend JavaScript.
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --------------------------------------------------
// PUBLIC PRODUCT LIST
// GET /api/products
// Only verified and published products are visible.
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

    const query = {
      isVerified: true,
      isPublished: true
    };

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
      query.price = { $ne: null };

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

    res.json({
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
// ADMIN BULK ADD
// POST /api/products/bulk
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

    // Bulk-added products remain unpublished by default.
    const safeProducts = products.map((product) => ({
      ...product,
      isVerified: false,
      isPublished: false,
      verifiedAt: null
    }));

    const result = await Product.insertMany(safeProducts, {
      ordered: false
    });

    res.status(201).json({
      success: true,
      message: 'Products added as unpublished drafts',
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
// PUBLIC SINGLE PRODUCT
// GET /api/products/:slug
// --------------------------------------------------

router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isVerified: true,
      isPublished: true
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
// ADMIN ADD PRODUCT
// POST /api/products
// --------------------------------------------------

router.post('/', adminAuth, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      isVerified: false,
      isPublished: false,
      verifiedAt: null
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product saved as an unpublished draft',
      product: savedProduct
    });

  } catch (error) {
    console.error('Add product error:', error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// ADMIN UPDATE / VERIFY / PUBLISH
// PUT /api/products/:id
// --------------------------------------------------

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Apply admin changes.
    Object.assign(product, req.body);

    // A product cannot be published unless it is verified
    // and has at least one photograph.
    if (product.isPublished === true) {
      const hasImage =
        Array.isArray(product.images) &&
        product.images.some(
          (image) =>
            image &&
            typeof image.url === 'string' &&
            image.url.trim() !== ''
        );

      if (product.isVerified !== true || !hasImage) {
        return res.status(400).json({
          success: false,
          message: 'Verify the product and add an authentic product photograph before publishing'
        });
      }
    }

    if (product.isVerified === true) {
      if (!product.verifiedAt) {
        product.verifiedAt = new Date();
      }
    } else {
      product.verifiedAt = null;
      product.isPublished = false;
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// ADMIN DELETE
// DELETE /api/products/:id
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
    console.error('Delete product error:', error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
