content = open('authController.js', 'r', encoding='utf-8').read()

start_marker = '// @desc    Forgot password - send reset email'
end_marker = '// @desc    Validate reset token'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_block = '''// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before resetting password',
        needsVerification: true,
        email: user.email
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    enqueueEmail({ type: 'password-reset', email: user.email, token: resetToken }).catch(() => {
      // Email delivery is best-effort; do not fail the request because of it.
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

'''
    content = content[:start_idx] + new_block + content[end_idx:]
    open('authController.js', 'w', encoding='utf-8').write(content)
    print('Replaced forgotPassword function')
else:
    print('Markers not found')
