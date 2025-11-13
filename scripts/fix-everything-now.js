const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881';
const SQUAD_ID = '7cc6e04f-116c-491c-a5b0-00b430bb24db';

// Tool IDs that should be on ALL assistants
const REQUIRED_TOOL_IDS = [
  '22eb8501-80fb-497f-87e8-6f0a88ac5eab', // check_calendar_availability_keey
  'd25e90cd-e6dc-423f-9719-96ca8c6541cb', // book_calendar_appointment_keey
  'e428aef0-bbd6-4870-aa42-96d08480abe7'  // transfer_call_keey
];

async function fixEverything() {
  console.log('🚀 COMPREHENSIVE FIX - ALL ASSISTANTS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get phone assistant
    const phoneResponse = await axios.get(
      `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const phoneAssistantId = phoneResponse.data.assistantId;
    console.log(`📞 Phone Assistant: ${phoneAssistantId}\n`);

    // Get squad assistants
    const squadResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const squadAssistantIds = squadResponse.data.members.map(m => m.assistantId);
    console.log(`👥 Squad Assistants: ${squadAssistantIds.length}\n`);

    // Combine all unique assistant IDs
    const allAssistantIds = [...new Set([phoneAssistantId, ...squadAssistantIds])];
    console.log(`🎯 Total assistants to fix: ${allAssistantIds.length}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const assistantId of allAssistantIds) {
      // Get current config
      const getResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
        }
      );

      const assistant = getResponse.data;
      console.log(`🔧 Fixing: ${assistant.name}`);

      const updates = {
        voice: {
          provider: 'deepgram',
          voiceId: 'asteria'
        },
        serverMessages: [
          'status-update',
          'tool-calls',
          'function-call',
          'end-of-call-report',
          'hang'
        ],
        model: {
          ...assistant.model,
          toolIds: REQUIRED_TOOL_IDS
        }
      };

      // Apply fix
      await axios.patch(
        `https://api.vapi.ai/assistant/${assistantId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`   ✅ Voice: Deepgram (asteria)`);
      console.log(`   ✅ Tools: ${REQUIRED_TOOL_IDS.length} attached`);
      console.log(`   ✅ Server Messages: tool-calls enabled`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎉 FIXED ALL ${allAssistantIds.length} ASSISTANTS!\n`);
    console.log('✅ All assistants now have:');
    console.log('   - Deepgram voice (asteria)');
    console.log('   - All 3 required tools');
    console.log('   - Correct serverMessages\n');
    console.log('🧪 MAKE A TEST CALL NOW - Everything should work!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixEverything();

