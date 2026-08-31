const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const NavPage = require('../models/NavPage');

// GET /api/nav-pages  (protected — every page, for the admin manager)
const getAllPages = asyncHandler(async (req, res) => {
  const items = await NavPage.find({}).sort({ pageKey: 1 });
  res.json(items);
});

// GET /api/nav-pages/:pageKey  (protected)
const getPage = asyncHandler(async (req, res) => {
  const page = await NavPage.findOne({ pageKey: req.params.pageKey });
  if (!page) {
    res.status(404);
    throw new Error('Page not found');
  }
  res.json(page);
});

// PUT /api/nav-pages/:pageKey  (protected — upsert)
const upsertPage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { pageKey } = req.params;
  const { heading, subheading, textBlocks, images, items } = req.body;

  const page = await NavPage.findOneAndUpdate(
    { pageKey },
    { pageKey, heading, subheading, textBlocks, images, items },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(page);
});

module.exports = { getAllPages, getPage, upsertPage };
