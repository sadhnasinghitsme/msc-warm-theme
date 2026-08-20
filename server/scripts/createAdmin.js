// One-time (or repeatable) script to create/update the admin account used to log into the dashboard.
// Usage: npm run create-admin
// Reads ADMIN_SEED_NAME / ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD from .env

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  const name = process.env.ADMIN_SEED_NAME || 'Admin';
  const email = (process.env.ADMIN_SEED_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in your .env before running this script.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_SEED_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let admin = await Admin.findOne({ email }).select('+password');

  if (admin) {
    admin.name = name;
    admin.password = password; // re-hashed by the pre-save hook
    await admin.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    admin = await Admin.create({ name, email, password });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
