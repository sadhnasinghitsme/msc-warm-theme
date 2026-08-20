const express = require('express');
const { body } = require('express-validator');
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, getMe);

module.exports = router;
