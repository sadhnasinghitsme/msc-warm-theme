// One-time migration: the site's FAQ accordion currently ships as static
// <details> markup in index.html (see the FAQ:START/FAQ:END block) and was
// never entered into the Faq collection, so FAQ Manager in the admin panel
// has nothing to show. This inserts those same 11 FAQs into MongoDB so they
// become editable there and so build-faqs.js starts sourcing them from the
// database on future deploys instead of falling back to the static copy.
// Safe to re-run: matches on exact question text and only inserts what's missing.
// Usage: npm run seed-faqs

require('dotenv').config();
const mongoose = require('mongoose');
const Faq = require('../models/Faq');

const DEFAULTS = [
  {
    question: 'Is entrance exam required for MSc Medical Microbiology admission?',
    answer:
      'Admission to MSc Medical Microbiology at SKS International University is based on your qualifying degree marks and eligibility criteria. Our counsellor will confirm the exact selection process for your application.',
  },
  {
    question: 'What is the eligibility for MSc Medical Biochemistry admission?',
    answer:
      'Candidates need a qualifying degree — B.Sc. (Biological Sciences), MBBS, BDS, BAMS, BHMS, BPT, BOT, B.Pharma, B.Sc. Nursing, B.Sc. Biotech, B.V.Sc, or B.Sc. MLT — with a minimum of 55% marks.',
  },
  {
    question: 'How long is the MSc Medical program?',
    answer:
      "All MSc Medical programs at SKS International University run for 3 academic years, structured across Phase-I, Phase-II, and Phase-III, following the NMC's Competency-Based Medical Education (CBME) framework.",
  },
  {
    question: 'Can MBBS, BDS, or BAMS graduates apply for MSc Medical programs?',
    answer:
      'Yes. MBBS, BDS, BAMS, BHMS, BPT, BOT, and several other professional degree holders are on the official qualifying degree list for MSc Medical admission, alongside B.Sc. (Biological Sciences) graduates.',
  },
  {
    question: 'What is the last date for MSc Medical admission 2026?',
    answer:
      'Seats for the 2026 batch are limited and being filled on a rolling basis. Apply early to secure your preferred specialization.',
  },
  {
    question: 'What is the attendance requirement for MSc Medical programs?',
    answer:
      'A compulsory 80% attendance is required in both theory and practical components separately. Candidates not meeting this requirement are not permitted to appear in examinations.',
  },
  {
    question: 'What documents are required to apply for MSc Medical Physiology?',
    answer:
      'You will need your qualifying degree mark sheets, a valid ID proof, and passport-size photographs. Our counsellor will share the complete document checklist after your enquiry.',
  },
  {
    question: 'Do you provide hostel facilities for MSc Medical students?',
    answer:
      "Yes, separate boys' and girls' hostels are available on campus along with cafeteria, security, and other residential facilities.",
  },
  {
    question: 'What is the fee structure for MSc Medical courses?',
    answer:
      'Fee details vary by specialization. Please fill the enquiry form to receive the exact fee structure and information on available scholarships.',
  },
  {
    question: 'What career opportunities are available after MSc Medical programs?',
    answer:
      'Career scope varies by specialization and includes roles such as Assistant Professor/Lecturer, Clinical Biochemist, Medical Microbiologist, and Research Scientist, with average starting packages ranging from INR 4.0–20 LPA depending on specialization and role.',
  },
  {
    question: 'Does SKS International University have its own hospital for practical training?',
    answer:
      'Yes. SKS Hospital Medical College & Research Centre, located on the same campus, is a 950-bed multi-specialty hospital with OPD, IPD, ICU, NICU, PICU, and Emergency departments. MSc Medical students get direct exposure to real clinical and diagnostic environments as part of their practical training.',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (let i = 0; i < DEFAULTS.length; i++) {
    const item = DEFAULTS[i];
    const result = await Faq.updateOne(
      { question: item.question },
      { $setOnInsert: { ...item, order: i, isActive: true } },
      { upsert: true }
    );
    if (result.upsertedCount) {
      console.log(`Inserted: ${item.question}`);
    } else {
      console.log(`Already exists, skipped: ${item.question}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
