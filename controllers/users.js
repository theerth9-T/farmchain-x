const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    console.log(`API [GET /api/users] found ${users.length} users`);
    
    // Remove passwords from response
    const sanitized = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error('Get Users Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create user (Admin version)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, ...rest } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('Admin creating user:', normalizedEmail);
    
    const user = await User.create({ name, email: normalizedEmail, password, role, ...rest });
    console.log('User created successfully:', user._id);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Update User Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin' && user.email === 'admin@test.com') {
      return res.status(400).json({ success: false, error: 'Cannot delete the primary root admin' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
