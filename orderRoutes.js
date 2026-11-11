const express = require('express');
const router = express.Router();
router.post('/', (req, res) => { res.status(201).json({ orderId: 'ORD-' + Date.now(), status: 'Created' }); });
module.exports = router;
