#!/usr/bin/env node

/**
 * Fix Tools Attachment for Inbound Assistant
 * Using the correct API method
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const INBOUND_ASSISTANT_ID = process.env.VAPI_INBOUND_ASSISTANT_ID;

// Tool IDs for inbound assistant
const TOOL_IDS = [
  '39f85666-77ed-4481-920b-7599fcd4a968', // contact_create_keey
  '22eb8501-80fb-497f-87e8-6f0a88ac5eab', // check_calendar_availability_keey
  'd2e07bdb-ead7-4df6-a2d5-00efb1b5e87a'  // book_calendar_appointment_keey
];

async function attachTools() {
  try {
    console.log('\n🔧 Attaching Tools to Inbound Assistant...\n');
    
    // First, get current assistant config
    const getResponse = await axios.get(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Current Assistant:', getResponse.data.name);
    console.log('Current Tools:', getResponse.data.model?.tools?.length || 0);
    
    // Build tools array for model
    const tools = TOOL_IDS.map(toolId => ({
      type: 'function',
      id: toolId
    }));
    
    // Update assistant with tools in the model
    const updatePayload = {
      model: {
        ...getResponse.data.model,
        tools: tools
      }
    };
    
    console.log('\n🔄 Updating assistant...');
    console.log('Attaching', tools.length, 'tools');
    
    const updateResponse = await axios.patch(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Tools attached successfully!');
    console.log('\n📋 Tools Now Available:');
    console.log('   1. contact_create_keey');
    console.log('   2. check_calendar_availability_keey');
    console.log('   3. book_calendar_appointment_keey');
    console.log('\n✨ Assistant is now fully functional!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

attachTools();

