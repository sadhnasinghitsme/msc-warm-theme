const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.index({ order: 1 });

// Collection name pinned explicitly — build-faqs.js reads it directly with
// the native driver and needs the name to be stable (see PageMeta.js).
module.exports = mongoose.model('Faq', faqSchema, 'faqs');
