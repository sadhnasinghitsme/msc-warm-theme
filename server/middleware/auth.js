const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id);

    if (!req.admin) {
      res.status(401);
      throw new Error('Not authorized, admin no longer exists');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

module.exports = { protect };
