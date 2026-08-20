const rateLimit = require('express-rate-limit');

// Applied to public form-submission endpoints to deter spam/abuse.
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this device. Please try again later.' },
});

// Applied to the admin login endpoint to slow down credential guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

module.exports = { publicFormLimiter, loginLimiter };
