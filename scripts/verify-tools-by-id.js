#!/usr/bin/env node

/**
 * 🔍 VERIFY TOOLS BY ID
 * Fetches tool details by their IDs to confirm they're properly configured
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84';

console.log('\n🔍 VERIFYING TOOLS BY ID\n');

(async () => {
  try {
    // Fetch assistant
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );
    
    const assistant = response.data;
    const toolIds = assistant.model.toolIds || [];
    
    console.log(`📋 Assistant: ${assistant.name}`);
    console.log(`📝 Tool IDs: ${toolIds.length}\n`);
    
    if (toolIds.length === 0) {
      console.log('❌ No tools configured!');
      process.exit(1);
    }
    
    // Fetch each tool
    console.log('🛠️  Fetching tool details:\n');
    
    const expectedTools = [
      'check_calendar_availability_keey',  // Note: has _keey suffix
      'book_calendar_appointment_keey',
      'cancel_appointment_keey',
      'update_appointment_confirmation'
    ];
    
    const foundTools = {};
    
    for (const toolId of toolIds) {
      try {
        const toolResponse = await axios.get(
          `https://api.vapi.ai/tool/${toolId}`,
          {
            headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
          }
        );
        
        const tool = toolResponse.data;
        const toolName = tool.function ? tool.function.name : 'Unknown';
        foundTools[toolName] = true;
        
        console.log(`   ✅ ${toolName}`);
        console.log(`      ID: ${tool.id}`);
        console.log(`      Server: ${tool.server ? tool.server.url : 'N/A'}`);
        
        if (tool.function && tool.function.parameters) {
          const params = Object.keys(tool.function.parameters.properties || {});
          console.log(`      Parameters: ${params.join(', ')}`);
        }
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Tool ID ${toolId}: ${error.message}\n`);
      }
    }
    
    // Check if all expected tools are present
    console.log('=' + '='.repeat(59));
    console.log('📊 TOOL STATUS CHECK');
    console.log('=' + '='.repeat(59) + '\n');
    
    let allPresent = true;
    for (const toolName of expectedTools) {
      if (foundTools[toolName]) {
        console.log(`   ✅ ${toolName} - FOUND`);
      } else {
        console.log(`   ❌ ${toolName} - MISSING`);
        allPresent = false;
      }
    }
    
    console.log('');
    
    if (allPresent) {
      console.log('🎉 ALL REQUIRED TOOLS CONFIGURED!');
      console.log('✅ ASSISTANT IS 100% READY FOR AWS DEPLOYMENT!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tools are still missing.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
})();

