const User = require('../models/User');
const Batch = require('../models/Batch');
const Complaint = require('../models/Complaint');

// @desc    Get global network stats
// @route   GET /api/stats
// @access  Private/Admin
exports.getGlobalStats = async (req, res, next) => {
  try {
    const users = await User.find();
    const batches = await Batch.find();
    const complaints = await Complaint.find();

    // Calculate active shipments (status = shipped or growing)
    const activeShipments = batches.filter(b => {
        const s = (b.status || '').toLowerCase();
        return ['shipped', 'growing', 'harvested', 'processed', 'transit'].includes(s);
    }).length;

    // Entity Breakdown
    const entities = {
        farmers: users.filter(u => u.role === 'farmer').length,
        distributors: users.filter(u => u.role === 'distributor').length,
        consumers: users.filter(u => u.role === 'consumer').length,
        regulators: users.filter(u => u.role === 'regulator').length
    };

    res.status(200).json({
      success: true,
      data: {
        totalEntities: users.length,
        totalBatches: batches.length,
        totalComplaints: complaints.length,
        activeShipments,
        entities
      }
    });
  } catch (err) {
    console.error('Stats API Error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};
