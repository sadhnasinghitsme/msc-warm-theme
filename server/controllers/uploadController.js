const asyncHandler = require('express-async-handler');
const { isConfigured } = require('../utils/cloudinary');

// POST /api/upload  (protected) — only works if Cloudinary env vars are set.
// If not configured, admins can still paste a direct image URL into the content editor.
const uploadImage = asyncHandler(async (req, res) => {
  if (!isConfigured) {
    res.status(501);
    throw new Error(
      'Image upload is not configured on this server. Set CLOUDINARY_* env vars, or paste an image URL directly in the content editor.'
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  res.json({ url: req.file.path });
});

module.exports = { uploadImage };
