const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

async function checkServerConfigurations() {
  console.log('🔍 Checking All Server Configurations\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Check Phone Number server config
    console.log('📞 PHONE NUMBER SERVER CONFIG:');
    const phoneResponse = await axios.get(
      `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const phoneServer = phoneResponse.data.server;
    console.log(`   URL: ${phoneServer?.url || 'NOT SET'}`);
    console.log(`   Timeout: ${phoneServer?.timeoutSeconds || 'NOT SET'}s\n`);

    // 2. Check Squad server config (if exists)
    console.log('👥 SQUAD SERVER CONFIG:');
    const squadResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const squadServer = squadResponse.data.server;
    if (squadServer) {
      console.log(`   URL: ${squadServer.url}`);
      console.log(`   Timeout: ${squadServer.timeoutSeconds}s`);
      console.log('   ⚠️  Squad has its own server config!\n');
    } else {
      console.log('   NOT SET (inherits from phone number or assistants)\n');
    }

    // 3. Check Main Assistant server config
    console.log('🤖 MAIN ASSISTANT SERVER CONFIG:');
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/0fd5652f-e68d-442f-8362-8f96f00c2b84`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const assistantServer = assistantResponse.data.server;
    if (assistantServer) {
      console.log(`   URL: ${assistantServer.url}`);
      console.log(`   Timeout: ${assistantServer.timeoutSeconds}s\n`);
    } else {
      console.log('   NOT SET\n');
    }

    // 4. Check Tool server configs
    console.log('🔧 TOOL SERVER CONFIGS:');
    const toolIds = [
      {id: '22eb8501-80fb-497f-87e8-6f0a88ac5eab', name: 'check_calendar_availability_keey'},
      {id: 'd25e90cd-e6dc-423f-9719-96ca8c6541cb', name: 'book_calendar_appointment_keey'}
    ];

    for (const tool of toolIds) {
      const toolResponse = await axios.get(
        `https://api.vapi.ai/tool/${tool.id}`,
        {
          headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
        }
      );

      const toolServer = toolResponse.data.server;
      console.log(`   ${tool.name}:`);
      console.log(`      URL: ${toolServer?.url || 'NOT SET'}`);
      console.log(`      Timeout: ${toolServer?.timeoutSeconds || 'NOT SET'}s`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Server URL Priority Order (Vapi documentation):');
    console.log('1. Phone Number server (for status updates)');
    console.log('2. Tool server (for tool calls)');
    console.log('3. Assistant server (fallback)');
    console.log('4. Squad server (if set - might override everything!)\n');

    if (squadServer) {
      console.log('⚠️  WARNING: Squad has its own server config!');
      console.log('   This might be overriding the tool server URLs!');
      console.log('   Tool calls might be going to the Squad server instead!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkServerConfigurations();


