const axios = require("axios");
require("dotenv").config();

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/vapi`;

const TEST_CONTACT_ID = "ZtrIOxo50WVcsLbWK961";
const TEST_APPOINTMENT_ID = "test_appt_workflow_001";

async function testWorkflowTrigger(testName, status, notes = "") {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 TEST: ${testName}`);
  console.log(`${"=".repeat(60)}\n`);

  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        name: "update_appointment_confirmation",
        parameters: {
          contactId: TEST_CONTACT_ID,
          appointmentId: TEST_APPOINTMENT_ID,
          status: status,
          notes: notes
        }
      },
      call: {
        id: `test-call-workflow-${Date.now()}`
      },
      toolCallId: `test-workflow-${status}-${Date.now()}`
    }
  };

  console.log("📤 Sending request...");
  console.log(`   Status: ${status}`);
  console.log(`   Contact ID: ${TEST_CONTACT_ID}`);
  console.log(`   Expected Workflow: GHL_WORKFLOW_${status.toUpperCase()}`);

  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000
    });

    console.log("\n✅ Response received:");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.results && response.data.results[0]) {
      const result = response.data.results[0];
      if (result.result.success) {
        console.log("\n🎉 SUCCESS! Confirmation status updated.");
        console.log("\n📋 Check your GHL location now:");
        console.log("   1. Check the contact's 'Confirmation' custom field");
        console.log("   2. Check if the workflow was triggered (SMS should be sent)");
        console.log("   3. Check appointment status (if applicable)");
      } else {
        console.log("\n⚠️  Tool call succeeded but returned an error");
      }
    }

    return response.data;
  } catch (error) {
    console.error("\n❌ TEST FAILED");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.code === "ECONNREFUSED") {
      console.error("   Server not reachable - is it running?");
      console.error(`   URL: ${SERVER_URL}`);
    } else {
      console.error("   Error:", error.message);
    }
    return null;
  }
}

async function runWorkflowTests() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("🚀 WORKFLOW TRIGGER TEST SUITE");
  console.log(`${"=".repeat(60)}`);
  console.log(`\nServer: ${SERVER_URL}`);
  console.log(`Contact ID: ${TEST_CONTACT_ID}`);
  console.log(`\nℹ️  This will test all 4 workflow triggers:`);
  console.log(`   1. Confirmed → Send confirmation SMS`);
  console.log(`   2. Cancelled → Send cancellation SMS`);
  console.log(`   3. Reschedule → Send reschedule SMS`);
  console.log(`   4. No Answer → Send SMS fallback`);
  console.log(`\n⚠️  IMPORTANT: Check your phone/GHL inbox after each test!`);
  console.log(`${"=".repeat(60)}\n`);

  // Test 1: Confirmed
  await testWorkflowTrigger(
    "Workflow Trigger - CONFIRMED",
    "confirmed",
    "Test confirmation from automated script"
  );

  console.log("\n\n⏳ Waiting 3 seconds before next test...\n");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: Cancelled
  await testWorkflowTrigger(
    "Workflow Trigger - CANCELLED",
    "cancelled",
    "Test cancellation from automated script"
  );

  console.log("\n\n⏳ Waiting 3 seconds before next test...\n");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Reschedule
  await testWorkflowTrigger(
    "Workflow Trigger - RESCHEDULE",
    "reschedule",
    "Test reschedule request from automated script"
  );

  console.log("\n\n⏳ Waiting 3 seconds before next test...\n");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 4: No Answer
  await testWorkflowTrigger(
    "Workflow Trigger - NO_ANSWER",
    "no_answer",
    "Test no answer scenario from automated script"
  );

  console.log(`\n\n${"=".repeat(60)}`);
  console.log("✅ ALL WORKFLOW TESTS COMPLETED!");
  console.log(`${"=".repeat(60)}\n`);
  console.log("📱 VERIFICATION STEPS:");
  console.log("   1. Check the test contact in GHL");
  console.log("   2. Verify 'Confirmation' custom field was updated");
  console.log("   3. Check if you received 4 SMS messages (or check GHL conversation)");
  console.log("   4. Check GHL workflow execution logs");
  console.log(`\n🔗 Contact URL: https://app.gohighlevel.com/v2/location/SMEvb6HVyyzvx0EekevW/contacts/detail/${TEST_CONTACT_ID}`);
  console.log(`\n💡 If SMS messages aren't appearing, check:`);
  console.log(`   - GHL workflow is published and active`);
  console.log(`   - Contact has a valid phone number`);
  console.log(`   - GHL SMS sending is configured`);
  console.log(`   - Check GHL workflow execution logs for errors\n`);
}

runWorkflowTests();

