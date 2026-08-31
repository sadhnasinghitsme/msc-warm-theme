const mongoose = require('mongoose');

const navPageSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true, trim: true },
    heading: { type: String, trim: true },
    subheading: { type: String, trim: true },
    // Body text blocks, keyed per the admin panel's field config for that page
    // (e.g. { missionText: '...', visionText: '...' }) — shape varies per page.
    textBlocks: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // Image URLs, keyed the same way (e.g. { bannerImage: 'https://...' }).
    images: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // Repeatable rows for pages built around a list (people cards, department
    // rosters) — shape varies per pageKey, kept loose on purpose (same
    // approach as ThemeSettings.items).
    items: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NavPage', navPageSchema, 'navpages');
