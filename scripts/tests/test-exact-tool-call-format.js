const axios = require('axios');

const SERVER_URL = 'https://vapi-keey-voice-assistant.onrender.com';

// This is the EXACT payload Vapi sent during the failed call
const exactPayload = {
  "message": {
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "call_TestExactFormat123",
        "type": "function",
        "function": {
          "name": "check_calendar_availability_keey",
          "arguments": JSON.stringify({
            "requestedDate": "today",
            "requestedTime": "11 AM",
            "timezone": "Europe/London"
          })
        }
      }
    ],
    "call": {
      "id": "test-exact-format-call"
    }
  }
};

async function testExactFormat() {
  console.log('🧪 Testing EXACT Vapi Tool Call Format\n');
  console.log('📦 Payload:');
  console.log(JSON.stringify(exactPayload, null, 2));
  console.log('\n📤 Sending to:', `${SERVER_URL}/webhook/vapi`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${SERVER_URL}/webhook/vapi`,
      exactPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Vapi-Secret': 'your_webhook_secret_here',
        },
        timeout: 10000
      }
    );
    const endTime = Date.now();
    
    console.log(`\n✅ Response received in ${endTime - startTime}ms`);
    console.log('📥 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testExactFormat();

