import nodemailer from 'nodemailer';

console.log('[sendEmail] Module loaded. NODE_ENV:', process.env.NODE_ENV);

let transporter = null;

const getFrontendUrl = () => {
  if (process.env.NODE_ENV !== 'production') {
    const url = 'http://localhost:5173';
    console.log('[sendEmail] getFrontendUrl: NODE_ENV is not production, using local URL:', url);
    return url;
  }
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log('[sendEmail] getFrontendUrl: NODE_ENV is production, using FRONTEND_URL:', url);
  return url;
};

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === 'true';

  console.log('[sendEmail] buildTransporter: creating transporter with config:', {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
  });

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    authMethod: 'LOGIN',
  });
};

const getTransporter = async () => {
  if (!transporter) {
    console.log('[sendEmail] getTransporter: initializing transporter (first call)');
    transporter = buildTransporter();
    try {
      console.log('[sendEmail] getTransporter: calling transporter.verify()');
      await transporter.verify();
      console.log('[sendEmail] getTransporter: transporter verified successfully');
    } catch (error) {
      console.error('[sendEmail] getTransporter: transporter verification failed:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
      });
    }
  } else {
    console.log('[sendEmail] getTransporter: returning cached transporter');
  }
  return transporter;
};

const logSmtpError = (error, context = 'sendMail') => {
  console.error(`[sendEmail] SMTP ${context} error:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    command: error.command,
    response: error.response,
    responseCode: error.responseCode,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
  });
};

const sendMail = async (mailOptions, context = 'sendMail') => {
  console.log(`[sendEmail] sendMail: started for "${context}"`);
  try {
    console.log(`[sendEmail] sendMail: obtaining transporter for "${context}"`);
    const transporter = await getTransporter();
    console.log(`[sendEmail] sendMail: transporter obtained for "${context}", calling transporter.sendMail()`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] sendMail: SUCCESS for "${context}"`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    console.error(`[sendEmail] sendMail: FAILED for "${context}" - entering catch block`);
    logSmtpError(error, context);
    throw error;
  }
};

export const sendVerificationEmail = async (email, token) => {
  console.log('[sendVerificationEmail] enter function');

  const baseUrl = getFrontendUrl();
  const verificationUrl = `${baseUrl}/verify-email/${token}`;
  console.log('[sendVerificationEmail] verificationUrl generated:', verificationUrl);
  console.log('[sendVerificationEmail] token (plain):', token);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: 'Verify Your Email Address - InternLink',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - InternLink</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); padding: 48px 32px; text-align: center;">
                      <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                      <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 6px 0; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: -0.5px;">InternLink</h1>
                      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0; font-weight: 400;">Your Professional Internship Platform</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: -0.3px;">Welcome to InternLink! 👋</h2>
                      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">Thank you for creating an account. To get started, we need to verify your email address.</p>
                      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 32px 0;">This verification link will expire in <strong style="color: #475569;">30 minutes</strong> for security purposes.</p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 36px;">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(99,102,241,0.35); letter-spacing: 0.2px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 6px 0; font-weight: 500;">Can't click the button? Copy and paste this link:</p>
                        <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 0; line-height: 1.5;">${verificationUrl}</p>
                      </div>

                      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">If you didn't create an InternLink account, please ignore this email. No further action is required.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">InternLink Inc.</p>
                      <p style="color: #cbd5e1; font-size: 11px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  console.log('[sendVerificationEmail] mailOptions created', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  console.log('[sendVerificationEmail] sendMail started');
  try {
    await sendMail(mailOptions, 'sendVerificationEmail');
    console.log('[sendVerificationEmail] sendMail success');
  } catch (error) {
    console.error('[sendVerificationEmail] sendMail failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const baseUrl = getFrontendUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: 'Reset Your Password - InternLink',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - InternLink</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); padding: 48px 32px; text-align: center;">
                      <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 6px 0; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: -0.5px;">InternLink</h1>
                      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0; font-weight: 400;">Your Professional Internship Platform</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: -0.3px;">Reset Your Password</h2>
                      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">We received a request to reset your password. Click the button below to choose a new password.</p>
                      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 32px 0;">This reset link will expire in <strong style="color: #475569;">15 minutes</strong> for security purposes.</p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 36px;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(99,102,241,0.35); letter-spacing: 0.2px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 6px 0; font-weight: 500;">Can't click the button? Copy and paste this link:</p>
                        <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 0; line-height: 1.5;">${resetUrl}</p>
                      </div>

                      <p style="color: #ef4444; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; font-weight: 600;">If you did not request this password reset, please ignore this email. Your password will not be changed.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">InternLink Inc.</p>
                      <p style="color: #cbd5e1; font-size: 11px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  console.log('[sendPasswordResetEmail] mailOptions created', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  console.log('[sendPasswordResetEmail] resetUrl generated:', resetUrl);

  await sendMail(mailOptions, 'sendPasswordResetEmail');
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Interview Scheduled - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                  <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your Internship Platform</p>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Interview Scheduled</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName},</p>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your interview for the <strong>${jobTitle}</strong> position has been scheduled. Here are the details:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Interview Type</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interview.interviewType}</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Date</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interviewDate}</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Time</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interview.time} (${interview.timezone || 'UTC'})</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Duration</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interview.duration || '30 minutes'}</td></tr>
                    ${interview.interviewer ? `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Interviewer</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interview.interviewer}</td></tr>` : ''}
                    ${isOnline && interview.meetingLink ? `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Meeting Link</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="${interview.meetingLink}" style="color: #6366f1; text-decoration: none;">${interview.meetingLink}</a></td></tr>` : ''}
                    ${!isOnline && interview.location ? `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Location</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${interview.location}</td></tr>` : ''}
                  </table>
                  ${interview.notes ? `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;"><strong>Notes:</strong> ${interview.notes}</p>` : ''}
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please ${interview.status === 'pending-confirmation' ? 'confirm your attendance' : 'prepare for this interview'}.</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Interview Details</a>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">You will receive reminders 24 hours and 1 hour before the interview.</p>
                </td></tr>
                <tr><td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">InternLink Inc. - This is an automated message.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
};

