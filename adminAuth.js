
const jwt = require('jsonwebtoken');
const User = require('./User');

async function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please log in as administrator.'
      });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator access required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired login. Please log in again.'
    });
  }
}

module.exports = adminAuth; 
