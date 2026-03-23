const Report = require('../models/Report');
const User = require('../models/User');
const { classifyImage } = require('../services/mlService');
const { uploadReportImage } = require('../services/cloudinaryService');
const { sendNewReportEmail, sendEscalationEmail } = require('../services/emailService');

function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function listReports(req, res) {
  const { category, status, ward, city, page = 1, limit = 12, sort = 'new' } = req.query || {};
  const q = {};
  if (category) q.category = category;
  if (status) q.status = status;
  if (ward) q['location.ward'] = ward;
  if (city) q['location.city'] = city;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limit) || 12));

  const sortMap = {
    new: { createdAt: -1 },
    upvotes: { upvotes: -1, createdAt: -1 },
    priority: { priority: -1, upvotes: -1, createdAt: -1 },
  };
  const s = sortMap[sort] || sortMap.new;

  const [items, total] = await Promise.all([
    Report.find(q).sort(s).skip((p - 1) * l).limit(l),
    Report.countDocuments(q),
  ]);

  res.json({ items, total, page: p, limit: l });
}

async function stats(req, res) {
  const [total, resolved, dupLike] = await Promise.all([
    Report.countDocuments({}),
    Report.countDocuments({ status: 'resolved' }),
    Report.countDocuments({ upvotes: { $gte: 2 } }),
  ]);
  const duplicateRate = total === 0 ? 0 : dupLike / total;
  res.json({ total, resolved, duplicateRate });
}

async function myReports(req, res) {
  const items = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  res.json({ items });
}

async function getReport(req, res) {
  const report = await Report.findById(req.params.id)
    .populate('reporter', 'name email ward city avatar role')
    .populate('statusHistory.updatedBy', 'name role');
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ report });
}

async function createReport(req, res) {
  const { title, description, category, address, ward, city, lat, lng } = req.body || {};
  if (!title || !description || !category) return res.status(400).json({ message: 'Missing required fields' });

  const latN = parseNumber(lat);
  const lngN = parseNumber(lng);
  if (latN === null || lngN === null) return res.status(400).json({ message: 'Invalid lat/lng' });

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) return res.status(400).json({ message: 'At least one image is required' });

  // 1) ML classify (never crash)
  const ml = await classifyImage({ imagePath: files[0].path, userCategory: category });

  // 2) Upload all images (Cloudinary with local fallback)
  const uploads = await Promise.all(files.map((f) => uploadReportImage(f.path)));
  const imageUrls = uploads.map((u) => u.url).filter(Boolean);

  // 3) Choose category
  const finalCategory = ml && ml.confidence > 0.4 && ml.category ? ml.category : category;

  // 4) Duplicate detection ($near, 50m, not resolved)
  const dup = await Report.findOne({
    category: finalCategory,
    status: { $ne: 'resolved' },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lngN, latN] },
        $maxDistance: 50,
      },
    },
  });

  if (dup) {
    // 5) If duplicate found: upvote it (prevent self & duplicates)
    const isSelf = String(dup.reporter) === String(req.user._id);
    const already = dup.upvotedBy.some((id) => String(id) === String(req.user._id));

    let crossedThreshold = false;
    if (!isSelf && !already) {
      const before = dup.upvotes || 0;
      dup.upvotes = before + 1;
      dup.upvotedBy.push(req.user._id);
      if (!dup.witnesses.some((id) => String(id) === String(req.user._id))) dup.witnesses.push(req.user._id);
      crossedThreshold = before < 5 && dup.upvotes >= 5;
      await dup.save();

      await User.updateOne({ _id: req.user._id }, { $inc: { upvotesGiven: 1 } });
    } else {
      if (!dup.witnesses.some((id) => String(id) === String(req.user._id))) {
        dup.witnesses.push(req.user._id);
        await dup.save();
      }
    }

    if (crossedThreshold && !dup.escalationEmailSent) {
      try {
        await sendEscalationEmail(dup);
        dup.escalationEmailSent = true;
        await dup.save();
      } catch (e) {
        // never crash
      }
    }

    return res.status(200).json({
      isDuplicate: true,
      reportId: dup._id,
      ml,
    });
  }

  // 6) Create new report + email (never crash)
  const report = await Report.create({
    title,
    description,
    category: finalCategory,
    mlCategory: ml && ml.category ? ml.category : 'other',
    mlConfidence: ml && typeof ml.confidence === 'number' ? ml.confidence : 0,
    mlRawClass: ml && ml.rawClass ? ml.rawClass : '',
    images: imageUrls,
    location: {
      type: 'Point',
      coordinates: [lngN, latN],
      address: address || '',
      ward: ward || '',
      city: city || '',
    },
    reporter: req.user._id,
    upvotes: 1,
    upvotedBy: [req.user._id],
    witnesses: [req.user._id],
    statusHistory: [{ status: 'pending', updatedBy: req.user._id, note: 'Created' }],
  });

  await User.updateOne({ _id: req.user._id }, { $inc: { reportsCount: 1 } });

  try {
    const r = await sendNewReportEmail(report);
    if (r && r.ok) {
      report.emailSent = true;
      await report.save();
    }
  } catch (e) {
    // never crash
  }

  res.status(201).json({ isDuplicate: false, reportId: report._id, ml });
}

async function upvoteReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  if (String(report.reporter) === String(req.user._id)) return res.status(400).json({ message: 'Cannot upvote your own report' });
  if (report.upvotedBy.some((id) => String(id) === String(req.user._id))) {
    return res.status(400).json({ message: 'Already upvoted' });
  }

  const before = report.upvotes || 0;
  report.upvotes = before + 1;
  report.upvotedBy.push(req.user._id);
  if (!report.witnesses.some((id) => String(id) === String(req.user._id))) report.witnesses.push(req.user._id);

  const crossedThreshold = before < 5 && report.upvotes >= 5;
  await report.save();
  await User.updateOne({ _id: req.user._id }, { $inc: { upvotesGiven: 1 } });

  if (crossedThreshold && !report.escalationEmailSent) {
    try {
      await sendEscalationEmail(report);
      report.escalationEmailSent = true;
      await report.save();
    } catch (e) {
      // never crash
    }
  }

  res.json({ ok: true, upvotes: report.upvotes, priority: report.priority });
}

async function deleteReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  const canDelete = req.user.role === 'authority' || String(report.reporter) === String(req.user._id);
  if (!canDelete) return res.status(403).json({ message: 'Forbidden' });

  await report.deleteOne();
  res.json({ ok: true });
}

module.exports = {
  listReports,
  stats,
  myReports,
  getReport,
  createReport,
  upvoteReport,
  deleteReport,
};

