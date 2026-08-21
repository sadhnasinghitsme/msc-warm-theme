const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Faq = require('../models/Faq');

// GET /api/faqs  (protected — every FAQ, for the admin manager)
const getAllFaqs = asyncHandler(async (req, res) => {
  const items = await Faq.find({}).sort({ order: 1, createdAt: 1 });
  res.json(items);
});

// GET /api/faqs/public  (public — active only, for the site + build script)
const getPublicFaqs = asyncHandler(async (req, res) => {
  const items = await Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  res.set('Cache-Control', 'public, max-age=60');
  res.json(items);
});

// POST /api/faqs  (protected)
const createFaq = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { question, answer, isActive } = req.body;
  let { order } = req.body;

  if (order === undefined) {
    const last = await Faq.findOne({}).sort({ order: -1 });
    order = last ? last.order + 1 : 0;
  }

  const faq = await Faq.create({
    question,
    answer,
    order,
    isActive: isActive === undefined ? true : isActive,
  });

  res.status(201).json(faq);
});

// PATCH /api/faqs/:id  (protected)
const updateFaq = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const faq = await Faq.findById(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error('FAQ not found');
  }

  const { question, answer, order, isActive } = req.body;
  if (question !== undefined) faq.question = question;
  if (answer !== undefined) faq.answer = answer;
  if (order !== undefined) faq.order = order;
  if (isActive !== undefined) faq.isActive = isActive;

  await faq.save();
  res.json(faq);
});

// DELETE /api/faqs/:id  (protected)
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error('FAQ not found');
  }
  res.json({ message: 'FAQ deleted' });
});

module.exports = { getAllFaqs, getPublicFaqs, createFaq, updateFaq, deleteFaq };
