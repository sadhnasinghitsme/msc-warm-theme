const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendNotificationEmail } = require('../utils/sendEmail');

// POST /api/contact  (public)
const createContact = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { name, email, phone, subject, message } = req.body;

  const contact = await Contact.create({ name, email, phone, subject, message });

  sendNotificationEmail({
    subject: `New contact message — ${name}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${subject || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${contact.message.replace(/\n/g, '<br>')}</p>
      <p><strong>Submitted:</strong> ${contact.createdAt.toLocaleString()}</p>
    `,
  });

  res.status(201).json({ message: 'Message sent successfully', contact });
});

// GET /api/contact  (protected)
const getContacts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Contact.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// PATCH /api/contact/:id  (protected)
const updateContact = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Message not found');
  }

  if (status !== undefined) contact.status = status;
  await contact.save();
  res.json(contact);
});

// DELETE /api/contact/:id  (protected)
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Message not found');
  }
  res.json({ message: 'Message deleted' });
});

module.exports = { createContact, getContacts, updateContact, deleteContact };
