const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const ThemeSettings = require('../models/ThemeSettings');

// GET /api/theme-settings/public  (public — key:value map for the frontend)
const getPublicSections = asyncHandler(async (req, res) => {
  const items = await ThemeSettings.find({});
  const map = {};
  items.forEach((item) => {
    map[item.sectionKey] = item;
  });
  res.set('Cache-Control', 'public, max-age=60');
  res.json(map);
});

// GET /api/theme-settings  (protected — every section, for the admin manager)
const getAllSections = asyncHandler(async (req, res) => {
  const items = await ThemeSettings.find({}).sort({ sectionKey: 1 });
  res.json(items);
});

// GET /api/theme-settings/:sectionKey  (protected)
const getSection = asyncHandler(async (req, res) => {
  const section = await ThemeSettings.findOne({ sectionKey: req.params.sectionKey });
  if (!section) {
    res.status(404);
    throw new Error('Theme section not found');
  }
  res.json(section);
});

// PUT /api/theme-settings/:sectionKey  (protected — upsert)
const upsertSection = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { sectionKey } = req.params;
  const { title, subtitle, description, imageUrl, buttonText, buttonLink, items, extra } = req.body;

  const section = await ThemeSettings.findOneAndUpdate(
    { sectionKey },
    { sectionKey, title, subtitle, description, imageUrl, buttonText, buttonLink, items, extra },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(section);
});

module.exports = { getPublicSections, getAllSections, getSection, upsertSection };
