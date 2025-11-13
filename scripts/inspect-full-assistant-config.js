const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84'; // Main Assistant

async function inspectAssistant() {
  console.log('🔍 FULL ASSISTANT CONFIGURATION DUMP\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 LOOKING FOR SERVER MESSAGE CONFIGURATION:\n');
    
    // Check various possible locations
    if (response.data.serverMessages) {
      console.log('✅ Found serverMessages at root level:');
      console.log('   ', response.data.serverMessages);
    } else {
      console.log('❌ No serverMessages at root level');
    }
    
    if (response.data.server?.serverMessages) {
      console.log('✅ Found server.serverMessages:');
      console.log('   ', response.data.server.serverMessages);
    } else {
      console.log('❌ No server.serverMessages');
    }
    
    if (response.data.webhookUrl || response.data.webhook) {
      console.log('✅ Found webhook configuration:');
      console.log('   ', response.data.webhookUrl || response.data.webhook);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

inspectAssistant();

