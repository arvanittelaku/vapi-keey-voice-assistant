const axios = require("axios");
require("dotenv").config();

/**
 * CHECK RENDER ENVIRONMENT VARIABLES
 * Makes a request to a test endpoint to see what env vars Render has
 */

const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";

async function checkRenderEnv() {
  console.log("\n" + "═".repeat(60));
  console.log("🔍 CHECKING RENDER ENVIRONMENT VARIABLES");
  console.log("═".repeat(60));
  console.log("\nServer: " + SERVER_URL);
  console.log("\n⚠️  Note: This will show you what env vars Render is using");
  console.log("(not your local .env file)\n");

  try {
    // Create a test endpoint request to trigger the webhook and check logs
    const testPayload = {
      phone: "+12136064730",
      firstName: "Test",
      lastName: "Receiver",
      email: "test@example.com",
      contactId: "ZtrIOxo50WVcsLbWK961",
      callType: "lead_qualification",
      _test: true
    };

    console.log("📤 Sending test request to Render...\n");

    const response = await axios.post(
      `${SERVER_URL}/webhook/ghl-trigger-call`,
      testPayload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
        validateStatus: () => true // Accept any status code
      }
    );

    console.log("📊 Response Status:", response.status);
    console.log("📦 Response Data:", JSON.stringify(response.data, null, 2));

    if (response.status === 500 && response.data.details) {
      console.log("\n❌ ERROR FROM VAPI:");
      console.log(JSON.stringify(response.data.details, null, 2));
      
      if (response.data.details.message?.includes("does not exist")) {
        console.log("\n💡 DIAGNOSIS:");
        console.log("   The phone number ID or assistant ID on Render is WRONG!");
        console.log("\n🔧 FIX:");
        console.log("   1. Go to Render dashboard → Environment tab");
        console.log("   2. Update VAPI_PHONE_NUMBER_ID to: 03251648-7837-4e7f-a981-b2dfe4f88881");
        console.log("   3. Click 'Manual Deploy' → 'Deploy latest commit'");
        console.log("   4. Wait for deployment (2-3 minutes)");
        console.log("   5. Run this script again to verify");
      }
    } else if (response.status === 200) {
      console.log("\n✅ Server is configured correctly!");
      console.log("   Call should have been initiated (check Render logs)");
    }

  } catch (error) {
    console.error("\n❌ Error checking Render env:", error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log("\n⚠️  Request timed out");
      console.log("   Render might be sleeping - try again in 30 seconds");
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("📋 NEXT STEPS:");
  console.log("   1. Check Render logs in dashboard");
  console.log("   2. Look for the DEBUG lines showing Phone Number ID");
  console.log("   3. Verify it matches: 03251648-7837-4e7f-a981-b2dfe4f88881");
  console.log("   4. If not, update environment variables and redeploy");
  console.log("═".repeat(60));
}

checkRenderEnv();

