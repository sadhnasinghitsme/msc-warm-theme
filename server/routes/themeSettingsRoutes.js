const express = require('express');
const { body } = require('express-validator');
const { getPublicSections, getAllSections, getSection, upsertSection } = require('../controllers/themeSettingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const fieldValidators = [
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Title is too long'),
  body('subtitle').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Subtitle is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }).withMessage('Description is too long'),
  body('imageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Image URL is too long'),
  body('buttonText').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Button text is too long'),
  body('buttonLink').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Button link is too long'),
];

// Public — used by the homepage's dynamic content loader.
router.get('/public', getPublicSections);

// Admin-only CRUD (same pattern as faqs/content).
router.get('/', protect, getAllSections);
router.get('/:sectionKey', protect, getSection);
router.put('/:sectionKey', protect, fieldValidators, upsertSection);

module.exports = router;
