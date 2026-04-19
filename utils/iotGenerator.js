const SensorData = require('../models/SensorData');
const Batch = require('../models/Batch');

const generateMockIoT = async (io) => {
  try {
    const allBatches = await Batch.find();
    const batches = allBatches.filter(b => b.status !== 'delivered');

    if (batches.length === 0) return;

    for (const batch of batches) {
      // Simulate random farm data
      const data = {
        batch: batch._id,
        temperature: parseFloat((25 + Math.random() * 10).toFixed(1)), // 25-35 C
        moisture: Math.floor(20 + Math.random() * 40), // 20-60%
        nutrients: Math.floor(60 + Math.random() * 30), // 60-90%
        timestamp: new Date()
      };

      await SensorData.create(data);

      // Broadcast to specific batch room if io is provided
      if (io) {
        io.to(batch._id).emit('telemetryUpdate', data);
      }
    }
    
  } catch (err) {
    console.error('[IoT Error]', err.message);
  }
};

const startIoTGenerator = (io) => {
  // Run every 10 seconds for demo purposes
  setInterval(() => generateMockIoT(io), 10000);
  console.log('IoT Telemetry Generator started (10s interval)');
};

module.exports = startIoTGenerator;
