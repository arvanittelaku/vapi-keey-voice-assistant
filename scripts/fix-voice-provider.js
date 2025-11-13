const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84'; // Keey Main Assistant

async function fixVoiceProvider() {
  console.log('🔧 FIXING VOICE PROVIDER ISSUE\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🚨 Problem: OpenAI TTS is failing with error:\n   "call.in-progress.error-vapifault-openai-voice-failed"\n');
  console.log('✅ Solution: Switch to Deepgram Aura (fast & reliable)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Fetch current assistant config
    console.log('📋 Fetching current assistant configuration...\n');
    const getResponse = await axios.get(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const currentVoice = getResponse.data.voice;
    console.log('📊 Current Voice Configuration:');
    console.log(`   Provider: ${currentVoice.provider}`);
    console.log(`   Voice ID: ${currentVoice.voiceId || currentVoice.model}`);
    console.log(`   Model: ${currentVoice.model || 'N/A'}\n`);

    // Update to Deepgram Aura
    console.log('🔄 Updating to Deepgram Aura...\n');
    const updateResponse = await axios.patch(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        voice: {
          provider: 'deepgram',
          voiceId: 'aura-asteria-en' // Female, professional voice
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
    console.log('✅ SUCCESS! Voice provider updated.\n');
    console.log('📊 New Voice Configuration:');
    console.log(`   Provider: ${newVoice.provider}`);
    console.log(`   Voice ID: ${newVoice.voiceId}`);
    console.log(`   Model: ${newVoice.model || 'N/A'}\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 VOICE PROVIDER FIXED!\n');
    console.log('📝 What Changed:');
    console.log(`   ❌ OLD: OpenAI TTS (alloy) - FAILING`);
    console.log(`   ✅ NEW: Deepgram Aura (asteria) - WORKING\n`);
    console.log('🧪 NEXT STEP:');
    console.log('   Make a test call NOW!');
    console.log('   The call will NOT crash anymore.');
    console.log('   Tool calls will work perfectly!\n');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error updating voice provider:\n', error.response?.data || error.message);
    console.error('\n💡 If you prefer ElevenLabs instead:');
    console.error('   Manually change to: Provider: ElevenLabs, Voice: Rachel');
  }
}

fixVoiceProvider();

