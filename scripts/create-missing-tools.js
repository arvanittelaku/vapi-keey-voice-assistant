#!/usr/bin/env node

/**
 * 🛠️  CREATE MISSING VAPI TOOLS
 * Creates cancel and confirmation tools as separate resources, then adds them to assistant
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n🛠️  CREATING MISSING VAPI TOOLS\n');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84';

if (!VAPI_API_KEY) {
  console.error('❌ Missing VAPI_API_KEY in .env');
  process.exit(1);
}

const SERVER_URL = process.env.VAPI_SERVER_URL || 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';

console.log(`📡 Server URL: ${SERVER_URL}\n`);

// Define the tools to create
const TOOLS_TO_CREATE = [
  {
    type: 'function',
    async: false,
    function: {
      name: 'cancel_appointment_keey',
      description: 'Cancels an existing appointment in the calendar. Use this when a customer wants to cancel their scheduled appointment. IMPORTANT: Use the appointmentId and contactId from the call metadata/variableValues.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: {
            type: 'string',
            description: 'The GHL calendar event ID from {{appointmentId}} in call metadata'
          },
          contactId: {
            type: 'string',
            description: 'The GHL contact ID from {{contactId}} in call metadata'
          },
          reason: {
            type: 'string',
            description: 'Reason for cancellation (e.g., "customer requested cancellation")'
          }
        },
        required: ['appointmentId', 'contactId', 'reason']
      }
    },
    server: {
      url: SERVER_URL
    }
  },
  {
    type: 'function',
    async: false,
    function: {
      name: 'update_appointment_confirmation',
      description: 'Updates the confirmation status of an appointment during a confirmation call. IMPORTANT: Use the appointmentId and contactId from the call metadata/variableValues.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The GHL contact ID from {{contactId}} in call metadata'
          },
          appointmentId: {
            type: 'string',
            description: 'The GHL calendar event ID from {{appointmentId}} in call metadata'
          },
          status: {
            type: 'string',
            enum: ['confirmed', 'cancelled', 'reschedule', 'no_answer'],
            description: 'Confirmation status based on customer response'
          }
        },
        required: ['contactId', 'appointmentId', 'status']
      }
    },
    server: {
      url: SERVER_URL
    }
  }
];

(async () => {
  try {
    console.log('📥 Step 1: Fetching current assistant configuration...\n');
    
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );
    
    const assistant = response.data;
    console.log(`✅ Fetched: ${assistant.name}`);
    console.log(`   Current tool IDs: ${assistant.model.toolIds ? assistant.model.toolIds.length : 0}\n`);
    
    // Step 2: List all existing tools to avoid duplicates
    console.log('📋 Step 2: Checking existing tools...\n');
    
    const toolsResponse = await axios.get(
      'https://api.vapi.ai/tool',
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );
    
    const existingTools = toolsResponse.data;
    console.log(`   Found ${existingTools.length} existing tools\n`);
    
    // Check which tools we need to create
    const newToolIds = [];
    
    for (const toolDef of TOOLS_TO_CREATE) {
      const toolName = toolDef.function.name;
      const existingTool = existingTools.find(t => 
        t.function && t.function.name === toolName
      );
      
      if (existingTool) {
        console.log(`   ✅ ${toolName} already exists (ID: ${existingTool.id})`);
        newToolIds.push(existingTool.id);
      } else {
        console.log(`   ❌ ${toolName} not found - creating...`);
        
        try {
          const createResponse = await axios.post(
            'https://api.vapi.ai/tool',
            toolDef,
            {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const createdTool = createResponse.data;
          console.log(`      ✅ Created! (ID: ${createdTool.id})`);
          newToolIds.push(createdTool.id);
        } catch (error) {
          console.error(`      ❌ Failed to create: ${error.message}`);
          if (error.response) {
            console.error(`         ${JSON.stringify(error.response.data)}`);
          }
        }
      }
    }
    
    if (newToolIds.length === 0) {
      console.log('\n⚠️  No tools created. Check errors above.\n');
      process.exit(1);
    }
    
    // Step 3: Add tool IDs to assistant
    console.log(`\n📝 Step 3: Adding ${newToolIds.length} tool(s) to assistant...\n`);
    
    const currentToolIds = assistant.model.toolIds || [];
    const updatedToolIds = [
      ...new Set([...currentToolIds, ...newToolIds])  // Remove duplicates
    ];
    
    console.log(`   Current tool IDs: ${currentToolIds.join(', ')}`);
    console.log(`   New tool IDs: ${newToolIds.join(', ')}`);
    console.log(`   Updated tool IDs: ${updatedToolIds.join(', ')}\n`);
    
    await axios.patch(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        model: {
          ...assistant.model,
          toolIds: updatedToolIds
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Tool IDs added to assistant!\n');
    
    console.log('=' + '='.repeat(59));
    console.log('🎉 TOOLS CREATED AND LINKED SUCCESSFULLY!');
    console.log('=' + '='.repeat(59));
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ cancel_appointment_keey tool created/found`);
    console.log(`   ✅ update_appointment_confirmation tool created/found`);
    console.log(`   ✅ Tools linked to Main Assistant`);
    console.log(`   📝 Total tools in assistant: ${updatedToolIds.length}\n`);
    
    console.log('✅ Verify by running:');
    console.log('   node scripts/check-vapi-assistant.js\n');
    
    console.log('🎯 Or check Vapi dashboard:');
    console.log('   https://dashboard.vapi.ai/assistants/' + MAIN_ASSISTANT_ID + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
})();

