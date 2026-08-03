import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: 'Verify Your Email - InternLink',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #6366f1;">Welcome to InternLink!</h2>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const sendInterviewScheduledEmail = async (email, candidateName, jobTitle, interview) => {
  const isOnline = interview.interviewType === 'online';
  const interviewDate = formatDate(interview.date);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Interview Scheduled - ${jobTitle} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #6366f1;">Interview Scheduled</h2>
        <p>Dear ${candidateName},</p>
        <p>Your interview for the <strong>${jobTitle}</strong> position has been scheduled.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Interview Type</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.interviewType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interviewDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Time</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.time} (${interview.timezone || 'UTC'})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Duration</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.duration || '30 minutes'}</td></tr>
          ${interview.interviewer ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Interviewer</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.interviewer}</td></tr>` : ''}
          ${isOnline && interview.meetingLink ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Meeting Link</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="${interview.meetingLink}" style="color: #6366f1;">${interview.meetingLink}</a></td></tr>` : ''}
          ${!isOnline && interview.location ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Location</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.location}</td></tr>` : ''}
        </table>
        ${interview.notes ? `<p style="color: #666; font-size: 14px;"><strong>Notes:</strong> ${interview.notes}</p>` : ''}
        <p style="margin-top: 20px;">Please ${interview.status === 'pending-confirmation' ? 'confirm your attendance' : 'prepare for this interview'}.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
           View Interview Details
        </a>
        <p style="color: #666; font-size: 14px;">You will receive reminders 24 hours and 1 hour before the interview.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendInterviewCancelledEmail = async (email, candidateName, jobTitle, interview) => {
  const interviewDate = formatDate(interview.date);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Interview Cancelled - ${jobTitle} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #ef4444;">Interview Cancelled</h2>
        <p>Dear ${candidateName},</p>
        <p>Your interview for the <strong>${jobTitle}</strong> position has been cancelled.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interviewDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Time</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.time}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">You will be notified of any future scheduling changes.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
           View Details
        </a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendInterviewRescheduledEmail = async (email, candidateName, jobTitle, interview) => {
  const interviewDate = formatDate(interview.date);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Interview Rescheduled - ${jobTitle} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #f59e0b;">Interview Rescheduled</h2>
        <p>Dear ${candidateName},</p>
        <p>Your interview for the <strong>${jobTitle}</strong> position has been rescheduled.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>New Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interviewDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Time</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.time} (${interview.timezone || 'UTC'})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Duration</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${interview.duration || '30 minutes'}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Please update your calendar accordingly.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
           View Interview Details
        </a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const sendOfferSentEmail = async (email, candidateName, offer) => {
  const companyName = offer.companyId?.companyName || 'Our Company';
  const jobTitle = offer.jobId?.title || 'the position';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/student/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Job Offer - ${jobTitle} at ${companyName}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #6366f1;">Congratulations, ${candidateName}!</h2>
        <p>We are pleased to extend an offer for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Offer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Position</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${jobTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Company</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${companyName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Base Salary</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatCurrency(offer.salary?.baseSalary || 0, offer.salary?.currency || 'USD')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Joining Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(offer.joiningDate)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Offer Valid Until</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(offer.expiryDate)}</td></tr>
          </table>
        </div>

        <p>Please review the complete offer details and respond by the expiry date.</p>
        <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Offer</a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">If you have any questions, feel free to reach out to us.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOfferAcceptedEmail = async (email, recruiterName, offer) => {
  const candidateName = offer.candidateId?.name || 'Candidate';
  const jobTitle = offer.jobId?.title || 'the position';
  const companyName = offer.companyId?.companyName || 'Our Company';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/recruiter/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Offer Accepted - ${candidateName} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #16a34a;">Offer Accepted!</h2>
        <p>Dear ${recruiterName},</p>
        <p>Great news! <strong>${candidateName}</strong> has accepted the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Offer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Candidate</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${candidateName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Position</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${jobTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Salary</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatCurrency(offer.salary?.baseSalary || 0, offer.salary?.currency || 'USD')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Joining Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(offer.joiningDate)}</td></tr>
          </table>
        </div>

        <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Offer Details</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOfferRejectedEmail = async (email, recruiterName, offer, reason = '') => {
  const candidateName = offer.candidateId?.name || 'Candidate';
  const jobTitle = offer.jobId?.title || 'the position';
  const companyName = offer.companyId?.companyName || 'Our Company';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/recruiter/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Offer Rejected - ${candidateName} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #ef4444;">Offer Rejected</h2>
        <p>Dear ${recruiterName},</p>
        <p><strong>${candidateName}</strong> has rejected the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Offer Details</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOfferWithdrawnEmail = async (email, candidateName, offer, reason = '') => {
  const jobTitle = offer.jobId?.title || 'the position';
  const companyName = offer.companyId?.companyName || 'Our Company';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/student/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Offer Withdrawn - ${jobTitle} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #ef4444;">Offer Withdrawn</h2>
        <p>Dear ${candidateName},</p>
        <p>We regret to inform you that the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been withdrawn.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color: #666; font-size: 14px;">We appreciate your interest in our company and wish you the best in your career search.</p>
        <a href="${baseUrl}/student/offers" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View My Offers</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOfferUpdatedEmail = async (email, candidateName, offer, updateNote = '') => {
  const jobTitle = offer.jobId?.title || 'the position';
  const companyName = offer.companyId?.companyName || 'Our Company';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/student/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Offer Updated - ${jobTitle} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #6366f1;">Offer Updated</h2>
        <p>Dear ${candidateName},</p>
        <p>The offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
        ${updateNote ? `<p><strong>Update:</strong> ${updateNote}</p>` : ''}
        <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Updated Offer</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOfferNegotiationEmail = async (email, recruiterName, offer, negotiationDetails) => {
  const candidateName = offer.candidateId?.name || 'Candidate';
  const jobTitle = offer.jobId?.title || 'the position';
  const companyName = offer.companyId?.companyName || 'Our Company';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const offerLink = `${baseUrl}/recruiter/offers/${offer._id}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Negotiation Request - ${candidateName} | InternLink`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #f59e0b;">Negotiation Request</h2>
        <p>Dear ${recruiterName},</p>
        <p><strong>${candidateName}</strong> has requested to negotiate the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Negotiation Details</h3>
          ${negotiationDetails.expectedSalary ? `<p><strong>Expected Salary:</strong> ${formatCurrency(negotiationDetails.expectedSalary, offer.salary?.currency || 'USD')}</p>` : ''}
          ${negotiationDetails.preferredJoiningDate ? `<p><strong>Preferred Joining Date:</strong> ${formatDate(negotiationDetails.preferredJoiningDate)}</p>` : ''}
          ${negotiationDetails.additionalComments ? `<p><strong>Comments:</strong> ${negotiationDetails.additionalComments}</p>` : ''}
        </div>

        <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Review and Respond</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};