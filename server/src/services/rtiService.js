const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;

function ensureCloudinaryConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return false;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysBetween(a, b) {
  const ms = Math.max(0, new Date(a).getTime() - new Date(b).getTime());
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

async function uploadPdfToCloudinary(localPath) {
  try {
    if (!ensureCloudinaryConfigured()) return null;
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'citysnap/rti',
      resource_type: 'raw',
      access_mode: 'public',
      use_filename: true,
      unique_filename: true,
    });
    console.log(`[Cloudinary] RTI PDF uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (e) {
    console.warn(`[Cloudinary] RTI PDF upload failed. Using local fallback. Reason: ${e.message || 'unknown error'}`);
    return null;
  }
}

async function generateRTIPdf(report, reporter) {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'rti');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const now = new Date();
    const reportId = String(report._id || '').slice(-8).toUpperCase();
    const appNo = `RTI-${reportId}-${now.toISOString().slice(0, 10).replaceAll('-', '')}`;
    const filename = `rti-${report._id}-${Date.now()}.pdf`;
    const localPath = path.join(uploadsDir, filename);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(localPath);
      doc.pipe(stream);

      const createdAt = report.createdAt ? new Date(report.createdAt) : new Date();
      const unresolvedDays = daysBetween(now, createdAt);
      const reporterName = (reporter && reporter.name) || process.env.RTI_APPLICANT_DEFAULT || 'Citizen';
      const loc = report.location || {};
      const fullAddress = [loc.address, loc.ward ? `Ward ${loc.ward}` : '', loc.city].filter(Boolean).join(', ');
      const coords = Array.isArray(loc.coordinates) ? `${loc.coordinates[1] || 0}, ${loc.coordinates[0] || 0}` : 'N/A';

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#e84b2e').text('APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005', {
        align: 'center',
      });
      doc.moveDown(0.8);
      doc.font('Helvetica').fontSize(11).fillColor('#111111').text(`Application Number: ${appNo}`);
      doc.text(`Date: ${formatDate(now)}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('To,');
      doc.font('Helvetica').text('The Public Information Officer');
      doc.text(process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation');
      doc.text(process.env.MUNICIPAL_CITY || loc.city || 'City');
      doc.moveDown();

      doc.font('Helvetica-Bold').text(`Subject: Request for information regarding unresolved civic issue - ${report.title}`);
      doc.moveDown();

      doc
        .font('Helvetica')
        .text(
          `I, ${reporterName}, a citizen of India, hereby request the following information under the Right to Information Act, 2005:`,
          { align: 'justify' }
        );
      doc.moveDown(0.7);

      const questions = [
        `What is the current status of the civic issue titled '${report.title}' reported at ${fullAddress || 'the provided location'} on ${formatDate(createdAt)}?`,
        `What action has been taken by the concerned department since the issue was reported on ${formatDate(createdAt)}?`,
        `Who is the officer responsible for resolving issues in Ward ${loc.ward || 'N/A'}?`,
        'What is the expected timeline for resolution of this issue?',
        `Why has this issue remained unresolved for ${unresolvedDays} days despite ${Number(report.upvotes || 0)} citizen reports?`,
        'Please provide copies of all correspondence, orders, and action taken reports related to this issue.',
      ];
      questions.forEach((q, idx) => doc.text(`${idx + 1}. ${q}`, { align: 'justify' }));
      doc.moveDown();

      doc.text(`The issue has been reported by ${Number(report.upvotes || 0)} citizens and remains unresolved as of ${formatDate(now)}.`, {
        align: 'justify',
      });
      doc.moveDown(0.7);
      doc.text('I request that the above information be provided within 30 days as mandated by Section 7(1) of the RTI Act, 2005.', {
        align: 'justify',
      });
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Applicant Details');
      doc.font('Helvetica');
      doc.text(`Name: ${reporterName}`);
      doc.text(`Issue ID: ${report._id}`);
      doc.text(`Date of Original Report: ${formatDate(createdAt)}`);
      doc.text(`Location: ${fullAddress || 'Not specified'}`);
      doc.text(`GPS Coordinates: ${coords}`);
      doc.text(`Category: ${report.category}`);
      doc.text(`Number of Citizens Affected: ${Number(report.upvotes || 0)}`);
      doc.moveDown();

      doc.font('Helvetica').fontSize(10).fillColor('#333333').text('Submitted via CitySnap Civic Issue Reporting Platform');
      doc.text(`Date: ${formatDate(now)}`);
      doc.text('Signature: _________________________');
      doc.moveDown(0.5);
      doc.text('Note: RTI fee of Rs.10 may be required. You can pay via postal order or online at rtionline.gov.in');

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { url: `/uploads/rti/${path.basename(localPath)}`, localPath };
  } catch (e) {
    return { url: '', localPath: '', error: e.message || 'Failed to generate RTI PDF' };
  }
}

module.exports = { generateRTIPdf, daysBetween };
