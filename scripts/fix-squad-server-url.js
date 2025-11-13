const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;
const SERVER_URL = 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';

async function fixSquadServerConfig() {
  console.log('🔧 FIXING SQUAD SERVER CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Issue Found:');
  console.log('   Vapi does not support assistant-level hooks in Squads.');
  console.log('   Tool-call webhooks might be treated as assistant-level hooks.\n');
  
  console.log('✅ Solution:');
  console.log('   Set explicit server URL at the SQUAD level.\n');
  
  console.log(`🎯 Setting Squad server URL to: ${SERVER_URL}\n`);

  try {
    const response = await axios.patch(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        server: {
          url: SERVER_URL,
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

    console.log('✅ SUCCESS! Squad server configuration updated.\n');
    console.log('Updated configuration:');
    console.log(`   Server URL: ${response.data.server?.url || 'NOT SET'}`);
    console.log(`   Timeout: ${response.data.server?.timeoutSeconds || 'NOT SET'}s\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 WHAT THIS MEANS:\n');
    console.log('✅ Squad now has explicit server configuration');
    console.log('✅ Tool-call webhooks should now be sent to your server');
    console.log('✅ This matches the Vapi requirement for Squad-level hooks\n');
    
    console.log('🧪 NEXT STEPS:');
    console.log('1. Wait 2-3 minutes for Vapi to update its cache');
    console.log('2. Run: npm run check-squad-server-config');
    console.log('3. Test with a real call to verify tool calls work\n');
    
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error updating Squad configuration:');
    console.error(error.response?.data || error.message);
  }
}

fixSquadServerConfig();

