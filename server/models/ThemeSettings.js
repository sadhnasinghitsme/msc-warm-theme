const mongoose = require('mongoose');

const themeSettingsSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, required: true, unique: true, trim: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    buttonText: { type: String, trim: true },
    buttonLink: { type: String, trim: true },
    // Repeatable sub-items for sections made of a list (feature cards, process
    // steps, badges) — shape varies per sectionKey, kept loose on purpose.
    items: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    // Section-specific flat fields that don't fit the columns above (e.g.
    // contact's phone/tollfree/email/address/mapLink).
    extra: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ThemeSettings', themeSettingsSchema, 'themesettings');
