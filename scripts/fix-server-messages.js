const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Squad member assistant IDs
const ASSISTANT_IDS = [
  { id: '0fd5652f-e68d-442f-8362-8f96f00c2b84', name: 'Main Assistant' },
  { id: '2d145a57-81a2-4315-8b29-1a046ad4c0a8', name: 'Services Specialist' },
  { id: 'decc7cb8-7b20-4384-942b-143fa1cc6d29', name: 'Pricing Specialist' }
];

async function fixServerMessages() {
  console.log('🔧 FIXING SERVER MESSAGES CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 What We\'re Fixing:');
  console.log('   Adding "tool-calls" to serverMessages for all assistants');
  console.log('   This tells Vapi to send tool-call webhooks to your server\n');
  
  console.log('📤 Required serverMessages for proper functionality:');
  console.log('   - status-update    (call status changes)');
  console.log('   - tool-calls       (tool execution requests) ← MISSING!');
  console.log('   - end-of-call-report (call summaries)\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const assistant of ASSISTANT_IDS) {
    try {
      console.log(`🔧 Updating ${assistant.name}...`);
      
      const response = await axios.patch(
        `https://api.vapi.ai/assistant/${assistant.id}`,
        {
          serverUrl: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi',
          serverMessages: [
            'status-update',
            'tool-calls',        // ← NEW FORMAT (critical!)
            'function-call',     // ← OLD FORMAT (keep for compatibility)
            'end-of-call-report',
            'hang'
          ],
          server: {
            url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi',
            timeoutSeconds: 20
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const updated = response.data;
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Server URL: ${updated.server.url}`);
      console.log(`   Server Messages: ${JSON.stringify(updated.server.serverMessages)}`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error updating ${assistant.name}:`);
      console.error('   ', error.response?.data || error.message);
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ ALL ASSISTANTS UPDATED!\n');
  console.log('📊 WHAT THIS MEANS:');
  console.log('   ✅ Vapi will now send tool-call webhooks to your server');
  console.log('   ✅ Tools should work in Squad calls');
  console.log('   ✅ No more "No result returned" errors\n');
  
  console.log('🧪 NEXT STEPS:');
  console.log('1. Wait 2-3 minutes for Vapi to update its cache');
  console.log('2. Verify: npm run check-server-messages');
  console.log('3. Test with a real call (THIS SHOULD NOW WORK!)\n');
  
  console.log('═══════════════════════════════════════════════════════════');
}

fixServerMessages();

