const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    duration: { type: String, trim: true },
    eligibility: { type: String, trim: true },
    coreSyllabus: { type: [String], default: [] },
    careerScope: { type: [String], default: [] },
    primaryRecruiters: { type: String, trim: true },
    avgPackage: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programSchema.index({ order: 1 });

module.exports = mongoose.model('Program', programSchema, 'programs');
