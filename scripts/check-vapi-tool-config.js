const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const TOOL_ID = '22eb8501-80fb-497f-87e8-6f0a88ac5eab'; // check_calendar_availability_keey

async function checkToolConfig() {
  console.log('🔍 Checking Vapi Tool Configuration...\n');
  
  try {
    const response = await axios.get(`https://api.vapi.ai/tool/${TOOL_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });
    
    const tool = response.data;
    
    console.log('📋 Tool Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Tool ID: ${tool.id}`);
    console.log(`Tool Name: ${tool.function.name}`);
    console.log(`Tool Type: ${tool.type}\n`);
    
    if (tool.server) {
      console.log('🌐 Server Configuration:');
      console.log(`   URL: ${tool.server.url}`);
      console.log(`   Timeout: ${tool.server.timeoutSeconds} seconds`);
      console.log(`   Headers:`, JSON.stringify(tool.server.headers, null, 2));
    } else {
      console.log('❌ NO SERVER CONFIGURATION FOUND!');
      console.log('   This is why tool calls are failing!');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if URL is correct
    const expectedURL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';
    const fullExpectedURL = `${expectedURL}/webhook/vapi`;
    
    if (tool.server && tool.server.url === fullExpectedURL) {
      console.log('✅ Server URL is CORRECT');
    } else if (tool.server) {
      console.log(`❌ Server URL is WRONG!`);
      console.log(`   Current: ${tool.server.url}`);
      console.log(`   Expected: ${fullExpectedURL}`);
      console.log('\n   Run this to fix it:');
      console.log(`   npm run update-tool-url`);
    }
    
    // Check timeout
    if (tool.server && tool.server.timeoutSeconds >= 20) {
      console.log('✅ Timeout is sufficient (20+ seconds)');
    } else if (tool.server) {
      console.log(`⚠️  Timeout is too short: ${tool.server.timeoutSeconds} seconds`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tool configuration:', error.response?.data || error.message);
  }
}

checkToolConfig();

