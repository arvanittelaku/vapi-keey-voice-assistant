const axios = require("axios");
require("dotenv").config();

const SERVER_URL = process.env.RENDER_URL || "http://localhost:3000";
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/vapi`;

// Test data
const TEST_CONTACT_ID = "ZtrIOxo50WVcsLbWK961";
const TEST_CALENDAR_ID = "fxuTx3pBbcUUBW2zMhSN";

console.log("\n🧪 Testing All Confirmation Assistant Tools\n");
console.log(`Server: ${SERVER_URL}\n`);

// Helper function to call a tool
async function callTool(toolName, parameters, testId) {
  console.log(`\n📞 Testing: ${toolName}`);
  console.log(`   Test ID: ${testId}`);
  console.log(`   Parameters:`, JSON.stringify(parameters, null, 2));

  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, {
      message: {
        type: "function-call",
        toolCallId: testId,
        functionCall: {
          name: toolName,
          parameters: parameters
        }
      },
      call: {
        id: `test-${toolName}-${Date.now()}`
      }
    });

    console.log(`✅ Success!`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`❌ Failed!`);
    console.error(`   Error:`, error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log("=".repeat(60));
  
  // Test 1: Update Confirmation Status (Confirmed)
  await callTool(
    "update_appointment_confirmation",
    {
      contactId: TEST_CONTACT_ID,
      appointmentId: "test_appt_123",
      status: "confirmed",
      notes: "Test confirmation"
    },
    "test-confirm-001"
  );

  console.log("\n" + "=".repeat(60));

  // Test 2: Check Calendar Availability
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(23, 59, 59, 999);

  await callTool(
    "check_calendar_availability_keey",
    {
      calendarId: TEST_CALENDAR_ID,
      startDate: tomorrow.toISOString(),
      endDate: dayAfter.toISOString(),
      timezone: "Europe/London"
    },
    "test-availability-001"
  );

  console.log("\n" + "=".repeat(60));

  // Test 3: Book Calendar Appointment
  const appointmentTime = new Date(tomorrow);
  appointmentTime.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const bookResult = await callTool(
    "book_calendar_appointment_keey",
    {
      calendarId: TEST_CALENDAR_ID,
      contactId: TEST_CONTACT_ID,
      startTime: appointmentTime.toISOString(),
      timezone: "Europe/London",
      appointmentTitle: "Test Appointment - Will be Cancelled"
    },
    "test-book-001"
  );

  console.log("\n" + "=".repeat(60));

  // Test 4: Cancel Appointment (if we created one)
  if (bookResult?.results?.[0]?.data?.appointmentId) {
    const newAppointmentId = bookResult.results[0].data.appointmentId;
    console.log(`\n⏳ Waiting 2 seconds before cancelling...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await callTool(
      "cancel_appointment",
      {
        appointmentId: newAppointmentId,
        contactId: TEST_CONTACT_ID,
        reason: "Test cancellation - cleaning up test data"
      },
      "test-cancel-001"
    );
  } else {
    console.log(`\n⚠️  Skipping cancellation test - no appointment was created`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ All tests completed!\n");
}

// Run the tests
runTests().catch(error => {
  console.error("\n❌ Test suite failed:", error.message);
  process.exit(1);
});

