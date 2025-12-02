/**
 * Test script that sends the EXACT payload Vapi sent during the failed call
 * to verify our server responds correctly
 */

const axios = require('axios');

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/vapi`;

// EXACT payload from the failed call at 16:32
const EXACT_VAPI_PAYLOAD = {
  "message": {
    "timestamp": 1762875157968,
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "call_X7nFmIYMlIwUvqr61bKjuNYe",
        "type": "function",
        "function": {
          "name": "check_calendar_availability_keey",
          "arguments": "{\n  \"requestedDate\": \"today\",\n  \"requestedTime\": \"6 PM\",\n  \"timezone\": \"Europe/London\"\n}"
        }
      }
    ],
    "toolCallList": [
      {
        "id": "call_X7nFmIYMlIwUvqr61bKjuNYe",
        "type": "function",
        "function": {
          "name": "check_calendar_availability_keey",
          "arguments": "{\n  \"requestedDate\": \"today\",\n  \"requestedTime\": \"6 PM\",\n  \"timezone\": \"Europe/London\"\n}"
        }
      }
    ]
  },
  "call": {
    "id": "019a738b-9c40-7dd7-8fc5-40354d72fafa"
  }
};

async function testExactPayload() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING EXACT VAPI PAYLOAD FROM FAILED CALL');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log('This is the EXACT payload Vapi sent during the failed call');
  console.log('at 16:32 (4:32 PM) on November 11, 2025\n');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  console.log('📦 Payload:');
  console.log(JSON.stringify(EXACT_VAPI_PAYLOAD, null, 2));
  console.log('\n⏱️  Sending request...\n');

  const startTime = Date.now();

  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, EXACT_VAPI_PAYLOAD, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20000, // 20 second timeout (same as Vapi)
    });

    const latency = Date.now() - startTime;

    console.log(`✅ Response received in ${latency}ms`);
    console.log(`📊 Status Code: ${response.status}`);
    console.log('📤 Response:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS');
    console.log('════════════════════════════════════════════════════════════\n');

    if (response.status === 200) {
      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        if (result.success) {
          console.log('✅ Server processed the tool call successfully');
          console.log(`✅ Response format: CORRECT`);
          console.log(`✅ Response time: ${latency}ms (< 20s timeout)`);
          console.log('\n🎯 DIAGNOSIS:');
          console.log('The server IS working correctly with the exact Vapi format.');
          console.log('The issue during the live call was likely:');
          console.log('1. Render "cold start" delay (first request >20s)');
          console.log('2. Network latency between Vapi and Render');
          console.log('3. Vapi not waiting for the full response');
          console.log('\n💡 SOLUTION:');
          console.log('Make another test call to keep Render warm.');
        } else {
          console.log('❌ Server responded but indicated failure');
          console.log('Error:', result.message);
        }
      } else {
        console.log('❌ Server responded but with unexpected format');
        console.log('Expected: { results: [{ success: true, ... }] }');
        console.log('Got:', response.data);
      }
    } else {
      console.log(`❌ Unexpected status code: ${response.status}`);
    }

  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`❌ Request failed after ${latency}ms\n`);
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️  REQUEST TIMED OUT (>20 seconds)');
      console.log('\n🎯 DIAGNOSIS:');
      console.log('The server took longer than 20 seconds to respond.');
      console.log('This is why Vapi showed "No result returned".');
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('1. Render free tier "cold start" (can take 30+ seconds)');
      console.log('2. GHL API is slow to respond');
      console.log('3. Server is overloaded or crashed');
    } else if (error.response) {
      console.log(`📊 Status Code: ${error.response.status}`);
      console.log('📤 Response:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response from server (network issue or server down)');
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════\n');
}

// Run the test
testExactPayload();

