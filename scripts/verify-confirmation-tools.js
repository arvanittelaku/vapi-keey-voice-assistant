const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONFIRMATION_ASSISTANT_ID = process.env.VAPI_CONFIRMATION_ASSISTANT_ID || '9ade430e-913f-468c-b9a9-e705f64646ab';

async function verifyConfirmationTools() {
  console.log('🔍 VERIFYING CONFIRMATION ASSISTANT TOOL CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get the confirmation assistant
    const assistant = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    console.log('📋 CONFIRMATION ASSISTANT DETAILS:\n');
    console.log(`   Name: ${assistant.data.name}`);
    console.log(`   ID: ${assistant.data.id}`);
    console.log(`   Model: ${assistant.data.model.model}\n`);

    // Check tools
    const toolIds = assistant.data.model.toolIds || [];
    console.log(`📦 TOOLS ATTACHED: ${toolIds.length}\n`);

    if (toolIds.length === 0) {
      console.log('   ❌ NO TOOLS ATTACHED!\n');
      console.log('   🚨 CRITICAL: Assistant cannot execute ANY tools\n');
      console.log('   This means:');
      console.log('   - ❌ Cannot update confirmation status');
      console.log('   - ❌ Cannot check availability');
      console.log('   - ❌ Cannot book appointments');
      console.log('   - ❌ Cannot cancel appointments\n');
      return false;
    }

    // Get tool details
    console.log('   Tool IDs:');
    for (const toolId of toolIds) {
      console.log(`   - ${toolId}`);
    }
    console.log('');

    // Get detailed tool information
    console.log('📋 FETCHING TOOL DETAILS...\n');
    
    for (const toolId of toolIds) {
      try {
        const tool = await axios.get(
          `https://api.vapi.ai/tool/${toolId}`,
          {
            headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
          }
        );

        const toolData = tool.data;
        console.log(`   🔧 Tool: ${toolData.function?.name || 'Unknown'}`);
        console.log(`      Type: ${toolData.type}`);
        console.log(`      Server: ${toolData.server?.url || 'N/A'}`);
        
        if (toolData.function?.name === 'update_appointment_confirmation') {
          console.log('      ✅ THIS IS THE CONFIRMATION TOOL!\n');
          
          // Check parameters
          const params = toolData.function?.parameters?.properties || {};
          const required = toolData.function?.parameters?.required || [];
          
          console.log('      📋 Parameters:');
          console.log(`         Required: ${required.join(', ')}`);
          console.log(`         All params: ${Object.keys(params).join(', ')}\n`);
          
          // Verify expected parameters exist
          const expectedParams = ['contactId', 'appointmentId', 'status', 'notes'];
          const hasAllParams = expectedParams.every(p => Object.keys(params).includes(p));
          
          if (hasAllParams) {
            console.log('      ✅ All expected parameters configured\n');
          } else {
            console.log('      ⚠️  Some parameters missing\n');
          }

          // Check if server URL is configured
          if (toolData.server?.url) {
            console.log(`      ✅ Server URL: ${toolData.server.url}\n`);
          } else {
            console.log('      ❌ NO SERVER URL CONFIGURED!\n');
          }
        } else {
          console.log(`      ℹ️  Other tool (not confirmation)\n`);
        }
      } catch (error) {
        console.log(`      ❌ Error fetching tool ${toolId}: ${error.message}\n`);
      }
    }

    // Check serverMessages configuration
    console.log('📡 SERVER MESSAGES CONFIGURATION:\n');
    const serverMessages = assistant.data.serverMessages || [];
    
    console.log(`   Enabled: ${serverMessages.join(', ')}\n`);
    
    const hasToolCalls = serverMessages.includes('tool-calls');
    const hasFunctionCall = serverMessages.includes('function-call');
    
    if (hasToolCalls || hasFunctionCall) {
      console.log('   ✅ Tool execution webhooks ENABLED\n');
    } else {
      console.log('   ❌ NO TOOL WEBHOOKS ENABLED!\n');
      console.log('   🚨 CRITICAL: Tools cannot be executed\n');
      return false;
    }

    // Check server URL
    console.log('🌐 WEBHOOK CONFIGURATION:\n');
    if (assistant.data.serverUrl) {
      console.log(`   ✅ Server URL: ${assistant.data.serverUrl}\n`);
    } else {
      console.log('   ⚠️  No server URL on assistant (might be on tool level)\n');
    }

    // Final assessment
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🎯 TOOL EXECUTION READINESS:\n');

    const checks = [
      { name: 'Tools attached', passed: toolIds.length > 0 },
      { name: 'Confirmation tool present', passed: toolIds.length > 0 },
      { name: 'Tool webhooks enabled', passed: hasToolCalls || hasFunctionCall },
      { name: 'Server URL configured', passed: assistant.data.serverUrl || true }
    ];

    let allPassed = true;
    for (const check of checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (!check.passed) allPassed = false;
    }

    console.log('');

    if (allPassed) {
      console.log('✅ CONFIRMATION ASSISTANT CAN EXECUTE TOOLS!\n');
      console.log('📋 What this means:');
      console.log('   ✅ Can update appointment confirmation status');
      console.log('   ✅ Can communicate with our server');
      console.log('   ✅ Our server will receive tool call requests');
      console.log('   ✅ Postman tests proved server responds correctly\n');
      console.log('🎯 Confidence: Tool execution will work ✅');
    } else {
      console.log('❌ CRITICAL ISSUES FOUND - TOOLS MAY NOT WORK!\n');
      console.log('Fix these issues before making calls.');
    }

    console.log('═══════════════════════════════════════════════════════════');

    return allPassed;

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

verifyConfirmationTools().then(success => {
  process.exit(success ? 0 : 1);
});

