/**
 * Automatically Attach Tools to Inbound Assistant
 * 
 * This script:
 * 1. Lists all available tools in Vapi
 * 2. Finds the 3 required tools by name
 * 3. Attaches them to the inbound assistant
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

const headers = {
  'Authorization': `Bearer ${VAPI_API_KEY}`,
  'Content-Type': 'application/json'
};

// Tools we need to attach
const REQUIRED_TOOLS = [
  'contact_create_keey',
  'check_calendar_availability_keey',
  'book_calendar_appointment_keey'
];

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     AUTOMATICALLY ATTACH TOOLS TO INBOUND ASSISTANT            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Get current assistant configuration
    console.log('📋 Step 1: Fetching inbound assistant...');
    const assistantResponse = await axios.get(
      `${VAPI_BASE_URL}/assistant/${INBOUND_ASSISTANT_ID}`,
      { headers }
    );
    const assistant = assistantResponse.data;
    console.log(`✅ Found: ${assistant.name}`);
    console.log(`   Current tools: ${assistant.model?.tools?.length || 0}`);

    // Step 2: List all available tools
    console.log('\n🔍 Step 2: Listing all available tools...');
    const toolsResponse = await axios.get(
      `${VAPI_BASE_URL}/tool`,
      { headers }
    );
    const allTools = toolsResponse.data;
    console.log(`✅ Found ${allTools.length} total tools in your account`);

    // Step 3: Find the required tools by name
    console.log('\n🔎 Step 3: Finding required tools...');
    const toolsToAttach = [];
    const toolsFound = [];
    
    for (const requiredToolName of REQUIRED_TOOLS) {
      const foundTool = allTools.find(tool => 
        tool.function?.name === requiredToolName ||
        tool.name === requiredToolName
      );
      
      if (foundTool) {
        console.log(`   ✅ Found: ${requiredToolName}`);
        console.log(`      ID: ${foundTool.id}`);
        toolsFound.push(requiredToolName);
        
        // Vapi expects tools in this format
        toolsToAttach.push({
          type: 'function',
          function: foundTool.function || {
            name: foundTool.name,
            description: foundTool.description,
            parameters: foundTool.parameters
          }
        });
      } else {
        console.log(`   ❌ NOT FOUND: ${requiredToolName}`);
      }
    }

    if (toolsFound.length === 0) {
      console.log('\n❌ ERROR: Could not find any of the required tools!');
      console.log('\nAvailable tools in your account:');
      allTools.forEach((tool, i) => {
        console.log(`   ${i + 1}. ${tool.function?.name || tool.name || 'Unknown'} (ID: ${tool.id})`);
      });
      console.log('\n⚠️  Make sure the tools are created in Vapi Dashboard first.');
      process.exit(1);
    }

    if (toolsFound.length < REQUIRED_TOOLS.length) {
      console.log(`\n⚠️  WARNING: Only found ${toolsFound.length}/${REQUIRED_TOOLS.length} required tools`);
      console.log('   Missing:', REQUIRED_TOOLS.filter(t => !toolsFound.includes(t)).join(', '));
      console.log('   Continuing with available tools...');
    }

    // Step 4: Update the assistant with the tools
    console.log('\n🔧 Step 4: Attaching tools to inbound assistant...');
    
    const updatePayload = {
      model: {
        ...assistant.model,
        tools: toolsToAttach
      }
    };

    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${INBOUND_ASSISTANT_ID}`,
      updatePayload,
      { headers }
    );

    console.log('✅ Successfully updated assistant!');
    console.log(`   Tools attached: ${toolsToAttach.length}`);

    // Step 5: Verify the update
    console.log('\n✅ Step 5: Verifying update...');
    const verifyResponse = await axios.get(
      `${VAPI_BASE_URL}/assistant/${INBOUND_ASSISTANT_ID}`,
      { headers }
    );
    
    const updatedAssistant = verifyResponse.data;
    const attachedTools = updatedAssistant.model?.tools || [];
    
    console.log(`   Tools now attached: ${attachedTools.length}`);
    attachedTools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ✅ ${tool.function?.name || 'Unknown'}`);
    });

    // Final summary
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                        SUCCESS!                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Inbound assistant now has ${attachedTools.length} tool(s) attached`);
    console.log('✅ The assistant can now:');
    if (toolsFound.includes('contact_create_keey')) {
      console.log('   - Create contacts in GHL');
    }
    if (toolsFound.includes('check_calendar_availability_keey')) {
      console.log('   - Check calendar availability');
    }
    if (toolsFound.includes('book_calendar_appointment_keey')) {
      console.log('   - Book appointments');
    }
    console.log('\n🚀 Inbound assistant is now FULLY FUNCTIONAL!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status === 401) {
      console.error('\n   → Check your VAPI_API_KEY in .env file');
    }
    process.exit(1);
  }
}

main();

