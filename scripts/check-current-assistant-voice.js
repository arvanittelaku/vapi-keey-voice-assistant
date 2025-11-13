const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881';

async function checkCurrentVoice() {
  console.log('🔍 CHECKING CURRENT ASSISTANT VOICE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get phone number config
    console.log('📞 Fetching phone number configuration...\n');
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
    const squadId = phoneResponse.data.squadId;

    console.log('📊 Phone Number Points To:');
    if (assistantId) {
      console.log(`   Assistant ID: ${assistantId}`);
    }
    if (squadId) {
      console.log(`   Squad ID: ${squadId}`);
    }
    console.log('');

    if (assistantId) {
      // Get assistant config
      console.log('🤖 Fetching assistant configuration...\n');
      const assistantResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const voice = assistantResponse.data.voice;
      console.log('🎤 CURRENT VOICE CONFIGURATION:');
      console.log(`   Provider: ${voice.provider}`);
      console.log(`   Voice ID: ${voice.voiceId || voice.model}`);
      console.log(`   Model: ${voice.model || 'N/A'}`);
      console.log('');

      if (voice.provider === 'openai') {
        console.log('❌ PROBLEM FOUND!');
        console.log('   The assistant is STILL using OpenAI TTS.');
        console.log('   This is why calls are crashing.\n');
        console.log('💡 SOLUTION:');
        console.log('   Run: npm run fix-voice-for-real');
        console.log('');
      } else {
        console.log('✅ Voice provider is correct!');
        console.log('   Using:', voice.provider);
        console.log('');
      }

      console.log('📋 Full Assistant Info:');
      console.log(`   Name: ${assistantResponse.data.name}`);
      console.log(`   ID: ${assistantResponse.data.id}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkCurrentVoice();

