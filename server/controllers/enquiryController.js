const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Enquiry = require('../models/Enquiry');
const { sendNotificationEmail } = require('../utils/sendEmail');

// POST /api/enquiries  (public)
const createEnquiry = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { name, phone, email, specialization, source } = req.body;

  const enquiry = await Enquiry.create({
    name,
    phone,
    email,
    specialization: specialization || 'Not specified',
    source: source || 'other',
  });

  sendNotificationEmail({
    subject: `New admission enquiry — ${name}`,
    html: `
      <h2>New Admission Enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email || 'Not provided'}</p>
      <p><strong>Specialization:</strong> ${enquiry.specialization}</p>
      <p><strong>Source:</strong> ${enquiry.source}</p>
      <p><strong>Submitted:</strong> ${enquiry.createdAt.toLocaleString()}</p>
    `,
  });

  res.status(201).json({ message: 'Enquiry submitted successfully', enquiry });
});

// GET /api/enquiries  (protected)
const getEnquiries = asyncHandler(async (req, res) => {
  const { status, specialization, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (specialization) filter.specialization = specialization;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Enquiry.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/enquiries/:id  (protected)
const getEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  res.json(enquiry);
});

// PATCH /api/enquiries/:id  (protected)
const updateEnquiry = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }

  if (status !== undefined) enquiry.status = status;
  if (notes !== undefined) enquiry.notes = notes;

  await enquiry.save();
  res.json(enquiry);
});

// DELETE /api/enquiries/:id  (protected)
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  res.json({ message: 'Enquiry deleted' });
});

module.exports = { createEnquiry, getEnquiries, getEnquiry, updateEnquiry, deleteEnquiry };
