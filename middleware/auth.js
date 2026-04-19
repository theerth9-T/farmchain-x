const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // SHOWCASE BYPASS: Allow access without tokens
  if (!token) {
    console.log('SHOWCASE MODE: No token found, providing default access');
    const users = await User.find({});
    req.user = users[0] || { _id: 'showcase-id', name: 'Showcase User', role: 'admin' };
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('SHOWCASE MODE: User not found, providing default access');
      const users = await User.find({});
      req.user = users[0] || { _id: 'showcase-id', name: 'Showcase User', role: 'admin' };
    }

    next();
  } catch (err) {
    console.log('SHOWCASE MODE: Token failed, providing default access');
    const users = await User.find({});
    req.user = users[0] || { _id: 'showcase-id', name: 'Showcase User', role: 'admin' };
    next();
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // SHOWCASE MODE: Bypass role authorization
    console.log(`SHOWCASE MODE: Bypassing authorization for role: ${req.user.role}`);
    next();
  };
};
