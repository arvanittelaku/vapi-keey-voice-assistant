const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce'; // From phone number

async function checkPhoneAssistant() {
  console.log('🔍 CHECKING PHONE NUMBER\'S ASSISTANT CONFIGURATION\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const assistant = response.data;
    
    console.log('🤖 ASSISTANT DETAILS:');
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Name: ${assistant.name}`);
    console.log(`   Created: ${assistant.createdAt}`);
    console.log(`   Updated: ${assistant.updatedAt}\n`);
    
    console.log('🌐 SERVER CONFIGURATION:');
    console.log(`   Server URL: ${assistant.server?.url || 'NOT SET'}`);
    console.log(`   Server Timeout: ${assistant.server?.timeoutSeconds || 'NOT SET'}s\n`);
    
    console.log('📨 SERVER MESSAGES:');
    if (assistant.serverMessages) {
      console.log(`   ${JSON.stringify(assistant.serverMessages, null, 2)}`);
      
      const hasToolCalls = assistant.serverMessages.includes('tool-calls');
      const hasFunctionCall = assistant.serverMessages.includes('function-call');
      
      if (hasToolCalls) {
        console.log('\n   ✅ HAS "tool-calls" in serverMessages');
      } else if (hasFunctionCall) {
        console.log('\n   ⚠️  HAS OLD "function-call" only');
        console.log('   ❌ MISSING "tool-calls" - THIS IS THE PROBLEM!');
      } else {
        console.log('\n   ❌ MISSING both "tool-calls" and "function-call"!');
      }
    } else {
      console.log('   ❌ NOT SET!');
      console.log('   🚨 THIS IS WHY TOOL CALLS DON\'T WORK!');
    }
    
    console.log('\n🔧 TOOLS ATTACHED:');
    if (assistant.model?.toolIds) {
      console.log(`   Tool count: ${assistant.model.toolIds.length}`);
      assistant.model.toolIds.forEach((toolId, idx) => {
        console.log(`   ${idx + 1}. ${toolId}`);
      });
    } else {
      console.log('   ❌ NO TOOLS ATTACHED!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS:\n');
    
    if (!assistant.serverMessages || !assistant.serverMessages.includes('tool-calls')) {
      console.log('❌ PROBLEM FOUND:');
      console.log('   This assistant (used by phone number) is MISSING "tool-calls"');
      console.log('   in its serverMessages configuration!\n');
      console.log('✅ SOLUTION:');
      console.log('   Run: npm run fix-phone-assistant\n');
    } else {
      console.log('✅ This assistant is properly configured with "tool-calls"\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:');
    console.error(error.response?.data || error.message);
  }
}

checkPhoneAssistant().catch(console.error);

