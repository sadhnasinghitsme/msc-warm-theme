const express = require('express');
const { body } = require('express-validator');
const {
  createEnquiry,
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/',
  publicFormLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 20 }),
    body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Email must be valid'),
    body('specialization')
      .optional({ checkFalsy: true })
      .isIn(['Microbiology', 'Biochemistry', 'Anatomy', 'Physiology']),
    body('source').optional({ checkFalsy: true }).isIn(['hero-quick-form', 'enquiry-section', 'scroll-popup', 'other']),
  ],
  createEnquiry
);

router.get('/', protect, getEnquiries);
router.get('/:id', protect, getEnquiry);
router.patch('/:id', protect, updateEnquiry);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;
