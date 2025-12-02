const axios = require('axios');

const SERVER_URL = 'https://vapi-keey-voice-assistant.onrender.com';

// EXACT payload from Vapi logs (from the failed call)
const exactPayload = {
  "message": {
    "toolCalls": [
      {
        "id": "call_SSmXjdjijDaoldUSZ4N2icac",
        "type": "function",
        "function": {
          "name": "check_calendar_availability_keey",
          "arguments": "{\n  \"timezone\": \"Europe/London\",\n  \"requestedDate\": \"today\",\n  \"requestedTime\": \"10 AM\"\n}"
        }
      }
    ],
    "role": "tool_calls",
    "message": "",
    "time": 1763020179693,
    "secondsFromStart": 20.887
  },
  "call": {
    "id": "019a7c30-a279-7aae-b63c-72929ba2e061"
  }
};

async function testExactPayload() {
  console.log('🧪 TESTING EXACT VAPI PAYLOAD FROM FAILED CALL\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📦 Payload being sent:');
  console.log(JSON.stringify(exactPayload, null, 2));
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  console.log('🚀 Sending to server...\n');
  
  try {
    const start = Date.now();
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, exactPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const elapsed = Date.now() - start;
    
    console.log(`✅ SUCCESS! Response received in ${elapsed}ms\n`);
    console.log('📨 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS:\n');
    console.log('If this test passed, the server CAN handle the format.');
    console.log('The issue is likely:');
    console.log('1. Vapi is not sending the webhook at all');
    console.log('2. Vapi is sending to a different URL');
    console.log('3. Vapi is timing out before the server responds\n');
    console.log('Check Render logs at 08:49:39-08:49:40 for incoming webhook');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
    
    if (error.response) {
      console.log('📨 Server Response:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS:\n');
    console.log('❌ Server cannot handle this format!');
    console.log('This means there is a bug in the server code.');
    console.log('═══════════════════════════════════════════════════════════');
  }
}

testExactPayload();

