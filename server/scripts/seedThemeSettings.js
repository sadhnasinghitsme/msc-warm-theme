// Seeds the ThemeSettings collection with the homepage sections the frontend looks for
// (see index.html data-section-key attributes and script.js loadThemeSettings()).
// Safe to re-run: existing sections are left untouched (only inserts missing ones).
//
// Hero and Contact are special cases — they used to live in the Content
// collection (hero.title/hero.desc, contact.phone/contact.tollfree/contact.email).
// This script migrates any existing values over to ThemeSettings, then removes
// the old Content entries so there's a single source of truth.
//
// Also removes the old "founder" section (dropped — no Founder section exists
// on the homepage). Usage: npm run seed-theme-settings

require('dotenv').config();
const mongoose = require('mongoose');
const ThemeSettings = require('../models/ThemeSettings');
const Content = require('../models/Content');

const DEFAULTS = {
  hero: {
    title: 'MSc Medical Admissions 2026 — SKS International University, Mathura',
    description:
      "Build your career in Medical Anatomy, Physiology, Biochemistry, or Microbiology at SKS International University. Our MSc Medical programs follow the NMC's Competency-Based Medical Education (CBME) framework across three academic phases, combining foundational medical science with specialized, hands-on training. Applications for the 2026 batch are now open.",
    buttonText: 'Check My Eligibility',
    buttonLink: '#enquiry-form',
  },
  whyUs: {
    subtitle: 'Why SKS',
    title: 'Why Choose SKS International University',
    items: [
      { imageUrl: 'images/why-choose/lab-training-new.jpg', title: 'Dedicated Subject Labs', description: 'Separate, well-equipped laboratories for Microbiology, Biochemistry, Anatomy, Physiology give students focused, hands-on training in their chosen specialization.' },
      { imageUrl: 'images/why-choose/experienced-faculty-lecture.jpeg', title: 'Experienced Faculty', description: 'Learn from a faculty of 350+ academicians and researchers with strong subject expertise across all science departments.' },
      { imageUrl: 'images/why-choose/residential-campus.webp', title: 'Full Residential Campus', description: "Boys' and girls' hostels, a cafeteria, gymnasium, bank, and 24/7 security are all available on campus, so students can focus on their studies without commuting concerns." },
      { imageUrl: 'images/why-choose/admission-process-new.jpg', title: 'Simple, Fast Admission Process', description: 'Apply online, receive a callback within 15 minutes, and get your seat confirmed digitally — no long queues or paperwork delays.' },
      { imageUrl: 'images/why-choose/library-resources-new.jpg', title: 'Well-Stocked Library and Study Resources', description: 'Access to over 9,600 books and thousands of e-books supports both coursework and research.' },
    ],
  },
  faq: {
    subtitle: 'Questions',
    title: 'Frequently Asked Questions',
  },
  stats: {},
  process: {
    subtitle: 'Process',
    title: 'How to Apply — Admission Process',
    items: [
      { title: 'Fill the Enquiry Form', description: "Share your basic details and let us know which MSc specialization you're interested in." },
      { title: 'Get a Counsellor Call', description: 'Our admission counsellor will call you within 15 minutes to verify your eligibility and answer your questions.' },
      { title: 'Document Verification', description: 'Upload your mark sheets and ID proof online for verification.' },
      { title: 'Fee Payment and Seat Confirmation', description: 'Complete your fee payment through our secure online options to confirm your seat.' },
      { title: 'Begin Your MSc Journey', description: 'Receive your admission letter and orientation schedule, and get ready to start your program.' },
    ],
  },
  clinical: {
    subtitle: 'Clinical Training',
    title: 'Train Inside a Real, Working Hospital — Where Your Phase-I Syllabus Comes to Life',
    description:
      "What sets SKS International University apart is direct access to a real, functioning hospital. SKS Hospital Medical College & Research Centre, on the same campus, is a 950-bed multi-specialty hospital with active OPD, IPD, ICU, NICU, PICU, and Emergency & Trauma departments. Since Phase-I of every MSc Medical specialization follows the same foundational Anatomy, Physiology, and Biochemistry syllabus used in NMC's MBBS CBME curriculum, studying alongside a real hospital environment gives students clinical context most postgraduate science programs can't offer.",
    items: [
      { title: '950-Bed Multi-Specialty Hospital' },
      { title: 'OPD & IPD Departments (overall multi-speciality)' },
      { title: 'ICU, NICU & PICU Units' },
      { title: '24/7 Emergency & Trauma Care' },
      { title: 'On-Site Blood Bank' },
      { title: 'Digital Diagnostic Facilities (X-Ray, Path Lab, MRI, CT)' },
    ],
  },
  contact: {
    extra: {
      phone: '+91-9068569915',
      tollfree: '1800-889-0478',
      email: 'contact@sksinternationaluniversity.ac.in',
      address: 'A Unit of SKS Group, Mathura\n21 Mile Stone, NH-2, Village Chaumuhan, Tehsil Chhata, Mathura – 281406, Uttar Pradesh',
      mapLink: 'https://www.google.com/maps?q=SKS+International+University,+NH-2,+Village+Chaumuhan,+Tehsil+Chhata,+Mathura,+Uttar+Pradesh&output=embed',
    },
  },
};

async function migrateFromContent(sectionKey, defaults, contentKeyMap) {
  const overrides = {};
  for (const [field, contentKey] of Object.entries(contentKeyMap)) {
    const existing = await Content.findOne({ key: contentKey });
    if (existing?.value) {
      if (field.startsWith('extra.')) {
        overrides.extra = overrides.extra || {};
        overrides.extra[field.slice('extra.'.length)] = existing.value;
      } else {
        overrides[field] = existing.value;
      }
    }
  }

  const merged = {
    sectionKey,
    ...defaults,
    ...overrides,
    ...(overrides.extra ? { extra: { ...defaults.extra, ...overrides.extra } } : {}),
  };

  const result = await ThemeSettings.updateOne(
    { sectionKey },
    { $setOnInsert: merged },
    { upsert: true }
  );
  console.log(result.upsertedCount ? `Inserted: ${sectionKey}` : `Already exists, skipped: ${sectionKey}`);

  for (const contentKey of Object.values(contentKeyMap)) {
    const deleted = await Content.deleteOne({ key: contentKey });
    if (deleted.deletedCount) console.log(`Removed old Content entry: ${contentKey}`);
  }
}

async function removeFounder() {
  const result = await ThemeSettings.deleteOne({ sectionKey: 'founder' });
  if (result.deletedCount) console.log('Removed dropped section: founder');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  await migrateFromContent('hero', DEFAULTS.hero, { title: 'hero.title', description: 'hero.desc' });
  await migrateFromContent('contact', DEFAULTS.contact, {
    'extra.phone': 'contact.phone',
    'extra.tollfree': 'contact.tollfree',
    'extra.email': 'contact.email',
  });
  await removeFounder();

  for (const sectionKey of Object.keys(DEFAULTS)) {
    if (sectionKey === 'hero' || sectionKey === 'contact') continue;
    const result = await ThemeSettings.updateOne(
      { sectionKey },
      { $setOnInsert: { sectionKey, ...DEFAULTS[sectionKey] } },
      { upsert: true }
    );
    console.log(result.upsertedCount ? `Inserted: ${sectionKey}` : `Already exists, skipped: ${sectionKey}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
