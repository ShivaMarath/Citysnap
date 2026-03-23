const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { runAllCronTasksOnce } = require('../services/cronService');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/citysnap';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log(`[${new Date().toISOString()}] Connected to MongoDB`);
  await runAllCronTasksOnce();
  await mongoose.disconnect();
  console.log(`[${new Date().toISOString()}] Cron run complete`);
}

main().catch(async (e) => {
  console.error('cron:run-once failed', e);
  try {
    await mongoose.disconnect();
  } catch (err) {
    // ignore
  }
  process.exit(1);
});
