require("dotenv").config()
const VapiClient = require("../src/services/vapi-client")

async function checkPhoneConfig() {
  const client = new VapiClient()
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
  const squadId = process.env.VAPI_SQUAD_ID

  console.log("\n🔍 Checking Phone Number Configuration")
  console.log("==================================================\n")

  if (!phoneNumberId) {
    console.error("❌ VAPI_PHONE_NUMBER_ID not set in .env")
    return
  }

  try {
    console.log(`📞 Phone Number ID: ${phoneNumberId}`)
    console.log(`🤖 Squad ID: ${squadId}\n`)

    // Get phone number details
    const phoneNumbers = await client.getPhoneNumbers()
    const phone = phoneNumbers.find(p => p.id === phoneNumberId)

    if (!phone) {
      console.error("❌ Phone number not found!")
      console.log("\n📋 Available phone numbers:")
      phoneNumbers.forEach(p => {
        console.log(`   - ${p.number} (${p.id})`)
        console.log(`     Assistant: ${p.assistantId || 'None'}`)
        console.log(`     Squad: ${p.squadId || 'None'}`)
      })
      return
    }

    console.log("✅ Phone number found!")
    console.log(`\n📋 Phone Details:`)
    console.log(`   Number: ${phone.number}`)
    console.log(`   Provider: ${phone.provider}`)
    console.log(`   Assistant ID: ${phone.assistantId || 'Not set'}`)
    console.log(`   Squad ID: ${phone.squadId || 'Not set'}`)

    if (!phone.squadId && !phone.assistantId) {
      console.log("\n⚠️  WARNING: Phone number has no assistant or squad configured!")
      console.log("   You need to configure the phone number with the squad.")
    } else if (phone.assistantId && phone.assistantId !== squadId) {
      console.log("\n⚠️  WARNING: Phone has an assistant configured, but not the squad!")
      console.log(`   Current: ${phone.assistantId}`)
      console.log(`   Expected: ${squadId}`)
    } else if (phone.squadId === squadId) {
      console.log("\n✅ Phone is correctly configured with the squad!")
    }

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message)
  }
}

checkPhoneConfig()
  .then(() => {
    console.log("\n==================================================")
    console.log("✅ Check complete\n")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error.message)
    process.exit(1)
  })

