content = open('sendEmail.js', 'r', encoding='utf-8').read()

# Remove module load log
content = content.replace("console.log('[sendEmail] Module loaded. NODE_ENV:', process.env.NODE_ENV);\n\n", '')

# Simplify getFrontendUrl
content = content.replace('''const getFrontendUrl = () => {
  if (process.env.NODE_ENV !== 'production') {
    const url = 'http://localhost:5173';
    console.log('[sendEmail] getFrontendUrl: NODE_ENV is not production, using local URL:', url);
    return url;
  }
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log('[sendEmail] getFrontendUrl: NODE_ENV is production, using FRONTEND_URL:', url);
  return url;
};''', '''const getFrontendUrl = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:5173';
  }
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};''')

# Remove buildTransporter log
content = content.replace('''  console.log('[sendEmail] buildTransporter: creating transporter with config:', {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
  });

  ''', '')

# Remove getTransporter logs
content = content.replace('''    console.log('[sendEmail] getTransporter: initializing transporter (first call)');
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
  }''', '''    transporter = buildTransporter();
    try {
      await transporter.verify();
    } catch (error) {
      console.error('[sendEmail] Transporter verification failed:', error.message);
    }
  }''')

# Remove sendMail logs
content = content.replace('''  console.log(`[sendEmail] sendMail: started for "${context}"`);
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
  }''', '''  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    logSmtpError(error, context);
    throw error;
  }''')

# Remove sendVerificationEmail logs
content = content.replace('''  console.log('[sendVerificationEmail] enter function');

  const baseUrl = getFrontendUrl();
  const verificationUrl = `${baseUrl}/verify-email/${token}`;
  console.log('[sendVerificationEmail] verificationUrl generated:', verificationUrl);
  console.log('[sendVerificationEmail] token (plain):', token);

  const mailOptions = {''', '''  const baseUrl = getFrontendUrl();
  const verificationUrl = `${baseUrl}/verify-email/${token}`;
  const mailOptions = {''')

content = content.replace('''  console.log('[sendVerificationEmail] mailOptions created', {
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
};''', '''  await sendMail(mailOptions, 'sendVerificationEmail');
};''')

# Remove sendPasswordResetEmail logs
content = content.replace('''  console.log('[sendPasswordResetEmail] mailOptions created', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  console.log('[sendPasswordResetEmail] resetUrl generated:', resetUrl);

  await sendMail(mailOptions, 'sendPasswordResetEmail');''', '''  await sendMail(mailOptions, 'sendPasswordResetEmail');''')

open('sendEmail.js', 'w', encoding='utf-8').write(content)
print('Done')
