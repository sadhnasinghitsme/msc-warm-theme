const express = require('express');
const { body } = require('express-validator');
const { getAllPages, getPage, upsertPage } = require('../controllers/navPageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const fieldValidators = [
  body('heading').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Heading is too long'),
  body('subheading').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Subheading is too long'),
];

// Admin-only CRUD (same pattern as theme-settings).
router.get('/', protect, getAllPages);
router.get('/:pageKey', protect, getPage);
router.put('/:pageKey', protect, fieldValidators, upsertPage);

module.exports = router;
