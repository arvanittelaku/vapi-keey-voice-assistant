require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

async function fixFirstMessage() {
  console.log('\n🔧 Adding First Message to Keey Inbound Lead Assistant...\n');

  try {
    const updatePayload = {
      firstMessage: "Hello! Thank you for calling Keey. I'm here to help you maximize your property's rental income. How can I assist you today?"
    };

    const response = await axios.patch(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ First Message added successfully!');
    console.log(`\n📞 First Message: "${response.data.firstMessage}"`);
    console.log('\n✅ Inbound Assistant is now ready to answer calls!');
    console.log('\n🎯 Next Step: Try calling +447402769361 again');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

fixFirstMessage();

