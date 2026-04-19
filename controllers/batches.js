const Batch = require('../models/Batch');
const Ledger = require('../models/Ledger');
const SensorData = require('../models/SensorData');
const User = require('../models/User');
const { analyzeCropHealth } = require('../utils/aiEngine');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
exports.getBatches = async (req, res, next) => {
  try {
    let batches;

    if (req.user.role === 'farmer') {
      batches = await Batch.find({ farmer: req.user._id });
    } else {
      batches = await Batch.find();
    }

    // Manual populate and AI analysis
    for (const batch of batches) {
      const user = await User.findById(batch.farmer);
      if (user) {
        batch.farmer = { _id: user._id, name: user.name, email: user.email };
      }

      // Latest sensor data for AI analysis
      const latestSensor = await SensorData.find({ batch: batch._id });
      const sortedSensor = latestSensor.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      batch.aiAnalysis = analyzeCropHealth(sortedSensor);
      
      // Timeline data (simulated based on status)
      batch.timeline = getTimeline(batch);
    }

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
exports.getBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const user = await User.findById(batch.farmer);
    if (user) {
      batch.farmer = { _id: user._id, name: user.name, email: user.email };
    }

    const latestSensor = await SensorData.find({ batch: batch._id });
    const sortedSensor = latestSensor.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    batch.aiAnalysis = analyzeCropHealth(sortedSensor);
    batch.timeline = getTimeline(batch);

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private (Farmer)
exports.createBatch = async (req, res, next) => {
  try {
    req.body.farmer = req.user._id;
    const batch = await Batch.create(req.body);

    await Ledger.create({
      batch: batch._id,
      action: 'Batch Created',
      actor: req.user._id,
      details: { variety: batch.cropVariety, location: batch.location }
    });

    const io = req.app.get('socketio');
    if (io) io.emit('batch_created', batch);

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update batch status
// @route   PUT /api/batches/:id/status
// @access  Private
exports.updateStatus = async (req, res, next) => {
  try {
    let batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    batch = await Batch.findByIdAndUpdate(req.params.id, { status: req.body.status });

    const details = req.body.details || { newStatus: req.body.status };

    await Ledger.create({
      batch: batch._id,
      action: `Status Updated to ${req.body.status}`,
      actor: req.user._id,
      details
    });

    const io = req.app.get('socketio');
    if (io) io.emit('batch_updated', { id: batch._id, status: req.body.status });

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update batch details
// @route   PUT /api/batches/:id
// @access  Private
exports.updateBatch = async (req, res, next) => {
  try {
    let batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    batch = await Batch.findByIdAndUpdate(req.params.id, req.body);

    await Ledger.create({
      batch: batch._id,
      action: 'Batch Details Updated',
      actor: req.user._id,
      details: req.body
    });

    const io = req.app.get('socketio');
    if (io) io.emit('batch_updated', { id: batch._id, details: req.body });

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get sensor data for batch
// @route   GET /api/batches/:id/sensors
// @access  Private
exports.getSensorData = async (req, res, next) => {
  try {
    const data = (await SensorData.find({ batch: req.params.id }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get ledger for batch
// @route   GET /api/batches/:id/ledger
// @access  Private
exports.getLedger = async (req, res, next) => {
  try {
    const ledger = (await Ledger.find({ batch: req.params.id }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json({
      success: true,
      data: ledger
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private (Farmer/Admin)
exports.deleteBatch = async (req, res, next) => {
  try {
    console.log(`[Backend] Deletion request received for batch: ${req.params.id} by user: ${req.user._id}`);
    
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      console.warn(`[Backend] Deletion failed: Batch ${req.params.id} not found.`);
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    console.log(`[Backend] Deletion authorized. Purging records...`);
    await Batch.delete(req.params.id);

    // Also delete related sensor data and ledger entries
    const SensorData = require('../models/SensorData');
    const Ledger = require('../models/Ledger');
    const sensorsDeleted = await SensorData.deleteMany({ batch: req.params.id });
    const ledgerDeleted = await Ledger.deleteMany({ batch: req.params.id });
    
    console.log(`[Backend] Success: Batch ${req.params.id} purged. Sensors: ${sensorsDeleted.deletedCount}, Ledger: ${ledgerDeleted.deletedCount}`);

    const io = req.app.get('socketio');
    if (io) io.emit('batch_deleted', req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`[Backend] Deletion error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get sensor data for a batch
// @route   GET /api/batches/:id/sensors
// @access  Public (in this demo context)
exports.getSensorData = async (req, res, next) => {
  try {
    const SensorData = require('../models/SensorData');
    const logs = await SensorData.find({ batch: req.params.id });
    
    // Sort by timestamp asc for charts
    const sortedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.status(200).json({
      success: true,
      data: sortedLogs
    });
  } catch (err) {
    console.error(`[Backend] Sensor fetch error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get ledger entries for a batch
// @route   GET /api/batches/:id/ledger
// @access  Public (in this demo context)
exports.getLedger = async (req, res, next) => {
  try {
    const Ledger = require('../models/Ledger');
    const logs = await Ledger.find({ batch: req.params.id });
    
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.status(200).json({
      success: true,
      data: sortedLogs
    });
  } catch (err) {
    console.error(`[Backend] Ledger fetch error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
};

const getTimeline = (batch) => {
  const stages = ['sown', 'growing', 'harvested', 'processed', 'shipped', 'delivered'];
  const currentIndex = stages.indexOf((batch.status || 'sown').toLowerCase());
  
  return stages.map((stage, index) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    completed: index <= currentIndex,
    active: index === currentIndex,
    date: index <= currentIndex ? (batch.updatedAt || batch.createdAt) : null
  }));
};
