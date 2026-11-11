const express = require('express');
const router = express.Router();
router.post('/login', (req, res) => { res.json({ token: 'dummy_token', user: { name: 'Admin', email: req.body.email } }); });
module.exports = router;
