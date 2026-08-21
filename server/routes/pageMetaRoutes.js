const express = require('express');
const { body } = require('express-validator');
const {
  getAllPageMeta,
  getPageMeta,
  createPageMeta,
  updatePageMeta,
  deletePageMeta,
} = require('../controllers/pageMetaController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const fieldValidators = [
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Title is too long'),
  body('metaDescription')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 400 })
    .withMessage('Description is too long'),
  body('canonicalUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Canonical URL must be a valid URL'),
  body('ogImage').optional({ checkFalsy: true }).trim().isURL().withMessage('OG image must be a valid URL'),
];

// All routes are admin-only — there is no public submission for page metadata.
router.get('/', protect, getAllPageMeta);
router.get('/:id', protect, getPageMeta);
router.post('/', protect, [body('pagePath').trim().notEmpty().withMessage('pagePath is required'), ...fieldValidators], createPageMeta);
router.patch('/:id', protect, fieldValidators, updatePageMeta);
router.delete('/:id', protect, deletePageMeta);

module.exports = router;
