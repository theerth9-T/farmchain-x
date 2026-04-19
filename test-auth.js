const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testAuth() {
    const user = await User.findOne({ email: 'farmer@test.com' });
    if (!user) {
        console.log('User not found');
        return;
    }
    console.log('User password in DB:', user.password);
    const isMatch = await User.matchPassword('password123', user.password);
    console.log('Match result for "password123":', isMatch);
}

testAuth();
