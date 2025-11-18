require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function checkToolsDetailed() {
  console.log('\n🔧 CHECKING TOOLS ASSIGNMENT\n');
  console.log('═'.repeat(80));

  try {
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    const assistant = response.data;
    
    console.log('\n📊 TOOL ASSIGNMENT CHECK:\n');

    // Check model.tools (newer format)
    if (assistant.model?.tools && assistant.model.tools.length > 0) {
      console.log(`   ✅ Tools in model.tools: ${assistant.model.tools.length}`);
      assistant.model.tools.forEach((tool, idx) => {
        const toolName = tool.function?.name || 'unknown';
        console.log(`      ${idx + 1}. ${toolName}`);
      });
    } else {
      console.log('   ℹ️  No tools in model.tools (might use model.toolIds instead)');
    }

    // Check model.toolIds (older format)
    if (assistant.model?.toolIds && assistant.model.toolIds.length > 0) {
      console.log(`\n   ✅ Tool IDs in model.toolIds: ${assistant.model.toolIds.length}`);
      assistant.model.toolIds.forEach((toolId, idx) => {
        console.log(`      ${idx + 1}. ${toolId}`);
      });
    } else {
      console.log('\n   ℹ️  No tool IDs in model.toolIds');
    }

    // Determine status
    const totalTools = (assistant.model?.tools?.length || 0) + (assistant.model?.toolIds?.length || 0);
    
    console.log('\n═'.repeat(80));
    console.log('\n📋 SUMMARY:\n');
    
    if (totalTools >= 4) {
      console.log(`   ✅ TOOLS OK: ${totalTools} tools assigned`);
      console.log('   ✅ Confirmation assistant has necessary tools');
      console.log('\n   Required tools:');
      console.log('   1. update_appointment_confirmation');
      console.log('   2. check_calendar_availability_keey');
      console.log('   3. book_calendar_appointment_keey');
      console.log('   4. cancel_appointment_keey\n');
    } else if (totalTools > 0) {
      console.log(`   ⚠️  PARTIAL: ${totalTools} tools assigned (need 4)`);
    } else {
      console.log('   ❌ NO TOOLS: Assistant has no tools assigned!');
      console.log('   ⚠️  This will cause the assistant to fail during calls');
    }

  } catch (error) {
    console.error('\n❌ ERROR:\n');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

checkToolsDetailed();

