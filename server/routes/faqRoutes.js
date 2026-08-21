const express = require('express');
const { body } = require('express-validator');
const { getAllFaqs, getPublicFaqs, createFaq, updateFaq, deleteFaq } = require('../controllers/faqController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const fieldValidators = [
  body('question').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Question is too long'),
  body('answer').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }).withMessage('Answer is too long'),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

// Public — active FAQs only, used by build-faqs.js at deploy time.
router.get('/public', getPublicFaqs);

// Admin-only CRUD (same pattern as enquiries/contact/content).
router.get('/', protect, getAllFaqs);
router.post(
  '/',
  protect,
  [
    body('question').trim().notEmpty().withMessage('Question is required').isLength({ max: 300 }),
    body('answer').trim().notEmpty().withMessage('Answer is required').isLength({ max: 3000 }),
    ...fieldValidators,
  ],
  createFaq
);
router.patch('/:id', protect, fieldValidators, updateFaq);
router.delete('/:id', protect, deleteFaq);

module.exports = router;
