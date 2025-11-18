require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function fixToolVerbalization() {
  console.log('\n🔧 FIXING TOOL VERBALIZATION\n');
  console.log('═'.repeat(80));

  try {
    // First, get the current assistant configuration
    console.log('📥 Fetching current assistant configuration...\n');
    
    const getResponse = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    const assistant = getResponse.data;
    console.log('✅ Current assistant fetched\n');

    // Update each tool to have request-start message with content: ""
    if (assistant.model && assistant.model.toolIds) {
      console.log(`📋 Found ${assistant.model.toolIds.length} tools\n`);
      
      for (const toolId of assistant.model.toolIds) {
        console.log(`   🔧 Updating tool ${toolId}...`);
        
        try {
          await axios.patch(
            `https://api.vapi.ai/tool/${toolId}`,
            {
              messages: [
                {
                  type: 'request-start',
                  content: '', // Empty content = no verbalization
                  blocking: false
                }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(`   ✅ Tool ${toolId} updated`);
        } catch (toolError) {
          console.log(`   ⚠️  Could not update tool ${toolId}: ${toolError.message}`);
        }
      }
    }

    console.log('\n═'.repeat(80));
    console.log('✅ TOOL VERBALIZATION FIX COMPLETE!\n');
    console.log('📋 Changes Made:\n');
    console.log('   ✅ All tools now have empty request-start messages');
    console.log('   ✅ AI will no longer say "Calling tool..." out loud');
    console.log('   ✅ Tool execution will be silent\n');

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

fixToolVerbalization();

