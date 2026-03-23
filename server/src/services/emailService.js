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

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-IN') : '';
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildIssueDetails(report, reporterName) {
  const loc = report.location || {};
  const gps = Array.isArray(loc.coordinates) ? `${loc.coordinates[1] || 0}, ${loc.coordinates[0] || 0}` : 'N/A';
  return `
    <div style="border:1px solid #eee;border-radius:8px;padding:14px;background:#fff;">
      <p style="margin:0 0 6px;"><b>Issue:</b> ${escapeHtml(report.title)}</p>
      <p style="margin:0 0 6px;"><b>Category:</b> ${escapeHtml(report.category)}</p>
      <p style="margin:0 0 6px;"><b>Description:</b> ${escapeHtml(report.description).replaceAll('\n', '<br/>')}</p>
      <p style="margin:0 0 6px;"><b>Location:</b> ${escapeHtml([loc.address, loc.ward ? `Ward ${loc.ward}` : '', loc.city].filter(Boolean).join(', ') || 'N/A')}</p>
      <p style="margin:0 0 6px;"><b>GPS:</b> ${escapeHtml(gps)}</p>
      <p style="margin:0 0 6px;"><b>Upvotes:</b> ${Number(report.upvotes || 0)}</p>
      <p style="margin:0;"><b>Reporter:</b> ${escapeHtml(reporterName || 'Anonymous')}</p>
    </div>
  `;
}

function emailLayout({ title, bannerColor = '#e84b2e', bannerText = '', bodyHtml = '' }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8f8f8;padding:20px;color:#212121;">
      <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
        <div style="background:#e84b2e;color:#fff;padding:14px 18px;font-weight:700;font-size:20px;">CitySnap Civic Alert</div>
        ${bannerText ? `<div style="background:${bannerColor};color:#fff;padding:10px 18px;font-weight:600;">${bannerText}</div>` : ''}
        <div style="padding:18px;">
          <h2 style="margin:0 0 14px;font-size:20px;">${escapeHtml(title)}</h2>
          ${bodyHtml}
          <p style="margin-top:20px;color:#666;font-size:12px;">Reported via CitySnap Civic Issue Platform</p>
        </div>
      </div>
    </div>
  `;
}

function unresolvedDays(report) {
  if (!report?.createdAt) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
}

function issueLink(report) {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base}/report/${report._id}`;
}

function municipalLine(report, municipalName) {
  const city = report?.location?.city || process.env.MUNICIPAL_CITY || 'India';
  const state = report?.municipalState || 'India';
  return `
    <div style="margin:10px 0 14px;padding:10px 12px;background:#f7f7f7;border-radius:8px;border:1px solid #eee;">
      <div><b>To:</b> ${escapeHtml(municipalName || 'Municipal Corporation')}</div>
      <div><b>Region:</b> ${escapeHtml(city)}, ${escapeHtml(state)}</div>
    </div>
  `;
}

