const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileDb {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  async _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    const data = await this._read();
    return data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const data = await this._read();
    return data.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async create(item) {
    const data = await this._read();
    const newItem = {
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      ...item
    };
    data.push(newItem);
    await this._write(data);
    return newItem;
  }

  async findByIdAndUpdate(id, update) {
    const data = await this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...update, updatedAt: new Date() };
    await this._write(data);
    return data[index];
  }

  async deleteMany(query = {}) {
    const data = await this._read();
    const queryKeys = Object.keys(query);
    
    const filteredData = data.filter(item => {
      // If query is empty, we want to delete everything (return false for all items)
      if (queryKeys.length === 0) return false;
      
      // If any query key doesn't match, we keep the item (return true)
      for (const key of queryKeys) {
        if (item[key] !== query[key]) return true;
      }
      // If all query keys match, we remove the item (return false)
      return false;
    });
    
    await this._write(filteredData);
    return { deletedCount: data.length - filteredData.length };
  }

  async deleteOne(query = {}) {
    const data = await this._read();
    const index = data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return { deletedCount: 0 };

    data.splice(index, 1);
    await this._write(data);
    return { deletedCount: 1 };
  }
}

module.exports = FileDb;
