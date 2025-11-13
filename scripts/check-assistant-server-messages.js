const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Squad member assistant IDs from the Squad structure
const ASSISTANT_IDS = [
  { id: '0fd5652f-e68d-442f-8362-8f96f00c2b84', name: 'Main Assistant' },
  { id: '2d145a57-81a2-4315-8b29-1a046ad4c0a8', name: 'Services Specialist' },
  { id: 'decc7cb8-7b20-4384-942b-143fa1cc6d29', name: 'Pricing Specialist' }
];

async function checkServerMessages() {
  console.log('🔍 CHECKING SERVER MESSAGES CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Why This Matters:');
  console.log('   Vapi only sends webhook types that are listed in serverMessages.');
  console.log('   If "tool-calls" is missing, Vapi will NOT send tool-call webhooks!\n');
  
  for (const assistant of ASSISTANT_IDS) {
    try {
      const response = await axios.get(
        `https://api.vapi.ai/assistant/${assistant.id}`,
        {
          headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
        }
      );

      const data = response.data;
      
      console.log(`🤖 ${assistant.name}:`);
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Server URL: ${data.server?.url || 'NOT SET'}`);
      console.log(`   Server Messages: ${data.serverMessages ? JSON.stringify(data.serverMessages) : 'NOT SET'}`);
      
      // Check if tool-calls is included (serverMessages is at ROOT level, not in server object)
      if (data.serverMessages) {
        const hasToolCalls = data.serverMessages.includes('tool-calls');
        const hasFunctionCall = data.serverMessages.includes('function-call');
        
        if (hasToolCalls) {
          console.log('   ✅ HAS "tool-calls" in serverMessages');
        } else if (hasFunctionCall) {
          console.log('   ⚠️  HAS OLD "function-call" only (deprecated format)');
        } else {
          console.log('   ❌ MISSING "tool-calls" in serverMessages!');
          console.log('   🚨 THIS IS WHY TOOL CALLS ARE NOT WORKING!');
        }
      } else {
        console.log('   ❌ NO serverMessages configured!');
        console.log('   🚨 THIS IS WHY TOOL CALLS ARE NOT WORKING!');
      }
      
      console.log('');

    } catch (error) {
      console.error(`❌ Error checking ${assistant.name}:`, error.response?.data || error.message);
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 DIAGNOSIS:\n');
  console.log('If any assistant is missing "tool-calls" in serverMessages,');
  console.log('Vapi will NOT send tool-call webhooks for that assistant!\n');
  console.log('✅ SOLUTION: Run npm run fix-server-messages\n');
  console.log('═══════════════════════════════════════════════════════════');
}

checkServerMessages();

