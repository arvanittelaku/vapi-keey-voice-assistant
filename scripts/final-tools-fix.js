#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const INBOUND_ASSISTANT_ID = process.env.VAPI_INBOUND_ASSISTANT_ID;

const TOOL_IDS = [
  '39f85666-77ed-4481-920b-7599fcd4a968', // contact_create_keey
  '22eb8501-80fb-497f-87e8-6f0a88ac5eab', // check_calendar_availability_keey
  'd2e07bdb-ead7-4df6-a2d5-00efb1b5e87a'  // book_calendar_appointment_keey
];

async function attachTools() {
  try {
    console.log('\n🔧 Final Attempt: Attaching Tools to Inbound Assistant...\n');
    
    // Method 1: Using serverUrl approach (for server-side tools)
    console.log('Attempting to attach tools using serverUrl method...');
    
    const updatePayload = {
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        toolIds: TOOL_IDS
      }
    };
    
    const response = await axios.patch(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    // Try alternative method
    console.log('\n🔄 Trying alternative method...');
    try {
      const altPayload = {
        toolIds: TOOL_IDS
      };
      
      const altResponse = await axios.patch(
        `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
        altPayload,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Alternative method succeeded!');
      console.log('Tools attached:', altResponse.data.toolIds);
      
    } catch (altError) {
      console.error('❌ Alternative method also failed:', altError.response?.data || altError.message);
    }
  }
}

attachTools();

