const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Gallery = require('../models/Gallery');
const { cloudinary, isConfigured } = require('../utils/cloudinary');

// GET /api/gallery  (protected — all images, for the admin manager)
const getAllImages = asyncHandler(async (req, res) => {
  const items = await Gallery.find({}).sort({ order: 1, createdAt: 1 });
  res.json(items);
});

// POST /api/gallery  (protected) — upload image + save to DB
const createImage = asyncHandler(async (req, res) => {
  if (!isConfigured) {
    res.status(501);
    throw new Error('Image upload is not configured on this server. Set CLOUDINARY_* env vars.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No image file uploaded');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { caption, altText } = req.body;
  let { order } = req.body;

  if (order === undefined) {
    const last = await Gallery.findOne({}).sort({ order: -1 });
    order = last ? last.order + 1 : 0;
  }

  const image = await Gallery.create({
    imageUrl: req.file.path,
    cloudinaryId: req.file.filename,
    caption,
    altText,
    order,
  });

  res.status(201).json(image);
});

// PUT /api/gallery/:id  (protected)
const updateImage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const image = await Gallery.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error('Gallery image not found');
  }

  const { caption, altText, order, isActive } = req.body;
  if (caption !== undefined) image.caption = caption;
  if (altText !== undefined) image.altText = altText;
  if (order !== undefined) image.order = order;
  if (isActive !== undefined) image.isActive = isActive;

  await image.save();
  res.json(image);
});

// DELETE /api/gallery/:id  (protected) — removes from DB and Cloudinary
const deleteImage = asyncHandler(async (req, res) => {
  const image = await Gallery.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error('Gallery image not found');
  }

  if (image.cloudinaryId && isConfigured) {
    await cloudinary.uploader.destroy(image.cloudinaryId, { invalidate: true });
  }

  await image.deleteOne();
  res.json({ message: 'Gallery image deleted' });
});

module.exports = { getAllImages, createImage, updateImage, deleteImage };
