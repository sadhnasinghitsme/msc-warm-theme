const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'read', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
