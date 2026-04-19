const path = require('path');
const fs = require('fs');

const connectDB = async () => {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)){
        fs.mkdirSync(dataDir);
    }
    console.log('Zero-Config: File-based Database active');
};

module.exports = connectDB;
