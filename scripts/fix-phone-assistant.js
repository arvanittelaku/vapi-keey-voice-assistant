const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce'; // Phone number's assistant

async function fixPhoneAssistant() {
  console.log('🔧 FIXING PHONE NUMBER\'S ASSISTANT\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Assistant: Keey Inbound Lead Assistant');
  console.log(`   ID: ${ASSISTANT_ID}\n`);
  
  console.log('🎯 Adding "tool-calls" to serverMessages...\n');
  
  try {
    const response = await axios.patch(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
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
    console.log('✅ SUCCESS! Assistant updated.\n');
    console.log('📨 Updated serverMessages:');
    console.log(`   ${JSON.stringify(updated.serverMessages, null, 2)}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 PHONE ASSISTANT FIXED!\n');
    console.log('📊 WHAT THIS MEANS:');
    console.log('   ✅ Phone number will now receive tool-call webhooks');
    console.log('   ✅ Inbound calls will be able to use tools');
    console.log('   ✅ Outbound calls will be able to use tools\n');
    
    console.log('🧪 NEXT STEPS:');
    console.log('   1. Wait 2-3 minutes for Vapi cache to update');
    console.log('   2. Test with a real call');
    console.log('   3. Tool calls should now work!\n');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error updating assistant:');
    console.error(error.response?.data || error.message);
  }
}

fixPhoneAssistant().catch(console.error);

