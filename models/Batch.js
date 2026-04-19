const FileDb = require('../utils/fileDb');
const db = new FileDb('batches');

class Batch {
  static async find(query) {
    return await db.find(query);
  }

  static async findOne(query) {
    return await db.findOne(query);
  }

  static async findById(id) {
    return await db.findOne({ _id: id });
  }

  static async create(data) {
    return await db.create({
      status: 'sown',
      ...data
    });
  }

  static async findByIdAndUpdate(id, update) {
    return await db.findByIdAndUpdate(id, update);
  }

  static async delete(id) {
    return await db.deleteOne({ _id: id });
  }
}

module.exports = Batch;
