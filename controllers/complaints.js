const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({
      type: req.body.type,
      description: req.body.description,
      raisedBy: req.user.name,
      raisedTo: req.body.raisedTo || 'Platform',
      batch: req.body.batch || null
    });

    const io = req.app.get('socketio');
    if (io) io.emit('complaint_created', complaint);

    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (err) {
    console.error(`[Backend] Complaint Creation Error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private/Admin
exports.getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find();
    
    // Sort so newest are first
    const sorted = complaints.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (err) {
    console.error(`[Backend] Complaint Fetch Error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    const updated = await Complaint.update(req.params.id, { status: req.body.status });

    const io = req.app.get('socketio');
    if (io) io.emit('complaint_updated', updated);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error(`[Backend] Complaint Update Error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};
