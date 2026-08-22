const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Program = require('../models/Program');

// GET /api/programs  (protected — every program, for the admin manager)
const getAllPrograms = asyncHandler(async (req, res) => {
  const items = await Program.find({}).sort({ order: 1, createdAt: 1 });
  res.json(items);
});

// GET /api/programs/public  (public — active only, for the homepage)
const getPublicPrograms = asyncHandler(async (req, res) => {
  const items = await Program.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  res.set('Cache-Control', 'public, max-age=60');
  res.json(items);
});

// POST /api/programs  (protected)
const createProgram = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const {
    name, description, duration, eligibility, coreSyllabus, careerScope,
    primaryRecruiters, avgPackage, imageUrl, isActive,
  } = req.body;
  let { order } = req.body;

  if (order === undefined) {
    const last = await Program.findOne({}).sort({ order: -1 });
    order = last ? last.order + 1 : 0;
  }

  const program = await Program.create({
    name, description, duration, eligibility,
    coreSyllabus: coreSyllabus || [],
    careerScope: careerScope || [],
    primaryRecruiters, avgPackage, imageUrl, order,
    isActive: isActive === undefined ? true : isActive,
  });

  res.status(201).json(program);
});

// PATCH /api/programs/:id  (protected)
const updateProgram = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const program = await Program.findById(req.params.id);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }

  const fields = [
    'name', 'description', 'duration', 'eligibility', 'coreSyllabus', 'careerScope',
    'primaryRecruiters', 'avgPackage', 'imageUrl', 'order', 'isActive',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) program[field] = req.body[field];
  });

  await program.save();
  res.json(program);
});

// DELETE /api/programs/:id  (protected)
const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findByIdAndDelete(req.params.id);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  res.json({ message: 'Program deleted' });
});

module.exports = { getAllPrograms, getPublicPrograms, createProgram, updateProgram, deleteProgram };
