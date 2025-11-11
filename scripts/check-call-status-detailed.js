const axios = require("axios");
require("dotenv").config();

/**
 * CHECK DETAILED CALL STATUS
 * Fetches call details from Vapi to see why it failed
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Use the call ID from your last test
const CALL_ID = "019a72ab-00ef-7447-a44b-67bc5093ace7";

async function checkCallStatus() {
  console.log("\n" + "═".repeat(60));
  console.log("🔍 CHECKING CALL STATUS");
  console.log("═".repeat(60));
  console.log(`\nCall ID: ${CALL_ID}\n`);

  try {
    const response = await axios.get(
      `https://api.vapi.ai/call/${CALL_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const call = response.data;
    
    console.log("📊 CALL DETAILS:");
    console.log("═".repeat(60));
    console.log(`Status: ${call.status}`);
    console.log(`Type: ${call.type}`);
    console.log(`Customer: ${call.customer?.number}`);
    console.log(`Duration: ${call.endedAt ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) : 'N/A'} seconds`);
    console.log(`Created: ${call.createdAt}`);
    console.log(`Started: ${call.startedAt || 'Not started'}`);
    console.log(`Ended: ${call.endedAt || 'Not ended'}`);
    console.log(`End Reason: ${call.endedReason || 'N/A'}`);
    
    if (call.analysis) {
      console.log("\n📋 CALL ANALYSIS:");
      console.log(JSON.stringify(call.analysis, null, 2));
    }

    if (call.messages && call.messages.length > 0) {
      console.log("\n💬 CALL MESSAGES:");
      call.messages.slice(0, 5).forEach((msg, i) => {
        console.log(`\n${i + 1}. ${msg.role}: ${msg.message || msg.content || JSON.stringify(msg)}`);
      });
    }

    if (call.costs) {
      console.log("\n💰 COSTS:");
      console.log(JSON.stringify(call.costs, null, 2));
    }

    console.log("\n" + "═".repeat(60));
    console.log("🔍 DIAGNOSIS:");
    console.log("═".repeat(60));

    if (call.status === "ended" && call.endedReason) {
      console.log(`\n❌ Call ended with reason: ${call.endedReason}`);
      
      if (call.endedReason.includes("no-answer") || call.endedReason.includes("busy")) {
        console.log("\n💡 LIKELY CAUSES:");
        console.log("   1. GHL Dialer was not open/ready");
        console.log("   2. Phone number routing not configured in GHL");
        console.log("   3. Number is forwarding calls elsewhere");
        console.log("\n🔧 SOLUTIONS:");
        console.log("   1. Open GHL Dialer and set status to 'Available'");
        console.log("   2. Check GHL → Settings → Phone Numbers → +12136064730");
        console.log("   3. Verify 'Call Forwarding' is set to 'Ring in Dialer'");
        console.log("   4. Try calling the number manually in GHL to test routing");
      } else if (call.endedReason.includes("assistant-error")) {
        console.log("\n💡 ASSISTANT ERROR:");
        console.log("   There was an issue with the AI assistant configuration");
        console.log("   Check the squad members and their tools");
      } else if (call.endedReason.includes("pipeline-error")) {
        console.log("\n💡 PIPELINE ERROR:");
        console.log("   Issue with voice pipeline (transcription/TTS)");
        console.log("   This is usually a temporary Vapi issue");
      }
    } else if (call.status === "queued") {
      console.log("\n⏳ Call is still queued (waiting to be processed)");
      console.log("   This usually means the call attempt failed");
    } else if (call.status === "ringing") {
      console.log("\n📞 Call is ringing but not answered yet");
    }

    console.log("\n" + "═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error fetching call status:", error.response?.data?.message || error.message);
    
    if (error.response?.status === 404) {
      console.error("\n💡 Call not found. This could mean:");
      console.error("   - Call ID is incorrect");
      console.error("   - Call was made from a different Vapi account");
    }
  }
}

checkCallStatus();

