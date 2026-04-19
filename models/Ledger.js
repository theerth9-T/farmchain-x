const crypto = require('crypto');
const FileDb = require('../utils/fileDb');

const db = new FileDb('ledger');

class Ledger {
  static async find(query) {
    return await db.find(query);
  }

  static async findOne(query) {
    return await db.findOne(query);
  }

  static async create(data) {
    // Get last entry for previousHash
    const logs = await db.find();
    const lastEntry = logs[logs.length - 1];
    const previousHash = lastEntry ? lastEntry.hash : '0';

    // Calculate Hash
    const content = JSON.stringify({ ...data, previousHash });
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const entry = {
      ...data,
      previousHash,
      hash,
      timestamp: new Date()
    };

    return await db.create(entry);
  }

  static async deleteMany(query) {
    return await db.deleteMany(query);
  }
}

module.exports = Ledger;
