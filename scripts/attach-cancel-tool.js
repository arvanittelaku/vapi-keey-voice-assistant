const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONFIRMATION_ASSISTANT_ID = process.env.VAPI_CONFIRMATION_ASSISTANT_ID || '9ade430e-913f-468c-b9a9-e705f64646ab';

// Tool IDs (including the cancel tool from screenshot)
const TOOL_IDS = {
  update_appointment_confirmation: '63b9a1ec-138c-4e64-8402-c3370554ea81',
  check_calendar_availability: '22eb8501-80fb-497f-87e8-6f0a88ac5eab',
  book_calendar_appointment: 'd25e90cd-e6dc-423f-9719-96ca8c6541cb',
  cancel_appointment: '45580452-1407-40b0-b714-df7914d05604',  // From screenshot
};

async function attachCancelTool() {
  console.log('🔧 ATTACHING CANCEL_APPOINTMENT TOOL\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // First, verify the cancel tool exists and check its configuration
    console.log('🔍 Verifying cancel_appointment_keey tool...\n');
    
    const cancelTool = await axios.get(
      `https://api.vapi.ai/tool/${TOOL_IDS.cancel_appointment}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    console.log('📋 Cancel Tool Details:\n');
    console.log(`   Name: ${cancelTool.data.function?.name}`);
    console.log(`   Description: ${cancelTool.data.function?.description?.substring(0, 80)}...`);
    console.log(`   Server URL: ${cancelTool.data.server?.url || 'NOT SET'}\n`);

    // Check parameters
    const params = cancelTool.data.function?.parameters?.properties || {};
    const required = cancelTool.data.function?.parameters?.required || [];
    
    console.log('   Parameters:');
    console.log(`   - Required: ${required.join(', ')}`);
    console.log(`   - All: ${Object.keys(params).join(', ')}\n`);

    // Get current assistant configuration
    const assistant = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const currentToolIds = assistant.data.model.toolIds || [];
    console.log('📋 Current Assistant Tools:\n');
    console.log(`   Attached: ${currentToolIds.length} tools\n`);

    // Check if cancel tool is already attached
    if (currentToolIds.includes(TOOL_IDS.cancel_appointment)) {
      console.log('   ✅ cancel_appointment_keey is ALREADY attached!\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n🎉 NO CHANGES NEEDED - Tool already configured!\n');
      return true;
    }

    // Add cancel tool to the list
    const newToolIds = [
      TOOL_IDS.update_appointment_confirmation,
      TOOL_IDS.check_calendar_availability,
      TOOL_IDS.book_calendar_appointment,
      TOOL_IDS.cancel_appointment  // ADD THIS
    ];

    console.log('📦 Updating to include:\n');
    console.log('   1. ✅ update_appointment_confirmation');
    console.log('   2. ✅ check_calendar_availability_keey');
    console.log('   3. ✅ book_calendar_appointment_keey');
    console.log('   4. ➕ cancel_appointment_keey (ADDING)\n');

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

    console.log('✅ CANCEL TOOL ATTACHED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🎉 CONFIRMATION ASSISTANT NOW HAS ALL 4 TOOLS:\n');
    console.log('   ✅ update_appointment_confirmation');
    console.log('      → Updates status in GHL custom field\n');
    console.log('   ✅ check_calendar_availability_keey');
    console.log('      → Checks available time slots\n');
    console.log('   ✅ book_calendar_appointment_keey');
    console.log('      → Books new appointments\n');
    console.log('   ✅ cancel_appointment_keey  ← NEW!');
    console.log('      → Cancels appointments in GHL calendar\n');
    
    console.log('📋 COMPLETE RESCHEDULING FLOW NOW WORKS:\n');
    console.log('   1. User: "I need to reschedule"');
    console.log('   2. AI checks availability → Shows slots');
    console.log('   3. User chooses new time');
    console.log('   4. AI books NEW appointment ✅');
    console.log('   5. AI cancels OLD appointment ✅  ← NOW POSSIBLE!');
    console.log('   6. AI updates confirmation status ✅\n');
    
    console.log('═══════════════════════════════════════════════════════════');

    return true;

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

attachCancelTool().then(success => {
  process.exit(success ? 0 : 1);
});

