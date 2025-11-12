// Test if the response format needs to be different for tool-calls

const axios = require('axios');

const SERVER_URL = 'https://vapi-keey-voice-assistant.onrender.com';

async function testToolCallsFormat() {
  console.log("Ì∑™ Testing NEW tool-calls format (what Vapi actually sends)...\n");
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: "tool-calls",  // NEW FORMAT
        toolCalls: [
          {
            id: "call_TestNewFormat123",
            type: "function",
            function: {
              name: "check_calendar_availability_keey",
              arguments: {
                requestedDate: "tomorrow",
                requestedTime: "2 PM",
                timezone: "Europe/London"
              }
            }
          }
        ]
      },
      call: {
        id: "test-new-format-call"
      }
    });
    
    console.log("‚úÖ Response received:");
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if response has correct structure
    if (response.data.results && response.data.results[0].toolCallId) {
      console.log("\n‚úÖ Response has toolCallId:", response.data.results[0].toolCallId);
    } else {
      console.log("\n‚ùå Response missing toolCallId!");
    }
    
  } catch (error) {
    console.error("‚ùå Error:", error.response?.data || error.message);
  }
}

testToolCallsFormat();
