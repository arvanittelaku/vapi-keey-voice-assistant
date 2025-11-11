const axios = require("axios");
require("dotenv").config();

/**
 * TRIGGER TEST CALL TO REAL PHONE NUMBER
 * One-time test to verify the squad works before using GHL numbers
 */

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/ghl-trigger-call`;

// REPLACE THIS WITH YOUR ACTUAL PHONE NUMBER FOR ONE TEST
const YOUR_REAL_PHONE = "+44XXXXXXXXXX"; // UK format: +44XXXXXXXXXX

async function triggerRealPhoneTest() {
  console.log("\n" + "═".repeat(60));
  console.log("⚠️  ONE-TIME REAL PHONE TEST");
  console.log("═".repeat(60));
  console.log("\n🔔 IMPORTANT:");
  console.log("   This will call YOUR ACTUAL PHONE NUMBER");
  console.log("   Use this ONLY to verify the squad works");
  console.log("   Then switch back to GHL numbers for testing\n");
  
  if (YOUR_REAL_PHONE === "+44XXXXXXXXXX") {
    console.log("❌ ERROR: Please update YOUR_REAL_PHONE in the script first!");
    console.log("\n📝 Edit scripts/trigger-real-phone-test.js:");
    console.log("   Change: const YOUR_REAL_PHONE = \"+44XXXXXXXXXX\"");
    console.log("   To your actual phone number in E.164 format");
    console.log("\n   Examples:");
    console.log("   UK: +447700900000");
    console.log("   US: +12025551234");
    process.exit(1);
  }

  const testPayload = {
    phone: YOUR_REAL_PHONE,
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    contactId: "test-real-phone-001",
    callType: "lead_qualification"
  };

  console.log(`📱 Calling: ${YOUR_REAL_PHONE}`);
  console.log("\n⏰ Call will be initiated in 5 seconds...");
  console.log("📱 GET READY TO ANSWER YOUR PHONE!\n");

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log("📤 Initiating call...\n");
    
    const response = await axios.post(WEBHOOK_ENDPOINT, testPayload, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000
    });

    console.log("✅ CALL INITIATED!");
    console.log("═".repeat(60));
    console.log("\n📞 Call Details:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("\n📱 Your phone should ring in 5-10 seconds!");
    console.log("\n🎯 WHAT TO TEST:");
    console.log("   1. Answer the call");
    console.log("   2. Listen to AI introduction");
    console.log("   3. Say you're interested in property management");
    console.log("   4. Ask to book a consultation");
    console.log("   5. Listen for AI to check availability");
    console.log("   6. Choose a time slot");
    console.log("   7. Verify appointment is booked in GHL");
    console.log("\n💡 If this works, the issue is with GHL Dialer setup!");
    console.log("═".repeat(60));

  } catch (error) {
    console.error("\n❌ CALL TRIGGER FAILED");
    console.error("═".repeat(60));
    
    if (error.response) {
      console.error(`\nHTTP Error: ${error.response.status}`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`\nError: ${error.message}`);
    }
  }
}

triggerRealPhoneTest();

