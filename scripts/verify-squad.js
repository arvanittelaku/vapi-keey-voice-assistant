require("dotenv").config()
const VapiClient = require("../src/services/vapi-client")

async function verifySquad() {
  const client = new VapiClient()
  const squadId = process.env.VAPI_SQUAD_ID

  console.log("\n🔍 Verifying Squad Configuration")
  console.log("==================================================\n")
  console.log(`Squad ID from .env: ${squadId}\n`)

  try {
    console.log("📡 Fetching squad from Vapi API...")
    const squad = await client.getSquad(squadId)
    
    console.log("✅ Squad found successfully!")
    console.log("\n📋 Squad Details:")
    console.log(`   Name: ${squad.name}`)
    console.log(`   ID: ${squad.id}`)
    console.log(`   Members: ${squad.members?.length || 0}`)
    
    if (squad.members && squad.members.length > 0) {
      console.log("\n👥 Squad Members:")
      squad.members.forEach((member, index) => {
        console.log(`   ${index + 1}. Assistant ID: ${member.assistantId}`)
      })
    }
    
    return squad
  } catch (error) {
    console.error("❌ Squad not found or error occurred:")
    console.error(error.response?.data || error.message)
    
    console.log("\n💡 SOLUTION:")
    console.log("   The squad doesn't exist. You need to recreate it.")
    console.log("   Run: npm run deploy-squad")
    console.log("   OR")
    console.log("   Run: npm run create-squad (if assistants already exist)")
    
    return null
  }
}

verifySquad()
  .then(() => {
    console.log("\n==================================================")
    console.log("✅ Verification complete\n")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error.message)
    process.exit(1)
  })

