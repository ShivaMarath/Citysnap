const cron = require('node-cron');
const Report = require('../models/Report');
const { sendReminderEmail, sendWarningEmail, sendRTIReadyEmail } = require('./emailService');
const { generateRTIPdf } = require('./rtiService');

function ts() {
  return new Date().toISOString();
}

function cutoff(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function computePriority(upvotes) {
  if (upvotes >= 20) return 'critical';
  if (upvotes >= 10) return 'high';
  if (upvotes >= 5) return 'medium';
  return 'low';
}

async function run72HourReminder() {
  try {
    const items = await Report.find({
      status: 'pending',
      createdAt: { $lte: cutoff(72) },
      reminderEmailSent: false,
    }).limit(100);
    for (const report of items) {
      const sent = await sendReminderEmail(
        report,
        report.municipalEmail || process.env.AUTHORITY_EMAIL,
        report.municipalName || process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation'
      );
      if (sent.ok) {
        report.reminderEmailSent = true;
        report.emailSentAt = new Date();
        await report.save();
      }
      console.log(`[${ts()}] 72hr reminder ${sent.ok ? 'sent' : 'skipped'} for ${report._id}`);
    }
  } catch (e) {
    console.error(`[${ts()}] 72hr reminder task failed`, e.message);
  }
}

async function run5DayWarning() {
  try {
    const items = await Report.find({
      status: { $in: ['pending', 'acknowledged'] },
      createdAt: { $lte: cutoff(120) },
      warningEmailSent: false,
    }).limit(100);
    for (const report of items) {
      const sent = await sendWarningEmail(
        report,
        report.municipalEmail || process.env.AUTHORITY_EMAIL,
        report.municipalName || process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation'
      );
      if (sent.ok) {
        report.warningEmailSent = true;
        report.emailSentAt = new Date();
        await report.save();
      }
      console.log(`[${ts()}] 5-day warning ${sent.ok ? 'sent' : 'skipped'} for ${report._id}`);
    }
  } catch (e) {
    console.error(`[${ts()}] 5-day warning task failed`, e.message);
  }
}

async function run7DayRTI() {
  try {
    const items = await Report.find({
      status: { $in: ['pending', 'acknowledged'] },
      createdAt: { $lte: cutoff(168) },
      rtiGenerated: false,
    })
      .populate('reporter', 'name email')
      .populate('upvotedBy', 'email')
      .limit(50);

    for (const report of items) {
      const pdf = await generateRTIPdf(report, report.reporter);
      if (!pdf.url) {
        console.log(`[${ts()}] RTI generation failed for ${report._id}`);
        continue;
      }
      report.rtiGenerated = true;
      report.rtiGeneratedAt = new Date();
      report.rtiPdfUrl = pdf.url;
      await report.save();

      const recipients = new Set();
      if (report.reporter && report.reporter.email) recipients.add(report.reporter.email);
      (report.upvotedBy || []).forEach((u) => {
        if (u && u.email) recipients.add(u.email);
      });
      const list = [...recipients];
      await sendRTIReadyEmail(report, list, pdf.url);
      console.log(`[${ts()}] RTI generated and notified for ${report._id}`);
    }
  } catch (e) {
    console.error(`[${ts()}] 7-day RTI task failed`, e.message);
  }
}

async function runPriorityRecalc() {
  try {
    const items = await Report.find({}).select('_id upvotes priority').limit(2000);
    let changed = 0;
    for (const report of items) {
      const expected = computePriority(report.upvotes || 0);
      if (report.priority !== expected) {
        report.priority = expected;
        await report.save();
        changed += 1;
      }
    }
    console.log(`[${ts()}] Priority recalc complete. Updated ${changed} report(s).`);
  } catch (e) {
    console.error(`[${ts()}] Priority recalc task failed`, e.message);
  }
}

async function runAllCronTasksOnce() {
  await run72HourReminder();
  await run5DayWarning();
  await run7DayRTI();
  await runPriorityRecalc();
}

function startCronJobs() {
  cron.schedule('0 * * * *', async () => {
    console.log(`[${ts()}] Running hourly cron tasks`);
    await runAllCronTasksOnce();
  });
  console.log(`[${ts()}] Cron jobs started (hourly)`);
}

module.exports = {
  startCronJobs,
  runAllCronTasksOnce,
  run72HourReminder,
  run5DayWarning,
  run7DayRTI,
  runPriorityRecalc,
};
