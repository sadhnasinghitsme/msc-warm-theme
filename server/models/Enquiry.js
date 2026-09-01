const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    // Extended fields captured by the Admission Enquiry form (optional).
    session: { type: String, trim: true, default: '' },
    fatherName: { type: String, trim: true, default: '' },
    dob: { type: String, trim: true, default: '' },
    admissionClass: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    specialization: {
      type: String,
      enum: ['Microbiology', 'Biochemistry', 'Anatomy', 'Physiology', 'Not specified'],
      default: 'Not specified',
    },
    source: {
      type: String,
      enum: ['hero-quick-form', 'enquiry-section', 'scroll-popup', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'enrolled', 'closed'],
      default: 'new',
    },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Enquiry', enquirySchema);
