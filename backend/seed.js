const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Job = require('./models/Job');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create admin user
  const existing = await User.findOne({ email: 'admin@talentflow.ai' });
  if (!existing) {
    await User.create({ name: 'Admin User', email: 'admin@talentflow.ai', password: 'admin123', role: 'admin' });
    console.log('Admin created: admin@talentflow.ai / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Create recruiter
  let recruiter = await User.findOne({ email: 'recruiter@talentflow.ai' });
  if (!recruiter) {
    recruiter = await User.create({ name: 'Sarah Recruiter', email: 'recruiter@talentflow.ai', password: 'recruiter123', role: 'recruiter' });
    console.log('Recruiter created: recruiter@talentflow.ai / recruiter123');
  } else {
    console.log('Recruiter already exists');
  }

  console.log('\nSeed complete!');
  console.log('Login: admin@talentflow.ai / admin123');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
