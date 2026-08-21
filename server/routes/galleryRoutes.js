const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { getAllImages, createImage, updateImage, deleteImage } = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const { cloudinary, isConfigured } = require('../utils/cloudinary');

const router = express.Router();

const storage = isConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: { folder: 'sks-warm-gallery', resource_type: 'image' },
    })
  : multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const fieldValidators = [
  body('caption').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Caption is too long'),
  body('altText').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Alt text is too long'),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

// Admin-only CRUD (same pattern as faqs).
router.get('/', protect, getAllImages);
router.post('/', protect, upload.single('image'), fieldValidators, createImage);
router.put('/:id', protect, fieldValidators, updateImage);
router.delete('/:id', protect, deleteImage);

module.exports = router;
