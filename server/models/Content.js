const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'richtext', 'image'], default: 'text' },
    value: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
