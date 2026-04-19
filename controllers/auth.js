const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.create({ name, email: normalizedEmail, password, role });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  let { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide an email and password' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`SHOWCASE LOGIN: ${normalizedEmail}`);

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`SHOWCASE MODE: Creating new showcase user: ${normalizedEmail}`);
      user = await User.create({
        name: email.split('@')[0],
        email: normalizedEmail,
        password: password,
        role: role || 'farmer' // Default to farmer if not specified
      });
    } else if (role && user.role !== role) {
      console.log(`SHOWCASE MODE: Updating role for ${normalizedEmail} to ${role}`);
      user = await User.findByIdAndUpdate(user._id, { role: role });
    }

    console.log(`SHOWCASE MODE: Login successful for ${email} (Role: ${user.role})`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = User.getSignedJwtToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    path: '/' // Ensure cookie is available for all paths
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    options.sameSite = 'none'; // Useful for cross-origin if needed
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token, role: user.role });
};
