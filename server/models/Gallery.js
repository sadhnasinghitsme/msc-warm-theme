const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    cloudinaryId: { type: String, trim: true },
    caption: { type: String, trim: true },
    altText: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gallerySchema.index({ order: 1 });

module.exports = mongoose.model('Gallery', gallerySchema, 'gallery');