export const sendInterviewCancelledEmail = async (email, candidateName, jobTitle, interview) => {
  const interviewDate = formatDate(interview.date);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Interview Cancelled - ${jobTitle} | InternLink`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Interview Cancelled - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Interview Cancelled</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName}, your interview for <strong>${jobTitle}</strong> scheduled on <strong>${interviewDate}</strong> at <strong>${interview.time}</strong> has been cancelled.</p>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">You will be notified of any future scheduling changes.</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Details</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
};

export const sendInterviewRescheduledEmail = async (email, candidateName, jobTitle, interview) => {
  const interviewDate = formatDate(interview.date);

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Interview Rescheduled - ${jobTitle} | InternLink`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Interview Rescheduled - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Interview Rescheduled</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName}, your interview for <strong>${jobTitle}</strong> has been rescheduled.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">New Date</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${interviewDate}</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Time</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${interview.time} (${interview.timezone || 'UTC'})</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Duration</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${interview.duration || '30 minutes'}</td></tr>
                  </table>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please update your calendar accordingly.</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews/${interview._id}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Interview Details</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Job Offer - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Congratulations, ${candidateName}!</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">We are pleased to extend an offer for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-top: 0; font-size: 16px; font-weight: 600;">Offer Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Position</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${jobTitle}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Company</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${companyName}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Base Salary</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${formatCurrency(offer.salary?.baseSalary || 0, offer.salary?.currency || 'USD')}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Joining Date</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${formatDate(offer.joiningDate)}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 14px;">Offer Valid Until</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${formatDate(offer.expiryDate)}</td></tr>
                    </table>
                  </div>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please review the complete offer details and respond by the expiry date.</p>
                  <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Offer</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offer Accepted - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Offer Accepted!</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${recruiterName},</p>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;"><strong>${candidateName}</strong> has accepted the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-top: 0; font-size: 16px; font-weight: 600;">Offer Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Candidate</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${candidateName}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Position</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${jobTitle}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Salary</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${formatCurrency(offer.salary?.baseSalary || 0, offer.salary?.currency || 'USD')}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 14px;">Joining Date</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${formatDate(offer.joiningDate)}</td></tr>
                    </table>
                  </div>
                  <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Offer Details</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offer Rejected - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Offer Rejected</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${recruiterName},</p>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;"><strong>${candidateName}</strong> has rejected the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                  ${reason ? `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
                  <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Offer Details</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offer Withdrawn - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Offer Withdrawn</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName}, we regret to inform you that the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been withdrawn.</p>
                  ${reason ? `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">We appreciate your interest in our company and wish you the best in your career search.</p>
                  <a href="${baseUrl}/student/offers" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View My Offers</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offer Updated - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Offer Updated</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName}, the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
                  ${updateNote ? `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;"><strong>Update:</strong> ${updateNote}</p>` : ''}
                  <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Updated Offer</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
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
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Negotiation Request - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Negotiation Request</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${recruiterName},</p>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;"><strong>${candidateName}</strong> has requested to negotiate the offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-top: 0; font-size: 16px; font-weight: 600;">Negotiation Details</h3>
                    ${negotiationDetails.expectedSalary ? `<p style="color: #64748b; font-size: 14px; margin: 8px 0;"><strong>Expected Salary:</strong> ${formatCurrency(negotiationDetails.expectedSalary, offer.salary?.currency || 'USD')}</p>` : ''}
                    ${negotiationDetails.preferredJoiningDate ? `<p style="color: #64748b; font-size: 14px; margin: 8px 0;"><strong>Preferred Joining Date:</strong> ${formatDate(negotiationDetails.preferredJoiningDate)}</p>` : ''}
                    ${negotiationDetails.additionalComments ? `<p style="color: #64748b; font-size: 14px; margin: 8px 0;"><strong>Comments:</strong> ${negotiationDetails.additionalComments}</p>` : ''}
                  </div>
                  <a href="${offerLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Review and Respond</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, candidateName, hiring) => {
  const companyName = hiring.companyData?.companyName || 'Our Company';
  const jobTitle = hiring.jobData?.title || 'the position';
  const department = hiring.department || 'N/A';
  const managerName = hiring.managerData?.name || 'To be assigned';
  const joiningDate = hiring.joiningDate ? formatDate(hiring.joiningDate) : 'TBD';
  const reportingTime = hiring.reportingTime || '09:00 AM';
  const officeLocation = hiring.officeLocation || 'To be determined';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const onboardingLink = `${baseUrl}/student/onboarding`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Welcome to ${companyName} - Your Onboarding Details`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to ${companyName} - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 32px; text-align: center;">
                  <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7m9 4v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3M9 18h6M9 5V3a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2M9 5h6"></path></svg>
                  </div>
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                  <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your Professional Internship Platform</p>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Welcome to the Team, ${candidateName}! 🎉</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">We are thrilled to welcome you to <strong>${companyName}</strong>. Your journey begins on <strong>${joiningDate}</strong> at <strong>${reportingTime}</strong>.</p>

                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0; font-size: 16px; font-weight: 600;">First Day Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; font-weight: 600; color: #475569; font-size: 14px;">Position</td><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; color: #1e293b; font-size: 14px;">${jobTitle}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; font-weight: 600; color: #475569; font-size: 14px;">Department</td><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; color: #1e293b; font-size: 14px;">${department}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; font-weight: 600; color: #475569; font-size: 14px;">Manager</td><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; color: #1e293b; font-size: 14px;">${managerName}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; font-weight: 600; color: #475569; font-size: 14px;">Reporting Time</td><td style="padding: 8px 0; border-bottom: 1px solid #c7f0d8; color: #1e293b; font-size: 14px;">${reportingTime}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 14px;">Office Location</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${officeLocation || 'TBD'}</td></tr>
                    </table>
                  </div>

                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please review your onboarding checklist and complete all required steps. You can track your progress in your <strong>My Onboarding</strong> dashboard.</p>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${onboardingLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(99,102,241,0.3);">
                      View My Onboarding Dashboard
                    </a>
                  </div>

                  <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">If you have any questions, please reach out to your recruiting team. We look forward to working with you!</p>
                </td></tr>
                <tr><td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">InternLink Inc. - This is an automated message. Please do not reply to this email.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
};

export const sendJoiningReminderEmail = async (email, candidateName, hiring) => {
  const companyName = hiring.companyData?.companyName || 'Our Company';
  const jobTitle = hiring.jobData?.title || 'the position';
  const joiningDate = hiring.joiningDate ? formatDate(hiring.joiningDate) : 'TBD';
  const reportingTime = hiring.reportingTime || '09:00 AM';
  const officeLocation = hiring.officeLocation || 'To be determined';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const onboardingLink = `${baseUrl}/student/onboarding`;

  const mailOptions = {
    from: `"InternLink" <${process.env.SMTP_FROM || 'noreply@internlink.com'}>`,
    to: email,
    subject: `Joining Reminder - ${joiningDate} | InternLink`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Joining Reminder - InternLink</title></head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Inter', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">InternLink</h1>
                  <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your Professional Internship Platform</p>
                </td></tr>
                <tr><td style="padding: 40px 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Outfit', 'Inter', Arial, sans-serif;">Joining Reminder</h2>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Dear ${candidateName},</p>
                  <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">This is a friendly reminder that your first day at <strong>${companyName}</strong> is coming up soon.</p>
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Position</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${jobTitle}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Joining Date</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${joiningDate}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">Reporting Time</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${reportingTime}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 14px;">Office Location</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${officeLocation || 'TBD'}</td></tr>
                    </table>
                  </div>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Please ensure you complete all onboarding steps before your first day. You can check your progress at your My Onboarding dashboard.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${onboardingLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 15px;">
                      View My Onboarding Dashboard
                    </a>
                  </div>
                </td></tr>
                <tr><td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">InternLink Inc. - This is an automated message.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  };

  await sendMail(mailOptions);
};
