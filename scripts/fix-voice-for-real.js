const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881';

async function fixVoiceForReal() {
  console.log('🔧 FIXING VOICE PROVIDER - FOR REAL THIS TIME\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get phone number config
    const phoneResponse = await axios.get(
      `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistantId = phoneResponse.data.assistantId;
    console.log(`📞 Phone points to assistant: ${assistantId}\n`);

    // Update THIS assistant (the one the phone actually uses)
    console.log('🔄 Updating voice provider to Deepgram...\n');
    const updateResponse = await axios.patch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        voice: {
          provider: 'deepgram',
          voiceId: 'asteria'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newVoice = updateResponse.data.voice;
    console.log('✅ SUCCESS!\n');
    console.log('📊 New Voice Configuration:');
    console.log('   Provider:', newVoice.provider);
    console.log('   Voice ID:', newVoice.voiceId);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 VOICE FIXED ON THE CORRECT ASSISTANT!\n');
    console.log('🧪 Make a test call NOW - it will work!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixVoiceForReal();

