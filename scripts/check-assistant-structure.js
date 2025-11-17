require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

async function checkStructure() {
  console.log('\n📋 Checking Full Assistant Structure...\n');

  try {
    const response = await axios.get(`https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkStructure();

