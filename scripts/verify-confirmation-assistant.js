require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function verifyConfirmationAssistant() {
  console.log('\n🔍 VERIFICATION - Confirmation Assistant Configuration\n');
  console.log('═'.repeat(80));

  try {
    // Get assistant configuration
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const assistant = response.data;

    console.log('\n📋 ASSISTANT DETAILS:\n');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Model: ${assistant.model?.provider} / ${assistant.model?.model}`);
    console.log(`   Voice: ${assistant.voice?.provider} / ${assistant.voice?.voiceId}`);

    console.log('\n🛠️  TOOLS ASSIGNED:\n');
    
    if (!assistant.model?.tools || assistant.model.tools.length === 0) {
      console.log('   ❌ NO TOOLS ASSIGNED!');
      console.log('   ⚠️  This will cause the assistant to fail during calls.\n');
      return;
    }

    assistant.model.tools.forEach((tool, idx) => {
      console.log(`   ${idx + 1}. ✅ ${tool.function?.name || 'Unknown'}`);
      console.log(`      → ${tool.function?.description?.substring(0, 80) || 'No description'}...`);
    });

    console.log('\n📝 FIRST MESSAGE:\n');
    console.log(`   ${assistant.firstMessage || '❌ NOT SET'}`);

    console.log('\n⏱️  CALL SETTINGS:\n');
    console.log(`   Max Duration: ${assistant.maxDurationSeconds || 'Not set'} seconds`);
    console.log(`   End Call Message: ${assistant.endCallMessage || 'Not set'}`);
    console.log(`   Silence Timeout: ${assistant.silenceTimeoutSeconds || 'Not set'} seconds`);

    console.log('\n🎯 EXPECTED TOOLS (should have 4):\n');
    console.log('   1. update_appointment_confirmation');
    console.log('   2. cancel_appointment_keey');
    console.log('   3. check_calendar_availability_keey');
    console.log('   4. book_calendar_appointment_keey');

    const toolNames = assistant.model.tools.map(t => t.function?.name || '');
    const hasUpdate = toolNames.some(n => n.includes('update_appointment'));
    const hasCancel = toolNames.some(n => n.includes('cancel'));
    const hasCheck = toolNames.some(n => n.includes('check_calendar'));
    const hasBook = toolNames.some(n => n.includes('book_calendar'));

    console.log('\n✅ VERIFICATION RESULTS:\n');
    console.log(`   ${hasUpdate ? '✅' : '❌'} update_appointment_confirmation`);
    console.log(`   ${hasCancel ? '✅' : '❌'} cancel_appointment_keey`);
    console.log(`   ${hasCheck ? '✅' : '❌'} check_calendar_availability_keey`);
    console.log(`   ${hasBook ? '✅' : '❌'} book_calendar_appointment_keey`);

    if (hasUpdate && hasCancel && hasCheck && hasBook) {
      console.log('\n🎉 ALL REQUIRED TOOLS ARE ASSIGNED!\n');
      console.log('═'.repeat(80));
      console.log('\n✅ CONFIRMATION ASSISTANT IS READY FOR TESTING\n');
    } else {
      console.log('\n❌ MISSING TOOLS - Need to fix before testing\n');
      console.log('═'.repeat(80));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

verifyConfirmationAssistant();

