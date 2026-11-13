
const express = require('express');
const crypto = require('crypto');
const adminAuth = require('./adminAuth');

const router = express.Router();

router.post('/signature', adminAuth, (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are missing'
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'sowji-collections/sarees';

    const signatureString =
      `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    res.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not create upload signature'
    });
  }
});

module.exports = router;
