const axios = require("axios");
require("dotenv").config();

/**
 * TRIGGER LEAD QUALIFICATION CALL
 * Simulates a GHL workflow triggering an outbound call to a new lead
 * The squad will call, qualify the lead, and book a consultation if interested
 */

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const WEBHOOK_ENDPOINT = `${SERVER_URL}/webhook/ghl-trigger-call`;

// Test data - UPDATE THESE VALUES FOR YOUR TEST
const TEST_CONTACT = {
  // IMPORTANT: Use the Twilio number that you'll answer in GHL Dialer
  phone: "+12136064730", // Receiver number (GHL imported Twilio number)
  
  // Contact details
  firstName: "Test",
  lastName: "Receiver",
  email: "test@example.com",
  
  // GHL Contact ID (if you have one)
  contactId: "ZtrIOxo50WVcsLbWK961",
  
  // Property details (optional but helps AI conversation)
  address1: "123 Test Street",
  city: "London",
  postalCode: "SW1A 1AA",
  bedrooms: "3",
  region: "London",
  
  // Call type - MUST be "lead_qualification" for squad to handle booking
  callType: "lead_qualification"
};

async function triggerLeadQualificationCall() {
  console.log("\n" + "═".repeat(60));
  console.log("🎯 TRIGGERING LEAD QUALIFICATION CALL");
  console.log("═".repeat(60));
  console.log("\n📋 Test Contact Details:");
  console.log(`   Name: ${TEST_CONTACT.firstName} ${TEST_CONTACT.lastName}`);
  console.log(`   Phone: ${TEST_CONTACT.phone}`);
  console.log(`   Email: ${TEST_CONTACT.email}`);
  console.log(`   Contact ID: ${TEST_CONTACT.contactId}`);
  console.log(`   Property: ${TEST_CONTACT.bedrooms} bed in ${TEST_CONTACT.city}`);
  console.log(`   Call Type: ${TEST_CONTACT.callType}`);
  console.log("\n📡 Server: " + SERVER_URL);
  
  console.log("\n⚠️  IMPORTANT PRE-FLIGHT REMINDERS:");
  console.log("   ✓ Have you run 'npm run verify-squad-config'?");
  console.log("   ✓ Is your GHL Dialer open and ready?");
  console.log("   ✓ Receiver number (+12136064730) is NOT attached to Vapi assistant?");
  console.log("   ✓ Squad has booking tools (check_calendar_availability, book_appointment)?");
  
  console.log("\n⏰ Call will be initiated in 5 seconds...");
  console.log("📱 GET READY TO ANSWER IN GHL DIALER!");
  console.log("\n🎬 WHAT TO EXPECT:");
  console.log("   1. Phone rings in GHL Dialer");
  console.log("   2. AI introduces Keey and asks about property");
  console.log("   3. Say you're interested in property management");
  console.log("   4. AI will offer to book a consultation");
  console.log("   5. Say 'yes' and AI will check availability");
  console.log("   6. AI presents time slots - choose one");
  console.log("   7. AI books appointment and confirms");
  console.log("   8. Check GHL calendar to verify booking");
  
  console.log("\n" + "═".repeat(60));
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("\n📤 Sending request to trigger call...\n");

  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, TEST_CONTACT, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000 // 60 seconds - call initiation can take time
    });

    console.log("✅ CALL TRIGGERED SUCCESSFULLY!");
    console.log("═".repeat(60));
    console.log("\n📞 Call Details:");
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log("\n✅ SUCCESS! The phone should be ringing in GHL now!");
    console.log("\n📋 NEXT STEPS:");
    console.log("   1. Answer the call in GHL Dialer");
    console.log("   2. Interact with the AI naturally");
    console.log("   3. Test the booking flow");
    console.log("   4. Verify appointment appears in GHL calendar");
    console.log("   5. Check Render logs for any errors");
    
    console.log("\n🔗 USEFUL LINKS:");
    console.log(`   Contact: https://app.gohighlevel.com/v2/location/SMEvb6HVyyzvx0EekevW/contacts/detail/${TEST_CONTACT.contactId}`);
    console.log(`   Calendar: https://app.gohighlevel.com/v2/location/SMEvb6HVyyzvx0EekevW/calendar/month`);
    console.log(`   Render Logs: https://dashboard.render.com/`);
    
    console.log("\n" + "═".repeat(60));
    
  } catch (error) {
    console.error("\n❌ CALL TRIGGER FAILED");
    console.error("═".repeat(60));
    
    if (error.response) {
      console.error(`\nHTTP Error: ${error.response.status} - ${error.response.statusText}`);
      console.error("\nError Details:");
      console.error(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error("\n💡 TROUBLESHOOTING 400 ERROR:");
        console.error("   - Check if phone number is in correct format");
        console.error("   - Verify all required fields are present");
        console.error("   - Check server logs for validation errors");
      } else if (error.response.status === 500) {
        console.error("\n💡 TROUBLESHOOTING 500 ERROR:");
        console.error("   - Check Render logs for detailed error");
        console.error("   - Verify VAPI_SQUAD_ID is correct");
        console.error("   - Verify VAPI_PHONE_NUMBER_ID is correct");
        console.error("   - Check if Vapi API key is valid");
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error("\n⏱️  Request timed out after 60 seconds");
      console.error("\n💡 TROUBLESHOOTING TIMEOUT:");
      console.error("   - Server might be sleeping (Render free tier)");
      console.error("   - Check if server is deployed and running");
      console.error("   - Try running the health check: curl " + SERVER_URL + "/health");
    } else {
      console.error(`\nError: ${error.message}`);
      console.error("\n💡 TROUBLESHOOTING:");
      console.error("   - Check if server is running");
      console.error("   - Verify RENDER_URL in .env");
      console.error("   - Check your internet connection");
    }
    
    console.error("\n" + "═".repeat(60));
    process.exit(1);
  }
}

// Confirm before running
console.log("\n" + "═".repeat(60));
console.log("⚠️  CREDIT USAGE WARNING");
console.log("═".repeat(60));
console.log("\nThis will initiate a REAL call and consume Vapi credits.");
console.log("Make sure you've run 'npm run verify-squad-config' first!");
console.log("\nStarting in 3 seconds...");
console.log("Press Ctrl+C to cancel");
console.log("═".repeat(60));

setTimeout(() => {
  triggerLeadQualificationCall();
}, 3000);

