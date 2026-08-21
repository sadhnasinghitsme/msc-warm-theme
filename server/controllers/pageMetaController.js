const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const PageMeta = require('../models/PageMeta');

// GET /api/page-meta  (protected)
const getAllPageMeta = asyncHandler(async (req, res) => {
  const items = await PageMeta.find({}).sort({ pagePath: 1 });
  res.json(items);
});

// GET /api/page-meta/:id  (protected)
const getPageMeta = asyncHandler(async (req, res) => {
  const item = await PageMeta.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Page meta entry not found');
  }
  res.json(item);
});

// POST /api/page-meta  (protected)
const createPageMeta = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { pagePath, title, metaDescription, canonicalUrl, ogImage } = req.body;

  const item = await PageMeta.create({
    pagePath,
    title: title || '',
    metaDescription: metaDescription || '',
    canonicalUrl: canonicalUrl || '',
    ogImage: ogImage || '',
  });

  res.status(201).json(item);
});

// PATCH /api/page-meta/:id  (protected)
const updatePageMeta = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const item = await PageMeta.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Page meta entry not found');
  }

  const { title, metaDescription, canonicalUrl, ogImage } = req.body;
  if (title !== undefined) item.title = title;
  if (metaDescription !== undefined) item.metaDescription = metaDescription;
  if (canonicalUrl !== undefined) item.canonicalUrl = canonicalUrl;
  if (ogImage !== undefined) item.ogImage = ogImage;

  await item.save();
  res.json(item);
});

// DELETE /api/page-meta/:id  (protected)
const deletePageMeta = asyncHandler(async (req, res) => {
  const item = await PageMeta.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Page meta entry not found');
  }
  res.json({ message: 'Page meta entry deleted' });
});

module.exports = { getAllPageMeta, getPageMeta, createPageMeta, updatePageMeta, deletePageMeta };
