const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FileDb = require('../utils/fileDb');

const db = new FileDb('users');

class User {
  static async find(query) {
    return await db.find(query);
  }

  static async findOne(query) {
    return await db.findOne(query);
  }

  static async findById(id) {
    return await db.findOne({ _id: id });
  }

  static async deleteMany(query) {
    return await db.deleteMany(query);
  }

  static async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      ...userData,
      password: hashedPassword
    };
    
    return await db.create(user);
  }

  // Helper for controllers to simulate instance methods
  static getSignedJwtToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  }

  static async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  static async findByIdAndUpdate(id, update) {
    // If password is being updated, hash it
    if (update.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    }
    return await db.findByIdAndUpdate(id, update);
  }

  static async findByIdAndDelete(id) {
    return await db.deleteOne({ _id: id });
  }
}

module.exports = User;
