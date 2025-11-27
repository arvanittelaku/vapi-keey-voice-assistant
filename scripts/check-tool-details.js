#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const TOOL_ID = '39f85666-77ed-4481-920b-7599fcd4a968';
const INBOUND_ASSISTANT_ID = process.env.VAPI_INBOUND_ASSISTANT_ID;

async function checkTool() {
  try {
    console.log('\n📋 Checking Tool Configuration...\n');
    
    // Get tool details
    const toolResponse = await axios.get(
      `https://api.vapi.ai/tool/${TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Tool Details:');
    console.log(JSON.stringify(toolResponse.data, null, 2));
    
    // Get assistant details to see how tools are attached
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n\nAssistant Tool Configuration:');
    console.log('Tool IDs:', assistantResponse.data.toolIds);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkTool();

