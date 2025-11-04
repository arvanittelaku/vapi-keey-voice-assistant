require("dotenv").config()
const VapiClient = require("../src/services/vapi-client")

async function checkCallStatus() {
  const client = new VapiClient()
  
  // Get the call IDs from the user's tests
  const callIds = [
    "019a4f81-92c7-7885-88b3-37c5b44c1e1d"  // Test with all tools - Alex
  ]

  console.log("\n🔍 Checking Call Status")
  console.log("==================================================\n")

  for (const callId of callIds) {
    try {
      console.log(`📞 Call ID: ${callId}`)
      const call = await client.getCall(callId)
      
      console.log(`   Status: ${call.status}`)
      console.log(`   Started At: ${call.startedAt || 'Not started'}`)
      console.log(`   Ended At: ${call.endedAt || 'Not ended'}`)
      console.log(`   Duration: ${call.duration || 0} seconds`)
      
      if (call.endedReason) {
        console.log(`   ⚠️  Ended Reason: ${call.endedReason}`)
      }
      
      if (call.messages && call.messages.length > 0) {
        console.log(`   📝 Messages: ${call.messages.length}`)
      }
      
      if (call.transcript) {
        console.log(`   📄 Transcript available`)
      }

      if (call.status === 'failed' || call.endedReason) {
        console.log(`   ❌ Call failed or ended unexpectedly`)
        console.log(`   Full details:`, JSON.stringify(call, null, 2))
      }
      
      console.log()
    } catch (error) {
      console.error(`   ❌ Error fetching call:`, error.response?.data || error.message)
      console.log()
    }
  }

  console.log("==================================================")
  console.log("\n💡 Common reasons for calls not connecting:")
  console.log("   1. Phone number not verified in Twilio (for trial accounts)")
  console.log("   2. Insufficient Vapi credits")
  console.log("   3. Phone provider (Twilio) issue")
  console.log("   4. Number is invalid or cannot receive calls")
  console.log("   5. Call is still processing (check Vapi dashboard)")
  console.log("\n📊 Check your Vapi dashboard for detailed logs:")
  console.log("   https://dashboard.vapi.ai/calls")
}

checkCallStatus()
  .then(() => {
    console.log("\n✅ Check complete\n")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error.message)
    process.exit(1)
  })

