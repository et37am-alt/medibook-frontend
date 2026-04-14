const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Email Templates ──────────────────────────────────────────────────────────

const welcomeEmail = (userName) => ({
  subject: '👋 Welcome to MediBook!',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:26px;">🏥 MediBook</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Your health, our priority</p>
      </div>
      <div style="background:#fff;padding:36px;border-radius:0 0 12px 12px;text-align:center;">
        <h2 style="color:#222;">Welcome, ${userName}! 🎉</h2>
        <p style="color:#555;line-height:1.7;">Your account has been created. You can now browse doctors and book appointments online.</p>
        <a href="http://localhost:3000/doctors"
           style="display:inline-block;margin-top:20px;background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          Find a Doctor →
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:24px;">— The MediBook Team</p>
      </div>
    </div>
  `,
});

const bookingConfirmationEmail = (userName, doctorName, specialization, date, timeSlot, fees) => ({
  subject: '✅ Appointment Confirmed – MediBook',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🏥 MediBook — Appointment Confirmed</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#333;">Hi <strong>${userName}</strong>,</p>
        <p style="color:#555;">Your appointment has been booked successfully!</p>
        <div style="background:#e8f0fe;border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;width:140px;">👨‍⚕️ Doctor</td><td style="font-weight:700;color:#222;">Dr. ${doctorName}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">🏥 Specialization</td><td style="font-weight:600;color:#1a73e8;">${specialization}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">📅 Date</td><td style="font-weight:700;color:#222;">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">🕐 Time</td><td style="font-weight:700;color:#222;">${timeSlot}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">💰 Fees</td><td style="font-weight:700;color:#222;">₹${fees}</td></tr>
          </table>
        </div>
        <p style="color:#555;font-size:14px;">Please arrive 10 minutes early. Carry a valid ID and previous medical records.</p>
        <a href="http://localhost:3000/appointments"
           style="display:inline-block;margin-top:16px;background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          View My Appointments
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:24px;">— The MediBook Team</p>
      </div>
    </div>
  `,
});

const cancellationEmail = (userName, doctorName, date, timeSlot, reason) => ({
  subject: '❌ Appointment Cancelled – MediBook',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#c62828;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🏥 MediBook — Appointment Cancelled</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#333;">Hi <strong>${userName}</strong>,</p>
        <p style="color:#555;">Your appointment has been cancelled.</p>
        <div style="background:#ffebee;border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;width:140px;">👨‍⚕️ Doctor</td><td style="font-weight:700;color:#222;">Dr. ${doctorName}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">📅 Date</td><td style="font-weight:700;color:#222;">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">🕐 Time</td><td style="font-weight:700;color:#222;">${timeSlot}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">📝 Reason</td><td style="color:#c62828;">${reason || 'Cancelled by user'}</td></tr>
          </table>
        </div>
        <a href="http://localhost:3000/doctors"
           style="display:inline-block;margin-top:16px;background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          Book a New Appointment
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:24px;">— The MediBook Team</p>
      </div>
    </div>
  `,
});

const statusUpdateEmail = (userName, doctorName, date, timeSlot, newStatus) => ({
  subject: `📋 Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} – MediBook`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🏥 MediBook — Status Update</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#333;">Hi <strong>${userName}</strong>,</p>
        <p style="color:#555;">Your appointment status has been updated.</p>
        <div style="background:#e8f0fe;border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;width:140px;">👨‍⚕️ Doctor</td><td style="font-weight:700;color:#222;">Dr. ${doctorName}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">📅 Date</td><td style="font-weight:700;color:#222;">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">🕐 Time</td><td style="font-weight:700;color:#222;">${timeSlot}</td></tr>
            <tr><td style="padding:8px 0;color:#555;">📌 New Status</td><td style="font-weight:700;color:#1a73e8;text-transform:capitalize;">${newStatus}</td></tr>
          </table>
        </div>
        <a href="http://localhost:3000/appointments"
           style="display:inline-block;margin-top:16px;background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          View My Appointments
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:24px;">— The MediBook Team</p>
      </div>
    </div>
  `,
});

// ── Send Email ───────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log(`📧 [Email skipped - not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"MediBook 🏥" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} | ID: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email error: ${err.message}`);
  }
};

module.exports = {
  sendEmail,
  welcomeEmail,
  bookingConfirmationEmail,
  cancellationEmail,
  statusUpdateEmail,
};
