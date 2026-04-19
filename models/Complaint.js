const FileDb = require('../utils/fileDb');
const db = new FileDb('complaints');

class Complaint {
  static async create(data) {
    return await db.create({
      status: 'In Investigation',
      date: new Date(),
      ...data
    });
  }

  static async find(query) {
    return await db.find(query);
  }

  static async findById(id) {
    return await db.findById(id);
  }

  static async update(id, updates) {
    return await db.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }
}

module.exports = Complaint;