async function sendNewIssueEmail(report, reporter, authorityEmail, municipalName) {
  const to = authorityEmail || process.env.AUTHORITY_EMAIL;
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!to) return { ok: false, message: 'AUTHORITY_EMAIL not set' };
  const reporterName = reporter?.name || 'Anonymous';
  const image = report.images?.[0] || '';
  const url = issueLink(report);

  return safeSendMail({
    from,
    to,
    subject: `[CitySnap] New Civic Issue Reported: ${report.category} in ${(report.location && report.location.ward) || 'Unknown ward'}`,
    html: emailLayout({
      title: 'A new civic issue was reported',
      bodyHtml: `
        ${municipalLine(report, municipalName)}
        ${buildIssueDetails(report, reporterName)}
        ${image ? `<p style="margin:14px 0 8px;"><b>Issue Photo:</b></p><img src="${escapeHtml(image)}" alt="Issue image" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" />` : ''}
        <p style="margin:14px 0 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#e84b2e;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">View Issue</a></p>
      `,
    }),
  });
}

async function sendReminderEmail(report, authorityEmail, municipalName) {
  const to = authorityEmail || process.env.AUTHORITY_EMAIL;
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!to) return { ok: false, message: 'AUTHORITY_EMAIL not set' };
  const days = unresolvedDays(report);
  const url = issueLink(report);
  return safeSendMail({
    from,
    to,
    subject: `[CitySnap] ⏰ REMINDER: Unresolved Issue (72hrs) - ${report.title}`,
    html: emailLayout({
      title: '72-hour unresolved issue reminder',
      bannerColor: '#f59e0b',
      bannerText: 'Action required: issue pending beyond 72 hours',
      bodyHtml: `
        ${municipalLine(report, municipalName)}
        ${buildIssueDetails(report)}
        <p><b>Pending for:</b> ${days} day(s)</p>
        <p><b>Citizens affected:</b> ${Number(report.upvotes || 0)}</p>
        <p><a href="${escapeHtml(url)}">Open issue and update status</a></p>
        <p style="color:#9a3412;"><b>Please acknowledge this issue within 24 hours to avoid escalation.</b></p>
      `,
    }),
  });
}

async function sendWarningEmail(report, authorityEmail, municipalName) {
  const to = [authorityEmail || process.env.AUTHORITY_EMAIL, process.env.SENIOR_AUTHORITY_EMAIL].filter(Boolean).join(',');
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  if (!to) return { ok: false, message: 'Authority emails not set' };
  const days = unresolvedDays(report);
  const url = issueLink(report);
  return safeSendMail({
    from,
    to,
    subject: `[CitySnap] ⚠️ FINAL WARNING: RTI will be filed in 48 hours - ${report.title}`,
    html: emailLayout({
      title: 'Final warning before RTI escalation',
      bannerColor: '#dc2626',
      bannerText: 'FINAL WARNING',
      bodyHtml: `
        ${municipalLine(report, municipalName)}
        ${buildIssueDetails(report)}
        <p>This issue has been unresolved for <b>${days}</b> days. If no action is taken within 48 hours, an RTI application will be automatically generated and made available to the citizen.</p>
        <p><a href="${escapeHtml(url)}">Resolve this issue now</a></p>
        <p style="color:#991b1b;"><b>This is your final notice before RTI escalation.</b></p>
      `,
    }),
  });
}

async function sendRTIReadyEmail(report, recipientEmails, rtiPdfUrl) {
  const from = process.env.EMAIL_FROM || 'noreply@citysnap.com';
  const to = (recipientEmails || []).filter(Boolean).join(',');
  if (!to) return { ok: false, message: 'No RTI recipients' };
  const loc = report.location || {};
  return safeSendMail({
    from,
    to,
    subject: `[CitySnap] 📋 Your RTI Application is Ready - ${report.title}`,
    html: emailLayout({
      title: 'Your RTI application is ready',
      bannerColor: '#e84b2e',
      bannerText: 'RTI Document Available',
      bodyHtml: `
        <p>Under the Right to Information Act, 2005, you may now seek official accountability for this unresolved issue.</p>
        ${buildIssueDetails(report)}
        <p><b>Issue Date:</b> ${formatDate(report.createdAt)}<br/><b>Location:</b> ${escapeHtml([loc.address, loc.ward ? `Ward ${loc.ward}` : '', loc.city].filter(Boolean).join(', '))}</p>
        <p><a href="${escapeHtml(rtiPdfUrl)}">Download RTI PDF</a></p>
        <p>Submission help: file this RTI with your municipal corporation or through the National RTI portal: <a href="https://rtionline.gov.in">https://rtionline.gov.in</a>.</p>
      `,
    }),
  });
}

async function sendNewReportEmail(report) {
  return sendNewIssueEmail(report, null, report?.municipalEmail, report?.municipalName);
}

async function sendEscalationEmail(report) {
  return sendReminderEmail(report, report?.municipalEmail, report?.municipalName);
}

function reportHtml(report) {
  const loc = report.location || {};
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <p><b>Title:</b> ${escapeHtml(report.title)}</p>
      <p><b>Category:</b> ${escapeHtml(report.category)}</p>
      <p><b>Status:</b> ${escapeHtml(report.status)}</p>
      <p><b>Location:</b> ${escapeHtml([loc.address, loc.ward, loc.city].filter(Boolean).join(', '))}</p>
      <p><b>Description:</b><br/>${escapeHtml(report.description).replaceAll('\n', '<br/>')}</p>
    </div>
  `;
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

module.exports = {
  sendNewIssueEmail,
  sendReminderEmail,
  sendWarningEmail,
  sendRTIReadyEmail,
  sendNewReportEmail,
  sendEscalationEmail,
  sendResolutionEmail,
};

