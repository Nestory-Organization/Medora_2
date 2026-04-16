/**
 * One-off: create the first admin user (not exposed over HTTP).
 * Usage from auth-service folder:
 *   MONGO_URI=... ADMIN_SEED_EMAIL=admin@example.com ADMIN_SEED_PASSWORD='...' node scripts/create-admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

async function main() {
  const uri = process.env.MONGO_URI;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!uri || !email || !password) {
    console.error('Missing MONGO_URI, ADMIN_SEED_EMAIL, or ADMIN_SEED_PASSWORD');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('User with this email already exists; exiting without changes.');
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    email: email.toLowerCase(),
    password,
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'admin',
    doctorVerificationStatus: 'n_a'
  });

  console.log('Admin user created.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
