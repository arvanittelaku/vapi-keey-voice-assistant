const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84'; // Keey Main Assistant

async function triggerDirectAssistantCall() {
  console.log('📞 TESTING DIRECT ASSISTANT CALL (NO SQUAD)\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  This will consume Vapi credits!');
  console.log('⚠️  Make sure you\'re ready to answer in GHL Dialer!\n');
  console.log('Calling in 5 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const callData = {
      customer: {
        number: "+12136064730",
        name: "Test Receiver"
      },
      phoneNumberId: PHONE_NUMBER_ID,
      assistantId: MAIN_ASSISTANT_ID, // ← Using assistantId instead of squadId
      assistantOverrides: {
        firstMessage: "Hi Test, this is Keey calling about your property inquiry. Do you have a moment to chat?",
        model: {
          provider: "openai",
          model: "gpt-4o",
          toolIds: [
            "22eb8501-80fb-497f-87e8-6f0a88ac5eab", // check_calendar_availability_keey
            "d25e90cd-e6dc-423f-9719-96ca8c6541cb"  // book_calendar_appointment_keey
            // NOTE: Removed transferCall tool to avoid "Assistant Not Found" error
          ]
        },
        variableValues: {
          contactId: "ZtrIOxo50WVcsLbWK961",
          firstName: "Test",
          lastName: "Receiver",
          email: "test@example.com",
          phone: "+12136064730",
          propertyAddress: "123 Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          bedrooms: "3",
          region: "London",
          callSource: "Direct Assistant Test",
          callType: "lead_qualification",
          triggeredAt: new Date().toISOString(),
          greeting: "Hi Test, this is Keey calling about your property inquiry. Do you have a moment to chat?"
        }
      }
    };

    console.log('📤 Sending call request...');
    console.log('   Using: DIRECT ASSISTANT (not Squad)');
    console.log(`   Assistant ID: ${MAIN_ASSISTANT_ID}\n`);

    const response = await axios.post(
      'https://api.vapi.ai/call/phone',
      callData,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ CALL INITIATED!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📞 Call Details:');
    console.log(`   Call ID: ${response.data.id}`);
    console.log(`   Status: ${response.data.status}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🎯 TEST SCRIPT:');
    console.log('   1. Answer call in GHL Dialer');
    console.log('   2. Say: "Can I book an appointment?"');
    console.log('   3. Say: "Tomorrow at 2 PM"');
    console.log('   4. Check if calendar availability works!\n');
    
    console.log('📊 EXPECTED RESULT:');
    console.log('   ✅ AI should check calendar and present time slots');
    console.log('   ❌ If it fails, we know it\'s not a Squad-specific issue\n');
    
    console.log('🔗 Monitor:');
    console.log(`   Vapi Call: https://dashboard.vapi.ai/calls/${response.data.id}`);
    console.log('   Render Logs: https://dashboard.render.com/\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

triggerDirectAssistantCall();

