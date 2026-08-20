// Seeds the Content collection with the editable blocks the frontend already looks for
// (see index.html data-content-key attributes and script.js loadDynamicContent()).
// Safe to re-run: existing values are left untouched (only inserts missing keys).
// Usage: npm run seed-content

require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('../models/Content');

const DEFAULTS = [
  {
    key: 'hero.title',
    label: 'Hero heading',
    type: 'text',
    value: 'MSc Medical Admissions 2026 — SKS International University, Mathura',
  },
  {
    key: 'hero.desc',
    label: 'Hero description paragraph',
    type: 'richtext',
    value:
      "Build your career in Medical Anatomy, Physiology, Biochemistry, or Microbiology at SKS International University. Our MSc Medical programs follow the NMC's Competency-Based Medical Education (CBME) framework across three academic phases, combining foundational medical science with specialized, hands-on training. Applications for the 2026 batch are now open.",
  },
  {
    key: 'about.paragraph1',
    label: 'About section — paragraph 1',
    type: 'richtext',
    value:
      'SKS International University is located in Mathura, Uttar Pradesh, spread across a 50-acre campus. The university offers NMC-regulated MSc Medical programs through its Department of Medical & Allied Health Sciences, including MSc Medical Anatomy, Physiology, Biochemistry, Microbiology.',
  },
  {
    key: 'about.paragraph2',
    label: 'About section — paragraph 2',
    type: 'richtext',
    value:
      'Students are taught by an experienced faculty of 350+ members and have access to more than 20 dedicated academic labs, a well-stocked central library, and full residential campus facilities.',
  },
  {
    key: 'contact.phone',
    label: 'Admission helpline phone number',
    type: 'text',
    value: '+91-9068569915',
  },
  {
    key: 'contact.tollfree',
    label: 'Toll-free number',
    type: 'text',
    value: '1800-889-0478',
  },
  {
    key: 'contact.email',
    label: 'Contact email address',
    type: 'text',
    value: 'contact@sksinternationaluniversity.ac.in',
  },
  {
    key: 'header.logo',
    label: 'Header logo image URL',
    type: 'image',
    value: 'images/sks-logo-white.png',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const item of DEFAULTS) {
    const result = await Content.updateOne(
      { key: item.key },
      { $setOnInsert: item },
      { upsert: true }
    );
    if (result.upsertedCount) {
      console.log(`Inserted: ${item.key}`);
    } else {
      console.log(`Already exists, skipped: ${item.key}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
