const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

// Fire-and-forget notification email. Never throws — a failed email must not
// block a form submission from being saved and acknowledged to the visitor.
async function sendNotificationEmail({ subject, html }) {
  const t = getTransporter();
  const to = process.env.NOTIFY_EMAIL_TO;

  if (!t || !to) {
    console.warn('Email not configured (EMAIL_HOST/USER/PASS/NOTIFY_EMAIL_TO) — skipping notification email.');
    return;
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
}

module.exports = { sendNotificationEmail };
