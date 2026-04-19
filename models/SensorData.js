const FileDb = require('../utils/fileDb');
const db = new FileDb('sensordata');

class SensorData {
  static async create(data) {
    return await db.create({
      timestamp: new Date(),
      ...data
    });
  }

  static async find(query) {
    return await db.find(query);
  }

  static async deleteMany(query) {
    return await db.deleteMany(query);
  }
}

module.exports = SensorData;
