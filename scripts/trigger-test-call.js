const axios = require("axios");
require("dotenv").config();

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/ghl-trigger-call`;

// Test data
const TEST_CONTACT_ID = "ZtrIOxo50WVcsLbWK961";
const TEST_APPOINTMENT_ID = "zZ3RZwMRldJzhFAtiRj5";
const TEST_PHONE = "+12136064730";
const TEST_NAME = "Test Receiver";

async function triggerTestCall() {
  console.log(`\n🎯 TRIGGERING TEST CONFIRMATION CALL`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Contact: ${TEST_NAME}`);
  console.log(`Phone: ${TEST_PHONE}`);
  console.log(`Appointment ID: ${TEST_APPOINTMENT_ID}`);
  console.log(`\n⏰ Call will be initiated in 3 seconds...`);
  console.log(`📱 GET READY TO ANSWER IN GHL DIALER!\n`);

  await new Promise(resolve => setTimeout(resolve, 3000));

  const payload = {
    // Root level fields (as expected by ghl-to-vapi.js)
    id: TEST_CONTACT_ID,
    contactId: TEST_CONTACT_ID,
    name: TEST_NAME,
    firstName: "Test",
    lastName: "Receiver",
    phone: TEST_PHONE,
    email: "test@example.com",
    
    // Appointment details
    appointmentId: TEST_APPOINTMENT_ID,
    calendarId: "fxuTx3pBbcUUBW2zMhSN",
    appointmentTitle: "Test Confirmation Call",
    appointmentTime: "12:30 PM",
    appointment_time: "2025-11-11T12:30:00.000Z",
    
    // Call type
    callType: "appointment_confirmation",
    test: true
  };

  console.log(`📤 Sending request to trigger call...\n`);

  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000 // 60 seconds - call initiation can take time
    });

    console.log(`\n✅ CALL TRIGGERED SUCCESSFULLY!`);
    console.log(`${"=".repeat(60)}\n`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    console.log(`\n📞 The phone should be ringing in GHL now!`);
    console.log(`📱 Answer the call in your GHL dialer!`);
    console.log(`\n🎙️  When you answer, you should hear:`);
    console.log(`   "Hello, this is Keey calling. May I speak with Test Receiver?"`);
    console.log(`\n⏱️  Call will auto-end after 2 minutes (safety timeout)`);
    console.log(`\n🔍 Monitor:`);
    console.log(`   1. Vapi Dashboard: https://dashboard.vapi.ai/calls`);
    console.log(`   2. Render Logs: https://dashboard.render.com`);

    return response.data;
  } catch (error) {
    console.error(`\n❌ CALL TRIGGER FAILED`);
    console.error(`${"=".repeat(60)}\n`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.code === "ECONNREFUSED") {
      console.error(`Server not reachable at: ${SERVER_URL}`);
      console.error(`Make sure Render is running!`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    throw error;
  }
}

triggerTestCall();

