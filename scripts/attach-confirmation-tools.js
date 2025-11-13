const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONFIRMATION_ASSISTANT_ID = process.env.VAPI_CONFIRMATION_ASSISTANT_ID || '9ade430e-913f-468c-b9a9-e705f64646ab';

// Tool IDs from the screenshots
const TOOL_IDS = {
  update_appointment_confirmation: '63b9a1ec-138c-4e64-8402-c3370554ea81',
  check_calendar_availability: '22eb8501-80fb-497f-87e8-6f0a88ac5eab',
  book_calendar_appointment: 'd25e90cd-e6dc-423f-9719-96ca8c6541cb',
  // NOT including transfer_call and contact_create (only for inbound)
};

async function attachTools() {
  console.log('🔧 ATTACHING TOOLS TO CONFIRMATION ASSISTANT\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get current assistant configuration
    const assistant = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    console.log('📋 Current Configuration:\n');
    console.log(`   Assistant: ${assistant.data.name}`);
    console.log(`   Current Tools: ${assistant.data.model.toolIds?.length || 0}\n`);

    // Prepare the new toolIds array
    const newToolIds = [
      TOOL_IDS.update_appointment_confirmation,  // Keep existing
      TOOL_IDS.check_calendar_availability,       // ADD
      TOOL_IDS.book_calendar_appointment          // ADD
    ];

    console.log('📦 Tools to attach:\n');
    console.log('   1. ✅ update_appointment_confirmation (already has)');
    console.log('   2. ➕ check_calendar_availability_keey (ADDING)');
    console.log('   3. ➕ book_calendar_appointment_keey (ADDING)\n');

    console.log('   ⚠️  NOT adding (these are for inbound only):');
    console.log('   - ❌ transfer_call_keey');
    console.log('   - ❌ contact_create_keey\n');

    // Update the assistant
    const updates = {
      model: {
        ...assistant.data.model,
        toolIds: newToolIds
      }
    };

    console.log('🔄 Updating assistant...\n');

    await axios.patch(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ TOOLS ATTACHED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🎉 CONFIRMATION ASSISTANT NOW HAS:\n');
    console.log('   ✅ update_appointment_confirmation');
    console.log('      → Can update status (confirmed/cancelled/reschedule)\n');
    console.log('   ✅ check_calendar_availability_keey');
    console.log('      → Can check available time slots\n');
    console.log('   ✅ book_calendar_appointment_keey');
    console.log('      → Can book new appointments\n');
    
    console.log('📋 WHAT THIS ENABLES:\n');
    console.log('   ✅ User confirms → Updates status');
    console.log('   ✅ User cancels → Updates status');
    console.log('   ✅ User wants to reschedule → CAN NOW DO IT LIVE:');
    console.log('      1. Checks availability');
    console.log('      2. Shows time slots');
    console.log('      3. Books new appointment');
    console.log('      4. Updates confirmation status\n');
    
    console.log('⚠️  NOTE: You still need to create cancel_appointment tool');
    console.log('           to fully complete the rescheduling flow.\n');
    
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

attachTools();

