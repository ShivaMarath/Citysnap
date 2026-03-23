const nodemailer = require('nodemailer');

function makeTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function safeSendMail(options) {
  try {
    const transporter = makeTransporter();
    if (!transporter) return { ok: false, message: 'Email not configured' };
    await transporter.sendMail(options);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message || 'Email send failed' };
  }
}

function reportHtml(report) {
  const loc = report.location || {};
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>CitySnap Report</h2>
      <p><b>Title:</b> ${escapeHtml(report.title)}</p>
      <p><b>Category:</b> ${escapeHtml(report.category)}</p>
      <p><b>Status:</b> ${escapeHtml(report.status)}</p>
      <p><b>Priority:</b> ${escapeHtml(report.priority || 'low')}</p>
      <p><b>Upvotes:</b> ${Number(report.upvotes || 0)}</p>
      <p><b>Location:</b> ${escapeHtml([loc.address, loc.ward, loc.city].filter(Boolean).join(', '))}</p>
      <p><b>Description:</b><br/>${escapeHtml(report.description).replaceAll('\n', '<br/>')}</p>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendNewReportEmail(report) {
  const to = process.env.AUTHORITY_EMAIL;
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!to) return { ok: false, message: 'AUTHORITY_EMAIL not set' };
  return safeSendMail({
    from,
    to,
    subject: `New civic issue reported: ${report.title}`,
    html: reportHtml(report),
  });
}

async function sendEscalationEmail(report) {
  const to = process.env.AUTHORITY_EMAIL;
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!to) return { ok: false, message: 'AUTHORITY_EMAIL not set' };
  return safeSendMail({
    from,
    to,
    subject: `Priority escalation: ${report.title} (${report.priority})`,
    html: `
      ${reportHtml(report)}
      <p><b>Escalation:</b> Upvotes reached ${Number(report.upvotes || 0)}.</p>
    `,
  });
}

async function sendResolutionEmail({ report, recipients }) {
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!Array.isArray(recipients) || recipients.length === 0) return { ok: false, message: 'No recipients' };

  return safeSendMail({
    from,
    to: recipients.join(','),
    subject: `Resolved: ${report.title}`,
    html: `
      ${reportHtml(report)}
      <p><b>Update:</b> This issue has been marked <b>resolved</b>. Thank you for helping improve your city.</p>
    `,
  });
}

module.exports = { sendNewReportEmail, sendEscalationEmail, sendResolutionEmail };

