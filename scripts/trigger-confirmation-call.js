require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

// Usage: node scripts/trigger-confirmation-call.js <phoneNumber> <contactId> <appointmentId> <appointmentTime>
// Example: node scripts/trigger-confirmation-call.js +447700900111 abc123 xyz789 "2:00 PM"

async function triggerConfirmationCall() {
  const phoneNumber = process.argv[2];
  const contactId = process.argv[3];
  const appointmentId = process.argv[4];
  const appointmentTime = process.argv[5] || "your scheduled time";

  if (!phoneNumber || !contactId || !appointmentId) {
    console.log('\n❌ Missing required arguments!\n');
    console.log('Usage: node scripts/trigger-confirmation-call.js <phoneNumber> <contactId> <appointmentId> <appointmentTime>');
    console.log('\nExample:');
    console.log('  node scripts/trigger-confirmation-call.js +447700900111 abc123 xyz789 "2:00 PM"\n');
    process.exit(1);
  }

  console.log('\n📞 TRIGGERING CONFIRMATION CALL\n');
  console.log('═'.repeat(80));
  console.log(`   Phone Number: ${phoneNumber}`);
  console.log(`   Contact ID: ${contactId}`);
  console.log(`   Appointment ID: ${appointmentId}`);
  console.log(`   Appointment Time: ${appointmentTime}`);
  console.log('═'.repeat(80));

  try {
    const callPayload = {
      assistantId: CONFIRMATION_ASSISTANT_ID,
      customer: {
        number: phoneNumber,
      },
      // Pass metadata that the AI can use
      assistant: {
        variableValues: {
          contactId: contactId,
          appointmentId: appointmentId,
          appointmentTime: appointmentTime,
          calendarId: "iJzQRjIWP6Gg4qlj9vOT", // Keey calendar ID
        }
      }
    };

    console.log('\n📤 Sending call request to Vapi...\n');

    const response = await axios.post(
      'https://api.vapi.ai/call/phone',
      callPayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ CALL INITIATED SUCCESSFULLY!\n');
    console.log('📋 Call Details:\n');
    console.log(`   Call ID: ${response.data.id}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Type: ${response.data.type}`);
    console.log(`   Created: ${new Date(response.data.createdAt).toLocaleString()}`);
    
    console.log('\n🎯 WHAT TO DO NOW:\n');
    console.log('   1. Answer the phone when it rings');
    console.log('   2. Test one of the scenarios from CONFIRMATION_TESTING_PLAN.md');
    console.log('   3. After the call, check:');
    console.log('      - Vapi Dashboard for call logs');
    console.log('      - GHL for appointment status');
    console.log('      - Render logs for tool execution');
    
    console.log('\n📊 Track call status:');
    console.log(`   https://dashboard.vapi.ai/calls/${response.data.id}\n`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR TRIGGERING CALL:\n');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    console.log('\n💡 Common Issues:');
    console.log('   - Invalid phone number format (use E.164: +447700900111)');
    console.log('   - Phone number not verified in Vapi');
    console.log('   - Insufficient Vapi credits');
    console.log('   - Invalid assistant ID\n');
  }
}

triggerConfirmationCall();

