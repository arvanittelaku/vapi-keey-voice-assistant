const axios = require('axios');
require('dotenv').config();

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';

async function testToolCall() {
  console.log('🧪 TESTING TOOL CALL TO SERVER\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Simulate a real Vapi tool call for "today 11 AM"
  const payload = {
    message: {
      role: "tool_calls",
      toolCalls: [
        {
          id: "call_test123",
          type: "function",
          function: {
            name: "check_calendar_availability_keey",
            arguments: JSON.stringify({
              requestedDate: "today",
              requestedTime: "11 AM",
              timezone: "Europe/London"
            })
          }
        }
      ]
    },
    call: {
      id: "test-call-123"
    }
  };

  console.log('📤 Sending tool call webhook to server...');
  console.log(`   URL: ${SERVER_URL}/webhook/vapi`);
  console.log(`   Function: check_calendar_availability_keey`);
  console.log(`   Date: today`);
  console.log(`   Time: 11 AM\n`);

  try {
    const startTime = Date.now();
    
    const response = await axios.post(
      `${SERVER_URL}/webhook/vapi`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer d8cde4628cf511b5cf14c7c106154e226ee7721ba5235319faeac5c2562988aa'
        },
        timeout: 10000
      }
    );

    const latency = Date.now() - startTime;

    console.log(`✅ SUCCESS! Server responded in ${latency}ms\n`);
    console.log('📊 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (latency > 5000) {
      console.log('⚠️  WARNING: Response took > 5 seconds');
      console.log('   Vapi might timeout before receiving this\n');
    } else if (latency > 3000) {
      console.log('⚠️  CAUTION: Response took > 3 seconds');
      console.log('   This is close to Vapi\'s timeout threshold\n');
    } else {
      console.log('✅ Response time is good!\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TOOL CALL WORKING!\n');
    console.log('📝 The tool call executed successfully.');
    console.log('   Your server can handle check_calendar_availability.\n');
    console.log('🧪 Ready for a real Vapi call!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ FAILED!\n');
    if (error.code === 'ECONNABORTED') {
      console.error('   Timeout: Server took > 10 seconds to respond');
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.error('\n💡 This explains why Vapi tool calls are failing!');
  }
}

testToolCall();

