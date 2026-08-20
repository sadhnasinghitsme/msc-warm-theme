const express = require('express');
const {
  getPublicContent,
  getAllContentAdmin,
  upsertContent,
  deleteContent,
} = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPublicContent);
router.get('/admin', protect, getAllContentAdmin);
router.put('/:key', protect, upsertContent);
router.delete('/:key', protect, deleteContent);

module.exports = router;
