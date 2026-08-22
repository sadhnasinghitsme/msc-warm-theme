// Seeds the Programs collection with the 4 MSc specializations the homepage
// course-tabs section already lists in hardcoded HTML.
// Safe to re-run: only inserts if the collection is empty.
// Usage: npm run seed-programs

require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('../models/Program');

const DEFAULTS = [
  {
    name: 'MSc Medical Microbiology',
    description: "A three-year postgraduate program covering the study of microorganisms and their role in human health and disease. Students gain practical training in the university's dedicated Microbiology labs across all three academic phases.",
    duration: '3 Academic Years (Phase I, II & III)',
    eligibility: 'B.Sc. (Biological Sciences) / MBBS / BDS / BAMS / BHMS / BPT / BOT / B.Pharma / B.Sc. Nursing / B.Sc. Biotech / B.V.Sc / B.Sc. MLT, minimum 55% marks',
    coreSyllabus: ['General Bacteriology', 'Systematic Bacteriology', 'Medical Virology', 'Mycology', 'Parasitology', 'Immunology & Serology', 'Hospital Infection Control & Applied Microbiology'],
    careerScope: ['Medical Microbiologist', 'Infection Control Officer', 'Quality Analyst', 'Clinical Research Analyst'],
    primaryRecruiters: 'Hospitals & Diagnostic Chains, Vaccine Manufacturing Units, Public Health Labs, Clinical Research Officer',
    avgPackage: 'INR 4.5 – 20 LPA',
    imageUrl: 'images/course-tabs/microbiology.webp',
    order: 0,
  },
  {
    name: 'MSc Medical Biochemistry',
    description: "A three-year postgraduate program focused on the chemical processes within living organisms, from clinical biochemistry to molecular biology. Students train in the university's dedicated Biochemistry lab across all three academic phases.",
    duration: '3 Academic Years (Phase I, II & III)',
    eligibility: 'B.Sc. (Biological Sciences) / MBBS / BDS / BAMS / BHMS / BPT / BOT / B.Pharma / B.Sc. Nursing / B.Sc. Biotech / B.V.Sc / B.Sc. MLT, minimum 50% marks',
    coreSyllabus: ['Clinical Biochemistry', 'Intermediary Metabolism', 'Enzymology & Endocrinology', 'Molecular Biology & Genetics', 'Advanced Diagnostic Techniques & Immunology'],
    careerScope: ['Clinical Biochemist', 'Laboratory Director / Manager', 'Assistant Professor', 'Quality Control Specialist'],
    primaryRecruiters: 'Corporate Hospitals, Chain Diagnostic Labs (Dr Lal, Pathkind), Pharmaceutical Multinationals, Biotech Labs',
    avgPackage: 'INR 4.0 – 20 LPA',
    imageUrl: 'images/course-tabs/biochemistry-new.jpg',
    order: 1,
  },
  {
    name: 'MSc Medical Anatomy',
    description: "A three-year postgraduate program covering the structure of the human body in depth, from gross anatomy to medical genetics. Students train in the university's Anatomy lab and dissection facilities across all three academic phases.",
    duration: '3 Academic Years (Phase I, II & III)',
    eligibility: 'B.Sc. (Biological Sciences) / MBBS / BDS / BAMS / BHMS / BPT / BOT / B.Pharma / B.Sc. Nursing / B.Sc. Biotech / B.V.Sc / B.Sc. MLT, minimum 55% marks',
    coreSyllabus: ['Human Gross Anatomy', 'Embryology & Developmental Biology', 'Histology & Microscopic Anatomy', 'Neuroanatomy', 'Medical Genetics', 'Surface & Radiological Anatomy'],
    careerScope: ['Assistant Professor / Lecturer in Medical & Dental Colleges', 'Medical Writer', 'Anatomist', 'Clinical Geneticist', 'Research Scientist'],
    primaryRecruiters: 'Medical Colleges, Dental Institutions, Research Institutes, Healthcare Publishing & Ed-Tech Firms',
    avgPackage: 'INR 4.5 – 20 LPA',
    imageUrl: 'images/course-tabs/anatomy-new.jpg',
    order: 2,
  },
  {
    name: 'MSc Medical Physiology',
    description: "A three-year postgraduate program covering the functions and mechanisms of the human body, from neurophysiology to sports and environmental physiology. Students train in the university's dedicated Physiology lab across all three academic phases.",
    duration: '3 Academic Years (Phase I, II & III)',
    eligibility: 'B.Sc. (Biological Sciences) / MBBS / BDS / BAMS / BHMS / BPT / BOT / B.Pharma / B.Sc. Nursing / B.Sc. Biotech / B.V.Sc / B.Sc. MLT, minimum 55% marks',
    coreSyllabus: ['General & Systemic Physiology', 'Neurophysiology & Special Senses', 'Cardiovascular & Respiratory Physiology', 'Renal & Endocrine Physiology', 'Exercise & Environmental Physiology'],
    careerScope: ['Assistant Professor / Lecturer', 'Clinical Physiologist', 'Research Scientist', 'Sports Physiology Consultant'],
    primaryRecruiters: 'Medical Colleges, Diagnostic Labs, Sports Academies, Clinical Research Officer',
    avgPackage: 'INR 4.5 – 20 LPA',
    imageUrl: 'images/course-tabs/physiology.webp',
    order: 3,
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existingCount = await Program.countDocuments({});
  if (existingCount > 0) {
    console.log(`Programs collection already has ${existingCount} document(s) — skipping seed.`);
  } else {
    await Program.insertMany(DEFAULTS);
    console.log(`Inserted ${DEFAULTS.length} programs.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
