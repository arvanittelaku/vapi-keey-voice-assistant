const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881';

async function checkPhoneAssistant() {
  console.log('🔍 CHECKING PHONE NUMBER\'S ACTUAL ASSISTANT\n');
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
    console.log(`📞 Phone uses assistant: ${assistantId}\n`);

    // Get assistant config
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistant = assistantResponse.data;
    const voice = assistant.voice;
    const tools = assistant.model?.tools || [];
    const toolIds = assistant.model?.toolIds || [];
    const serverMessages = assistant.serverMessages || [];

    console.log('🤖 ASSISTANT DETAILS:');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID: ${assistant.id}`);
    console.log('');

    console.log('🎤 VOICE:');
    console.log(`   Provider: ${voice.provider}`);
    console.log(`   Voice ID: ${voice.voiceId || voice.model}`);
    console.log(`   Model: ${voice.model || 'N/A'}`);
    if (voice.provider === 'openai') {
      console.log('   ❌ PROBLEM: Using OpenAI TTS - will crash');
    } else {
      console.log('   ✅ OK');
    }
    console.log('');

    console.log('🔧 TOOLS:');
    console.log(`   Tool IDs: ${toolIds.length > 0 ? toolIds.join(', ') : 'NONE'}`);
    console.log(`   Tools in model: ${tools.length}`);
    
    if (tools.length > 0) {
      tools.forEach((tool, idx) => {
        const name = tool.function?.name || tool.type || 'unknown';
        console.log(`   ${idx + 1}. ${name}`);
      });
      console.log('   ✅ Has tools');
    } else {
      console.log('   ❌ PROBLEM: NO TOOLS CONFIGURED');
    }
    console.log('');

    console.log('📡 SERVER MESSAGES:');
    console.log(`   ${serverMessages.join(', ') || 'NONE'}`);
    if (serverMessages.includes('tool-calls')) {
      console.log('   ✅ Has tool-calls');
    } else {
      console.log('   ❌ PROBLEM: Missing tool-calls');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════\n');

    const issues = [];
    if (voice.provider === 'openai') issues.push('Voice provider is OpenAI (will crash)');
    if (tools.length === 0) issues.push('No tools configured');
    if (!serverMessages.includes('tool-calls')) issues.push('Missing tool-calls in serverMessages');

    if (issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 This explains why tool calls are failing!\n');
    } else {
      console.log('✅ ALL GOOD - Assistant properly configured!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkPhoneAssistant();

