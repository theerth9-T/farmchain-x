const axios = require('axios');

async function testStats() {
    try {
        const response = await axios.get('http://localhost:5000/api/stats');
        console.log('Stats Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testStats();
