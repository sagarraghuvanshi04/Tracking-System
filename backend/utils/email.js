const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"TalentFlow AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

const sendApplicationConfirmation = (candidateEmail, candidateName, jobTitle) =>
  sendEmail({
    to: candidateEmail,
    subject: `Application Received - ${jobTitle}`,
    html: `<h2>Hi ${candidateName},</h2><p>We received your application for <strong>${jobTitle}</strong>. We'll review it and get back to you soon.</p><p>Best regards,<br/>TalentFlow AI Team</p>`,
  });

const sendInterviewInvite = (candidateEmail, candidateName, jobTitle, scheduledAt, meetingLink) =>
  sendEmail({
    to: candidateEmail,
    subject: `Interview Scheduled - ${jobTitle}`,
    html: `<h2>Hi ${candidateName},</h2><p>Your interview for <strong>${jobTitle}</strong> is scheduled for <strong>${new Date(scheduledAt).toLocaleString()}</strong>.</p>${meetingLink ? `<p>Meeting Link: <a href="${meetingLink}">${meetingLink}</a></p>` : ''}<p>Best regards,<br/>TalentFlow AI Team</p>`,
  });

const sendStatusUpdate = (candidateEmail, candidateName, jobTitle, newStage) => {
  const stageMessages = {
    screening: 'Your application is now under review by our team.',
    interview: 'Congratulations! You have been selected for an interview.',
    technical: 'You have advanced to the technical assessment stage.',
    offer: 'Great news! We are preparing an offer for you.',
    hired: 'Congratulations! You have been selected for this position.',
    rejected: 'Thank you for your interest. After careful consideration, we will not be moving forward with your application at this time.',
  };
  const message = stageMessages[newStage];
  if (!message) return;
  return sendEmail({
    to: candidateEmail,
    subject: `Application Update - ${jobTitle}`,
    html: `<h2>Hi ${candidateName},</h2><p>We have an update regarding your application for <strong>${jobTitle}</strong>.</p><p>${message}</p><p>Best regards,<br/>TalentFlow AI Team</p>`,
  });
};

module.exports = { sendEmail, sendApplicationConfirmation, sendInterviewInvite, sendStatusUpdate };
