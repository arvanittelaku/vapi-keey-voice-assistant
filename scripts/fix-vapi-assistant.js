#!/usr/bin/env node

/**
 * 🔧 AUTOMATIC VAPI ASSISTANT FIX
 * Adds missing tools to Keey Main Assistant via Vapi API
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n🔧 FIXING VAPI ASSISTANT AUTOMATICALLY\n');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84'; // From verification

if (!VAPI_API_KEY) {
  console.error('❌ Missing VAPI_API_KEY in .env');
  process.exit(1);
}

// Get the server URL from environment or use default
const SERVER_URL = process.env.VAPI_SERVER_URL || 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';

console.log(`📡 Server URL: ${SERVER_URL}\n`);

// Define the missing tools
const MISSING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'cancel_appointment_keey',
      description: 'Cancels an existing appointment in the calendar. Use this when a customer wants to cancel their scheduled appointment.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: {
            type: 'string',
            description: 'The GHL calendar event ID of the appointment to cancel. Get this from the call metadata or customer info.'
          },
          contactId: {
            type: 'string',
            description: 'The GHL contact ID. Get this from the call metadata.'
          },
          reason: {
            type: 'string',
            description: 'The reason for cancellation (e.g., "customer requested", "rescheduled to new date", "no longer needed")'
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
    function: {
      name: 'update_appointment_confirmation',
      description: 'Updates the confirmation status of an appointment. Use this during confirmation calls to record whether the customer confirmed, cancelled, or wants to reschedule.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The GHL contact ID. Get this from the call metadata.'
          },
          appointmentId: {
            type: 'string',
            description: 'The GHL calendar event ID. Get this from the call metadata.'
          },
          status: {
            type: 'string',
            enum: ['confirmed', 'cancelled', 'reschedule', 'no_answer'],
            description: 'The confirmation status: "confirmed" if customer confirms, "cancelled" if they cancel, "reschedule" if they want to reschedule, "no_answer" if no response'
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

// Pronunciation guide to add to prompt
const PRONUNCIATION_GUIDE = `

IMPORTANT PRONUNCIATION:
- Always pronounce "Keey" as "KEE-ee" (two syllables: KEE-ee)
- Example: "Welcome to KEE-ee Property Management"

`;

(async () => {
  try {
    console.log('📥 Step 1: Fetching current assistant configuration...\n');
    
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const assistant = response.data;
    console.log(`✅ Fetched: ${assistant.name}`);
    console.log(`   Current tools: ${assistant.model.tools ? assistant.model.tools.length : 0}\n`);
    
    // Check which tools are missing
    const existingToolNames = assistant.model.tools 
      ? assistant.model.tools.map(t => t.function.name)
      : [];
    
    console.log('🔍 Checking for missing tools:\n');
    
    const toolsToAdd = [];
    for (const tool of MISSING_TOOLS) {
      const toolName = tool.function.name;
      if (existingToolNames.includes(toolName)) {
        console.log(`   ✅ ${toolName} - Already exists`);
      } else {
        console.log(`   ❌ ${toolName} - MISSING (will add)`);
        toolsToAdd.push(tool);
      }
    }
    
    if (toolsToAdd.length === 0) {
      console.log('\n✅ All tools already configured! Nothing to fix.\n');
    } else {
      console.log(`\n📝 Step 2: Adding ${toolsToAdd.length} missing tool(s)...\n`);
      
      // Add missing tools to existing tools
      const updatedTools = [
        ...(assistant.model.tools || []),
        ...toolsToAdd
      ];
      
      // Update assistant
      const updatePayload = {
        model: {
          ...assistant.model,
          tools: updatedTools
        }
      };
      
      await axios.patch(
        `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Tools added successfully!\n');
    }
    
    // Add pronunciation guide if not present
    console.log('📝 Step 3: Checking pronunciation guide...\n');
    
    const systemMessage = assistant.model.messages.find(m => m.role === 'system');
    if (systemMessage) {
      if (systemMessage.content.includes('KEE-ee')) {
        console.log('   ✅ Pronunciation guide already present\n');
      } else {
        console.log('   ❌ Pronunciation guide missing - adding...\n');
        
        // Add pronunciation guide to the beginning of the prompt
        const updatedContent = PRONUNCIATION_GUIDE + systemMessage.content;
        
        const updatedMessages = assistant.model.messages.map(m => 
          m.role === 'system' ? { ...m, content: updatedContent } : m
        );
        
        await axios.patch(
          `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
          {
            model: {
              ...assistant.model,
              messages: updatedMessages
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Pronunciation guide added!\n');
      }
    }
    
    console.log('=' + '='.repeat(59));
    console.log('🎉 ASSISTANT FIXED SUCCESSFULLY!');
    console.log('=' + '='.repeat(59));
    
    console.log('\n📊 Updated Configuration:');
    console.log(`   Tools: ${updatedTools ? updatedTools.length : assistant.model.tools.length}`);
    console.log(`   ✅ cancel_appointment_keey`);
    console.log(`   ✅ update_appointment_confirmation`);
    console.log(`   ✅ Pronunciation guide (KEE-ee)\n`);
    
    console.log('✅ Run verification to confirm:');
    console.log('   node scripts/check-vapi-assistant.js\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
})();

