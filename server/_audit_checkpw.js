require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = process.env.ADMIN_SEED_EMAIL.toLowerCase();
  const admin = await Admin.findOne({ email }).select('+password');
  console.log('found admin:', !!admin, admin && admin.email);
  console.log('seed password from env:', JSON.stringify(process.env.ADMIN_SEED_PASSWORD));
  if (admin) {
    const match = await admin.matchPassword(process.env.ADMIN_SEED_PASSWORD);
    console.log('matches:', match);
  }
  await mongoose.disconnect();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
