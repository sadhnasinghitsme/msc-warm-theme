const mongoose = require('mongoose');

// pagePath is the HTML file's path relative to the frontend project root
// (e.g. "index.html") — this is what build-meta.js uses to find the file
// to inject into at deploy time.
const pageMetaSchema = new mongoose.Schema(
  {
    pagePath: { type: String, required: true, unique: true, trim: true },
    title: { type: String, trim: true, maxlength: 200, default: '' },
    metaDescription: { type: String, trim: true, maxlength: 400, default: '' },
    canonicalUrl: { type: String, trim: true, default: '' },
    ogImage: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Collection name is pinned explicitly (rather than left to Mongoose's
// auto-pluralization) because build-meta.js reads this collection directly
// with the native driver and needs the name to be stable.
module.exports = mongoose.model('PageMeta', pageMetaSchema, 'pagemetas');
