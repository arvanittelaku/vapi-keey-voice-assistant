const axios = require('axios');
require('dotenv').config();

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/vapi`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullBookingFlow() {
  console.log('🎯 TESTING FULL BOOKING FLOW (Availability → Booking)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  let totalTime = 0;

  // ============================================
  // STEP 1: Check Availability
  // ============================================
  console.log('📅 STEP 1: Checking calendar availability...\n');

  const availabilityPayload = {
    "message": {
      "toolCalls": [
        {
          "id": "call_check_availability_001",
          "type": "function",
          "function": {
            "name": "check_calendar_availability_keey",
            "arguments": JSON.stringify({
              "requestedDate": "today",
              "requestedTime": "2 PM",
              "timezone": "Europe/London"
            })
          }
        }
      ],
      "role": "tool_calls",
      "message": "",
      "time": Date.now(),
      "secondsFromStart": 15.2
    },
    "call": {
      "id": "test-full-flow-call-001"
    }
  };

  try {
    const start1 = Date.now();
    const availabilityResponse = await axios.post(WEBHOOK_ENDPOINT, availabilityPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000
    });
    const end1 = Date.now();
    const time1 = end1 - start1;
    totalTime += time1;

    console.log(`✅ Availability check completed in ${time1}ms\n`);

    const availabilityResult = availabilityResponse.data.results?.[0];
    if (availabilityResult?.success) {
      console.log('✅ Found available slots:');
      console.log(`   ${availabilityResult.message}\n`);
      
      const slots = availabilityResult.data?.availableSlots || [];
      if (slots.length > 0) {
        console.log(`📊 Total slots found: ${slots.length}`);
        console.log(`   First 3 slots: ${slots.slice(0, 3).join(', ')}\n`);
      }
    } else {
      console.log('❌ Availability check failed');
      console.log(`   Error: ${availabilityResult?.message}\n`);
      return;
    }

    // Wait 2 seconds to simulate user thinking/speaking
    console.log('⏳ Waiting 2 seconds (simulating user response)...\n');
    await sleep(2000);

    // ============================================
    // STEP 2: Book Appointment
    // ============================================
    console.log('📅 STEP 2: Booking appointment...\n');

    const bookingPayload = {
      "message": {
        "toolCalls": [
          {
            "id": "call_book_appointment_001",
            "type": "function",
            "function": {
              "name": "book_calendar_appointment_keey",
              "arguments": JSON.stringify({
                "contactId": "ZtrIOxo50WVcsLbWK961",
                "fullName": "Test Receiver",
                "email": "john.doe@example.com",
                "phone": "+12136064730",
                "bookingDate": "today",
                "bookingTime": "3 PM",
                "timezone": "Europe/London"
              })
            }
          }
        ],
        "role": "tool_calls",
        "message": "",
        "time": Date.now(),
        "secondsFromStart": 35.8
      },
      "call": {
        "id": "test-full-flow-call-001"
      }
    };

    const start2 = Date.now();
    const bookingResponse = await axios.post(WEBHOOK_ENDPOINT, bookingPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000
    });
    const end2 = Date.now();
    const time2 = end2 - start2;
    totalTime += time2;

    console.log(`✅ Booking completed in ${time2}ms\n`);

    const bookingResult = bookingResponse.data.results?.[0];
    if (bookingResult?.success) {
      console.log('✅ Appointment booked successfully!');
      console.log(`   ${bookingResult.message}\n`);
      
      const appointmentData = bookingResult.data;
      if (appointmentData) {
        console.log('📋 Appointment Details:');
        console.log(`   ID: ${appointmentData.appointmentId}`);
        console.log(`   Date: ${appointmentData.dateFormatted}`);
        console.log(`   Time: ${appointmentData.timeFormatted}`);
        console.log(`   Timezone: ${appointmentData.timezone}\n`);
      }
    } else {
      console.log('❌ Booking failed');
      console.log(`   Error: ${bookingResult?.message}\n`);
      return;
    }

    // ============================================
    // FINAL REPORT
    // ============================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 FULL FLOW TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📊 PERFORMANCE SUMMARY:');
    console.log(`   Step 1 (Availability): ${time1}ms`);
    console.log(`   Step 2 (Booking): ${time2}ms`);
    console.log(`   Total API time: ${totalTime}ms`);
    console.log(`   Total flow time: ${totalTime + 2000}ms (including 2s wait)\n`);

    console.log('✅ ASSESSMENT:');
    if (time1 < 2000 && time2 < 2000) {
      console.log('   ✅ EXCELLENT - Both tools respond quickly!');
      console.log('   ✅ Ready for production use');
    } else if (time1 < 4000 && time2 < 4000) {
      console.log('   ⚠️  ACCEPTABLE - Should work but monitor closely');
    } else {
      console.log('   ❌ TOO SLOW - May experience Vapi timeouts');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Check GHL calendar to verify appointment was created');
    console.log('   2. Delete the test appointment (ID shown above)');
    console.log('   3. Make a real Vapi call to test end-to-end');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR DURING FLOW TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n🚨 Flow test failed!');
  }
}

testFullBookingFlow();

