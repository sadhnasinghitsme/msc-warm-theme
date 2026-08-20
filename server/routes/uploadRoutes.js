const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');
const { cloudinary, isConfigured } = require('../utils/cloudinary');

const router = express.Router();

const storage = isConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: { folder: 'sks-warm-content', resource_type: 'image' },
    })
  : multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;
