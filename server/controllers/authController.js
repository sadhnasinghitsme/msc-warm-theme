const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    token: generateToken(admin._id),
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ id: req.admin._id, name: req.admin.name, email: req.admin.email });
});

module.exports = { login, getMe };
