const axios = require('axios');
require('dotenv').config();

const SERVER_URL = 'https://vapi-keey-voice-assistant.onrender.com';
const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function testConnectivity() {
  console.log('🔍 VAPI CONNECTIVITY DIAGNOSTIC\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Test 1: Can WE reach the server?
  console.log('TEST 1: Local → Server');
  console.log('----------------------------------------');
  try {
    const start = Date.now();
    await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
    console.log(`✅ Server reachable in ${Date.now() - start}ms\n`);
  } catch (error) {
    console.log(`❌ Server unreachable: ${error.message}\n`);
  }

  // Test 2: Can we send a tool call?
  console.log('TEST 2: Local → Server (Tool Call)');
  console.log('----------------------------------------');
  try {
    const start = Date.now();
    const response = await axios.post(
      `${SERVER_URL}/webhook/vapi`,
      {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "test_connectivity",
            type: "function",
            function: {
              name: "check_calendar_availability_keey",
              arguments: JSON.stringify({
                requestedDate: "tomorrow",
                requestedTime: "2 PM",
                timezone: "Europe/London"
              })
            }
          }]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    console.log(`✅ Tool call successful in ${Date.now() - start}ms`);
    console.log(`   Response: ${response.data.results[0].success ? 'SUCCESS' : 'FAILED'}\n`);
  } catch (error) {
    console.log(`❌ Tool call failed: ${error.message}\n`);
  }

  // Test 3: Check if Vapi has the correct server URL in tools
  console.log('TEST 3: Vapi Tool Configuration');
  console.log('----------------------------------------');
  try {
    const toolId = '22eb8501-80fb-497f-87e8-6f0a88ac5eab'; // check_calendar_availability_keey
    const response = await axios.get(
      `https://api.vapi.ai/tool/${toolId}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );
    
    const tool = response.data;
    console.log(`Tool: ${tool.function.name}`);
    console.log(`Server URL: ${tool.server?.url || 'NOT SET'}`);
    console.log(`Timeout: ${tool.server?.timeoutSeconds || 'NOT SET'}s`);
    
    if (tool.server?.url === `${SERVER_URL}/webhook/vapi`) {
      console.log('✅ Tool has correct server URL\n');
    } else {
      console.log(`❌ Tool has wrong URL! Expected: ${SERVER_URL}/webhook/vapi\n`);
    }
  } catch (error) {
    console.log(`❌ Failed to check tool config: ${error.message}\n`);
  }

  // Test 4: Try multiple rapid requests to simulate cold start
  console.log('TEST 4: Cold Start Simulation (5 rapid requests)');
  console.log('----------------------------------------');
  for (let i = 1; i <= 5; i++) {
    try {
      const start = Date.now();
      await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
      const time = Date.now() - start;
      console.log(`Request ${i}: ${time}ms ${time > 1000 ? '⚠️  SLOW' : '✅'}`);
    } catch (error) {
      console.log(`Request ${i}: ❌ TIMEOUT`);
    }
    // Wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 ANALYSIS:');
  console.log('If all tests pass but live calls still fail, the issue is:');
  console.log('1. Vapi cannot reach Render from their infrastructure');
  console.log('2. Squad is not routing tool calls to the tool server');
  console.log('3. Vapi is using cached/stale Squad configuration\n');
  
  console.log('💡 NEXT STEPS:');
  console.log('1. Check Render logs during next live call');
  console.log('2. If NO incoming request appears, Vapi is not sending it');
  console.log('3. Contact Vapi support with this diagnostic\n');
}

testConnectivity();


