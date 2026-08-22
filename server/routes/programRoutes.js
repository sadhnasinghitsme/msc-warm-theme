const express = require('express');
const { body } = require('express-validator');
const {
  getAllPrograms, getPublicPrograms, createProgram, updateProgram, deleteProgram,
} = require('../controllers/programController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const fieldValidators = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Name is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }).withMessage('Description is too long'),
  body('duration').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Duration is too long'),
  body('eligibility').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Eligibility is too long'),
  body('coreSyllabus').optional().isArray().withMessage('Core syllabus must be a list'),
  body('careerScope').optional().isArray().withMessage('Career scope must be a list'),
  body('primaryRecruiters').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Primary recruiters is too long'),
  body('avgPackage').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Average package is too long'),
  body('imageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Image URL is too long'),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

// Public — active programs only, used by the homepage course tabs & eligibility table.
router.get('/public', getPublicPrograms);

// Admin-only CRUD (same pattern as faqs).
router.get('/', protect, getAllPrograms);
router.post(
  '/',
  protect,
  [body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }), ...fieldValidators],
  createProgram
);
router.patch('/:id', protect, fieldValidators, updateProgram);
router.delete('/:id', protect, deleteProgram);

module.exports = router;
