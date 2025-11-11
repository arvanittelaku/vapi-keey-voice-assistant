const axios = require("axios");
require("dotenv").config();

/**
 * LIST ALL VAPI PHONE NUMBERS
 * Helps you find the correct phone number ID for outbound calls
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function listPhoneNumbers() {
  console.log("\n" + "═".repeat(60));
  console.log("📱 VAPI PHONE NUMBERS");
  console.log("═".repeat(60));
  
  try {
    console.log("\n🔍 Fetching phone numbers from Vapi...\n");
    
    const response = await axios.get(
      "https://api.vapi.ai/phone-number",
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const phoneNumbers = response.data;
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log("❌ No phone numbers found in your Vapi account");
      console.log("\n💡 You need to import your Twilio numbers to Vapi:");
      console.log("   1. Go to https://vapi.ai/dashboard");
      console.log("   2. Navigate to 'Phone Numbers'");
      console.log("   3. Click 'Import from Twilio'");
      console.log("   4. Select the number: +44 7402 769361\n");
      return;
    }

    console.log(`✅ Found ${phoneNumbers.length} phone number(s):\n`);
    console.log("═".repeat(60));

    phoneNumbers.forEach((phone, index) => {
      console.log(`\n📞 Phone ${index + 1}:`);
      console.log(`   Number: ${phone.number}`);
      console.log(`   Name: ${phone.name || "Unnamed"}`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Provider: ${phone.twilioPhoneNumber ? "Twilio" : phone.vonagePhoneNumber ? "Vonage" : "Unknown"}`);
      
      // Highlight if this is the expected number
      if (phone.number === "+447402769361" || phone.number === "+44 7402 769361") {
        console.log(`   👉 THIS IS YOUR OUTBOUND CALLING NUMBER!`);
        console.log(`   Copy this ID to VAPI_PHONE_NUMBER_ID in .env`);
      }
    });

    console.log("\n" + "═".repeat(60));
    console.log("\n📋 NEXT STEPS:");
    console.log("   1. Copy the ID of +447402769361 (your outbound number)");
    console.log("   2. Update VAPI_PHONE_NUMBER_ID in your .env file");
    console.log("   3. Update the same variable in Render environment variables");
    console.log("   4. Redeploy on Render or wait for auto-deploy");
    console.log("   5. Run 'npm run verify-squad-config' again\n");
    
  } catch (error) {
    console.error("\n❌ Error fetching phone numbers:", error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.error("\n💡 Authentication failed:");
      console.error("   - Check if VAPI_API_KEY is correct in .env");
      console.error("   - Verify your Vapi API key hasn't expired");
    }
  }
}

listPhoneNumbers();

