const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');

// GET /api/content  (public — key:value map for the frontend to consume)
const getPublicContent = asyncHandler(async (req, res) => {
  const items = await Content.find({});
  const map = {};
  items.forEach((item) => {
    map[item.key] = item.value;
  });
  res.set('Cache-Control', 'public, max-age=60');
  res.json(map);
});

// GET /api/content/admin  (protected — full docs for the editor UI)
const getAllContentAdmin = asyncHandler(async (req, res) => {
  const items = await Content.find({}).sort({ key: 1 });
  res.json(items);
});

// PUT /api/content/:key  (protected — upsert)
const upsertContent = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { label, type, value } = req.body;

  if (!label) {
    res.status(400);
    throw new Error('label is required');
  }

  const content = await Content.findOneAndUpdate(
    { key },
    { key, label, type: type || 'text', value: value ?? '' },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(content);
});

// DELETE /api/content/:key  (protected)
const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findOneAndDelete({ key: req.params.key });
  if (!content) {
    res.status(404);
    throw new Error('Content block not found');
  }
  res.json({ message: 'Content block deleted' });
});

module.exports = { getPublicContent, getAllContentAdmin, upsertContent, deleteContent };
