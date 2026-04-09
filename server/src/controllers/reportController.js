const Report = require('../models/Report');
const User = require('../models/User');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { classifyImage } = require('../services/mlService');
const { uploadReportImage } = require('../services/cloudinaryService');
const { sendNewIssueEmail, sendEscalationEmail, sendRTIReadyEmail } = require('../services/emailService');
const { generateRTIPdf, daysBetween } = require('../services/rtiService');
const { getMunicipalContact } = require('../utils/municipalContacts');

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

  const municipalContact = getMunicipalContact(city || (report.location && report.location.city) || 'default');
  report.municipalEmail = municipalContact.email || process.env.AUTHORITY_EMAIL || '';
  report.municipalName = municipalContact.name || process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation';
  report.municipalState = municipalContact.state || 'India';
  await report.save();

  await User.updateOne({ _id: req.user._id }, { $inc: { reportsCount: 1 } });

  try {
    const reporter = await User.findById(req.user._id).select('name');
    const r = await sendNewIssueEmail(
      report,
      reporter,
      report.municipalEmail || process.env.AUTHORITY_EMAIL,
      report.municipalName || process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation'
    );
    if (r && r.ok) {
      report.emailSent = true;
      report.emailSentAt = new Date();
      await report.save();
    }
  } catch (e) {
    // never crash
  }

  res.status(201).json({ isDuplicate: false, reportId: report._id, ml });
}

async function generateRti(req, res) {
  try {
    const report = await Report.findById(req.params.id).populate('reporter', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!['pending', 'acknowledged'].includes(report.status)) {
      return res.status(400).json({ message: 'RTI allowed only for unresolved reports' });
    }

    const ageDays = daysBetween(new Date(), report.createdAt);
    if (ageDays < 5) return res.status(400).json({ message: 'RTI generation allowed only after 5 days' });

    if (!report.rtiGenerated) {
      const pdf = await generateRTIPdf(report, report.reporter);
      if (!pdf.url) return res.status(500).json({ message: 'Failed to generate RTI PDF' });

      report.rtiGenerated = true;
      report.rtiGeneratedAt = new Date();
      report.rtiPdfUrl = pdf.url;
      await report.save();

      try {
        const upvoterUsers = await User.find({ _id: { $in: report.upvotedBy || [] } }).select('email');
        const recipients = new Set();
        if (report.reporter?.email) recipients.add(report.reporter.email);
        upvoterUsers.forEach((u) => {
          if (u.email) recipients.add(u.email);
        });
        await sendRTIReadyEmail(report, [...recipients], pdf.url);
      } catch (e) {
        // never crash
      }
    }

    return res.json({ success: true, pdfUrl: report.rtiPdfUrl });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to generate RTI' });
  }
}

async function rtiStatus(req, res) {
  const report = await Report.findById(req.params.id).select('status createdAt rtiGenerated rtiGeneratedAt rtiPdfUrl');
  if (!report) return res.status(404).json({ message: 'Report not found' });
  const daysOld = daysBetween(new Date(), report.createdAt);
  const eligible = ['pending', 'acknowledged'].includes(report.status) && daysOld >= 5;
  res.json({
    rtiGenerated: Boolean(report.rtiGenerated),
    rtiGeneratedAt: report.rtiGeneratedAt || null,
    rtiPdfUrl: report.rtiPdfUrl || '',
    daysOld,
    eligible,
  });
}

async function downloadRti(req, res) {
  const report = await Report.findById(req.params.id).select('rtiGenerated rtiPdfUrl');
  if (!report) return res.status(404).json({ message: 'Report not found' });
  if (!report.rtiGenerated || !report.rtiPdfUrl) return res.status(404).json({ message: 'RTI not available' });

  const filename = `RTI-${String(report._id).slice(-8)}.pdf`;
  if (report.rtiPdfUrl.startsWith('/uploads/')) {
    const absolutePath = path.join(__dirname, '..', '..', report.rtiPdfUrl);
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ message: 'RTI file not found' });
    return res.download(absolutePath, filename);
  }

   try {
    const remote = await axios.get(report.rtiPdfUrl, {
      responseType: 'stream',
      validateStatus: (s) => s === 200,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    remote.data.on('error', (err) => {
      console.error('[downloadRti] stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ message: 'Stream interrupted' });
      else res.end();
    });
    remote.data.pipe(res);
  } catch (e) {
    console.error('[downloadRti] failed. URL:', report.rtiPdfUrl, 'Error:', e.message, 'Status:', e.response?.status);
    return res.status(500).json({ message: 'Failed to download RTI PDF', detail: e.message });
  }

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
  generateRti,
  rtiStatus,
  downloadRti,
  upvoteReport,
  deleteReport,
};

