const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Initialize "DB" directory
    await connectDB();

    // Clear existing users
    await User.deleteMany();

    const users = [
      { name: 'Farmer John', email: 'farmer@test.com', password: 'password123', role: 'farmer' },
      { name: 'Distributor Dave', email: 'distributor@test.com', password: 'password123', role: 'distributor' },
      { name: 'Regulator Ruth', email: 'regulator@test.com', password: 'password123', role: 'regulator' },
      { name: 'Consumer Casey', email: 'consumer@test.com', password: 'password123', role: 'consumer' },
      { name: 'Admin Alice', email: 'admin@test.com', password: 'password123', role: 'admin' }
    ];

    for (const u of users) {
      await User.create(u);
    }

    console.log('Seed: Created 5 test users with password "password123"');
    console.log('Data saved to local data/users.json');
    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedUsers();
