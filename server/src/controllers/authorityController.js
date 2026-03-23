const Report = require('../models/Report');
const User = require('../models/User');
const { sendResolutionEmail } = require('../services/emailService');

async function dashboard(req, res) {
  const [total, pending, inProgress, resolved] = await Promise.all([
    Report.countDocuments({}),
    Report.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'in_progress' }),
    Report.countDocuments({ status: 'resolved' }),
  ]);

  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;

  const byCategory = await Report.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const recent = await Report.find({}).sort({ createdAt: -1 }).limit(10);
  const topIssues = await Report.find({ status: { $ne: 'resolved' } }).sort({ upvotes: -1, createdAt: -1 }).limit(10);

  res.json({
    stats: { total, pending, inProgress, resolved, resolutionRate },
    byCategory,
    recent,
    topIssues,
  });
}

async function listReports(req, res) {
  const { status, priority, category, ward, page = 1, limit = 20 } = req.query || {};
  const q = {};
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (category) q.category = category;
  if (ward) q['location.ward'] = ward;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));

  const [items, total] = await Promise.all([
    Report.find(q).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    Report.countDocuments(q),
  ]);

  res.json({ items, total, page: p, limit: l });
}

async function updateStatus(req, res) {
  const { status, note } = req.body || {};
  if (!status) return res.status(400).json({ message: 'Missing status' });

  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  report.status = status;
  if (typeof note === 'string' && note.trim()) report.authorityNote = note.trim();
  report.statusHistory.push({ status, updatedBy: req.user._id, note: (note || '').trim() });

  if (status === 'resolved') report.resolvedAt = new Date();
  await report.save();

  if (status === 'resolved') {
    try {
      const populated = await Report.findById(report._id).populate('upvotedBy', 'email');
      const recipients = (populated.upvotedBy || []).map((u) => u.email).filter(Boolean);
      await sendResolutionEmail({ report: populated, recipients });
    } catch (e) {
      // never crash
    }
  }

  res.json({ ok: true, report });
}

async function listCivilians(req, res) {
  const users = await User.find({ role: 'civilian' }).select('-password').sort({ createdAt: -1 }).limit(500);
  res.json({ users });
}

module.exports = { dashboard, listReports, updateStatus, listCivilians };

