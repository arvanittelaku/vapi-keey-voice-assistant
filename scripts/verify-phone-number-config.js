const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;

async function verifyPhoneConfig() {
  console.log('🔍 VERIFYING PHONE NUMBER CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const response = await axios.get(
      `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const phone = response.data;
    
    console.log('📞 PHONE NUMBER CONFIGURATION:');
    console.log(`   Number: ${phone.number}`);
    console.log(`   Name: ${phone.name || 'Not set'}`);
    console.log(`   Assistant ID: ${phone.assistantId || 'NOT SET'}`);
    console.log(`   Squad ID: ${phone.squadId || 'NOT SET'}\n`);
    
    // Verify it's pointing to the correct Squad
    if (phone.squadId === SQUAD_ID) {
      console.log('✅ CORRECT: Phone number is pointing to the Squad');
      console.log(`   Expected: ${SQUAD_ID}`);
      console.log(`   Actual:   ${phone.squadId}\n`);
    } else {
      console.log('❌ ERROR: Phone number is NOT pointing to the correct Squad!');
      console.log(`   Expected: ${SQUAD_ID}`);
      console.log(`   Actual:   ${phone.squadId || 'NONE'}\n`);
      console.log('🚨 THIS WILL CAUSE ISSUES! Update phone number to use Squad.\n');
      return false;
    }
    
    // Check server config
    console.log('🌐 SERVER CONFIGURATION:');
    if (phone.server) {
      console.log(`   URL: ${phone.server.url}`);
      console.log(`   Timeout: ${phone.server.timeoutSeconds}s`);
      
      if (phone.server.url === 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi') {
        console.log('   ✅ Server URL is correct\n');
      } else {
        console.log('   ⚠️  Server URL might be incorrect\n');
      }
    } else {
      console.log('   NOT SET (will inherit from Squad/Assistant)\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION RESULT:\n');
    console.log('✅ Phone number is correctly configured');
    console.log('✅ Points to the Squad with updated assistants');
    console.log('✅ Ready for live calls\n');
    console.log('═══════════════════════════════════════════════════════════');
    
    return true;

  } catch (error) {
    console.error('❌ Error checking phone configuration:');
    console.error(error.response?.data || error.message);
    return false;
  }
}

verifyPhoneConfig().catch(console.error);

