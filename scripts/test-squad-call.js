require("dotenv").config()
const axios = require("axios")

async function testSquadCall() {
  const apiKey = process.env.VAPI_API_KEY
  const squadId = process.env.VAPI_SQUAD_ID
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
  const testNumber = "+12136721526"

  console.log("\n🧪 Testing Squad Call Formats")
  console.log("==================================================\n")

  const baseURL = "https://api.vapi.ai"
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  // Test 1: Using squadId
  console.log("📞 Test 1: Using 'squadId' parameter")
  try {
    const response = await axios.post(
      `${baseURL}/call`,
      {
        phoneNumberId: phoneNumberId,
        squadId: squadId,
        customer: {
          number: testNumber,
          name: "Test User"
        }
      },
      { headers }
    )
    console.log("✅ SUCCESS with squadId!")
    console.log("   Call ID:", response.data.id)
    console.log("   Status:", response.data.status)
    return
  } catch (error) {
    console.log("❌ FAILED with squadId")
    console.log("   Error:", error.response?.data?.message || error.message)
  }

  // Test 2: Using assistant with mainAssistantId
  console.log("\n📞 Test 2: Using main assistant ID")
  const mainAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
  try {
    const response = await axios.post(
      `${baseURL}/call`,
      {
        phoneNumberId: phoneNumberId,
        assistantId: mainAssistantId,
        customer: {
          number: testNumber,
          name: "Test User"
        }
      },
      { headers }
    )
    console.log("✅ SUCCESS with main assistant ID!")
    console.log("   Call ID:", response.data.id)
    console.log("   Status:", response.data.status)
    console.log("\n💡 NOTE: Using main assistant directly bypasses squad routing.")
    console.log("   Transfers won't work unless manually configured.")
    return
  } catch (error) {
    console.log("❌ FAILED with main assistant ID")
    console.log("   Error:", error.response?.data?.message || error.message)
  }

  console.log("\n==================================================")
  console.log("❌ All tests failed. Please check Vapi dashboard configuration.")
}

testSquadCall()
  .then(() => {
    console.log("\n✅ Test complete\n")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Test error:", error.message)
    process.exit(1)
  })

