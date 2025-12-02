const axios = require('axios');
require('dotenv').config();

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/vapi`;

async function testBookingTool() {
  console.log('🧪 TESTING BOOKING TOOL\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // This simulates the exact payload Vapi sends for booking
  const payload = {
    "message": {
      "toolCalls": [
        {
          "id": "call_test_booking_12345",
          "type": "function",
          "function": {
            "name": "book_calendar_appointment_keey",
            "arguments": JSON.stringify({
              "contactId": "ZtrIOxo50WVcsLbWK961",
              "fullName": "Test Receiver",
              "email": "john.doe@example.com",
              "phone": "+12136064730",
              "bookingDate": "today",
              "bookingTime": "2 PM",
              "timezone": "Europe/London"
            })
          }
        }
      ],
      "role": "tool_calls",
      "message": "",
      "time": Date.now(),
      "secondsFromStart": 45.5
    },
    "call": {
      "id": "test-booking-call-001"
    }
  };

  console.log('📦 Payload being sent:\n', JSON.stringify(payload, null, 2));
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🚀 Sending to server...\n');

  try {
    const start = Date.now();
    const response = await axios.post(WEBHOOK_ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000
    });
    const end = Date.now();
    
    console.log(`✅ SUCCESS! Response received in ${end - start}ms\n`);
    console.log('📨 Response:\n', JSON.stringify(response.data, null, 2));
    
    // Check if booking was successful
    if (response.data.results?.[0]?.success) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎉 BOOKING TOOL TEST PASSED!\n');
      console.log('✅ Appointment created successfully');
      console.log(`✅ Response time: ${end - start}ms`);
      
      const appointmentData = response.data.results[0].data;
      if (appointmentData) {
        console.log(`✅ Appointment ID: ${appointmentData.appointmentId}`);
        console.log(`✅ Date: ${appointmentData.dateFormatted}`);
        console.log(`✅ Time: ${appointmentData.timeFormatted}`);
      }
      
      console.log('\n📊 PERFORMANCE:');
      if (end - start < 2000) {
        console.log('   ✅ EXCELLENT - Under 2 seconds');
      } else if (end - start < 4000) {
        console.log('   ⚠️  ACCEPTABLE - But could be faster');
      } else {
        console.log('   ❌ TOO SLOW - May cause Vapi timeouts');
      }
    } else {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('❌ BOOKING FAILED\n');
      console.log('Error:', response.data.results?.[0]?.message || 'Unknown error');
    }
    
  } catch (error) {
    const end = Date.now();
    console.error(`❌ Error after ${end - start}ms: ${error.message}`);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('   🚨 Request failed!\n');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📝 NOTE:\n');
  console.log('This test creates a REAL appointment in GHL.');
  console.log('Check your GHL calendar to verify it was created.');
  console.log('You may want to delete it after testing.');
  console.log('═══════════════════════════════════════════════════════════');
}

testBookingTool();

