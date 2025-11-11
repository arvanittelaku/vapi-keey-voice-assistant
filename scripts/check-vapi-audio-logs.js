const axios = require("axios");
require("dotenv").config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function getCallAudioLogs(callId) {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_API_KEY not found in environment");
    process.exit(1);
  }

  console.log("\n🔍 CHECKING VAPI CALL AUDIO LOGS");
  console.log("="".repeat(60));

  try {
    // Get call details
    const response = await axios.get(
      `https://api.vapi.ai/call/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    const call = response.data;

    console.log(`\n📞 Call ID: ${call.id}`);
    console.log(`📊 Status: ${call.status}`);
    console.log(`⏱️  Duration: ${call.cost} credits`);
    console.log(`🔚 End Reason: ${call.endedReason || 'N/A'}`);

    // Check for audio issues in transcript
    console.log(`\n📝 TRANSCRIPT ANALYSIS:`);
    if (call.transcript && call.transcript.length > 0) {
      console.log(`   Total messages: ${call.transcript.length}`);
      
      const userMessages = call.transcript.filter(m => m.role === 'user');
      const botMessages = call.transcript.filter(m => m.role === 'assistant' || m.role === 'bot');
      
      console.log(`   User messages: ${userMessages.length}`);
      console.log(`   Bot messages: ${botMessages.length}`);
      
      if (userMessages.length === 0) {
        console.log(`\n⚠️  WARNING: NO USER INPUT DETECTED!`);
        console.log(`   This means Vapi did NOT receive any audio from the user.`);
        console.log(`   Problem: Audio stream from GHL → Twilio → Vapi is broken.`);
      }
    }

    // Check recording URL
    if (call.recordingUrl) {
      console.log(`\n🎙️  Recording: ${call.recordingUrl}`);
      console.log(`   Download this and check if your voice is in it.`);
    }

    // Check for specific audio errors
    if (call.messages) {
      const audioErrors = call.messages.filter(m => 
        m.message && (
          m.message.includes('audio') || 
          m.message.includes('stream') ||
          m.message.includes('media')
        )
      );
      
      if (audioErrors.length > 0) {
        console.log(`\n⚠️  AUDIO-RELATED ERRORS FOUND:`);
        audioErrors.forEach(err => {
          console.log(`   - ${err.message}`);
        });
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`\n💡 DIAGNOSIS:`);
    if (call.transcript && call.transcript.filter(m => m.role === 'user').length === 0) {
      console.log(`   ❌ Vapi received ZERO audio from the caller`);
      console.log(`   ❌ This confirms GHL web dialer is NOT transmitting your microphone`);
      console.log(`   ✅ Solution: Try GHL desktop app, mobile app, or different browser`);
    } else {
      console.log(`   ✅ Vapi IS receiving audio - issue might be elsewhere`);
    }

  } catch (error) {
    console.error("\n❌ Error fetching call logs:", error.response?.data || error.message);
    console.log("\n💡 Usage: node scripts/check-vapi-audio-logs.js [CALL_ID]");
    console.log("   Get CALL_ID from Vapi dashboard or previous test call");
  }
}

// Get call ID from command line or use the recent one from logs
const callId = process.argv[2] || "019a72c9-3099-7447-a454-7e6acb791348"; // From the logs you showed earlier

getCallAudioLogs(callId);

