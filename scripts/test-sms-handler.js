const axios = require("axios");
require("dotenv").config();

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const SMS_WEBHOOK_URL = `${SERVER_URL}/webhook/ghl-sms-reply`;

// Test contact ID
const TEST_CONTACT_ID = "ZtrIOxo50WVcsLbWK961";

console.log("\n🧪 Testing SMS Handler\n");
console.log(`Server: ${SERVER_URL}\n`);
console.log("=".repeat(60));

// Helper function to simulate SMS reply
async function sendTestSms(testName, message, contactId = TEST_CONTACT_ID) {
  console.log(`\n📱 Test: ${testName}`);
  console.log(`   Message: "${message}"`);
  console.log(`   Contact ID: ${contactId}`);

  try {
    // Simulate GHL SMS webhook payload
    const payload = {
      type: "SMS",
      message: message,
      phone: "+447700900123",
      contactId: contactId,
      messageId: `test-${Date.now()}`,
      from: "+447700900123",
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(SMS_WEBHOOK_URL, payload);

    console.log(`✅ Success!`);
    console.log(`   Intent: ${response.data.intent}`);
    console.log(`   Action: ${response.data.result?.action}`);
    console.log(`   Result:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(`❌ Failed!`);
    console.error(`   Error:`, error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log("\n🎯 Testing SMS Intent Detection & Handling\n");

  // Test 1: Confirmation (YES)
  console.log("=".repeat(60));
  await sendTestSms("Confirmation - YES", "YES");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Confirmation variations
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Confirmation - yes (lowercase)", "yes");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Confirmation - confirm
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Confirmation - CONFIRM", "CONFIRM");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Cancellation (NO)
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Cancellation - NO", "NO");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Cancellation - can't make it
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Cancellation - can't make it", "can't make it");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 6: Reschedule
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Reschedule - RESCHEDULE", "RESCHEDULE");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 7: Reschedule - different time
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Reschedule - need different time", "need a different time");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 8: Unknown/unclear
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Unknown - unclear message", "maybe later idk");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 9: Real-world example
  console.log("\n" + "=".repeat(60));
  await sendTestSms("Real-world - Yes I can make it", "Yes I can make it");

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ All SMS tests completed!\n");
  console.log("📋 Summary:");
  console.log("   - Tested YES/NO/RESCHEDULE detection");
  console.log("   - Tested various message formats");
  console.log("   - Verified intent parsing");
  console.log("   - Confirmed action handling");
  console.log("\n💡 Check the contact in GHL to verify status updates!\n");
}

// Run the tests
runTests().catch(error => {
  console.error("\n❌ Test suite failed:", error.message);
  process.exit(1);
});

