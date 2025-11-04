require("dotenv").config()

console.log("\n🔍 Environment Configuration Check\n")
console.log("=" .repeat(50))

// Check if .env file exists
const fs = require('fs')
const envExists = fs.existsSync('.env')

if (!envExists) {
  console.log("❌ ERROR: .env file not found!")
  console.log("   Run: cp env.example .env")
  console.log("   Then edit .env with your credentials")
  process.exit(1)
}

console.log("✅ .env file exists")

// Check VAPI_API_KEY
console.log("\n📋 Checking required variables:\n")

const vapiKey = process.env.VAPI_API_KEY
if (!vapiKey) {
  console.log("❌ VAPI_API_KEY: NOT SET")
  console.log("   You need to add your Vapi API key to .env")
} else if (vapiKey === "your_vapi_api_key_here") {
  console.log("❌ VAPI_API_KEY: Still using example value")
  console.log("   You need to replace it with your actual API key")
} else if (vapiKey.length < 20) {
  console.log("❌ VAPI_API_KEY: Too short (likely invalid)")
  console.log(`   Current length: ${vapiKey.length} characters`)
} else {
  console.log(`✅ VAPI_API_KEY: Set (${vapiKey.substring(0, 10)}...${vapiKey.substring(vapiKey.length - 4)})`)
  console.log(`   Length: ${vapiKey.length} characters`)
}

// Check other important variables
const webhookUrl = process.env.WEBHOOK_BASE_URL
if (!webhookUrl || webhookUrl === "https://your-domain.com") {
  console.log("⚠️  WEBHOOK_BASE_URL: Not set or using example value")
  console.log("   (Optional for now, but needed for production)")
} else {
  console.log(`✅ WEBHOOK_BASE_URL: ${webhookUrl}`)
}

const ghlKey = process.env.GHL_API_KEY
if (!ghlKey || ghlKey === "your_ghl_api_key_here") {
  console.log("⚠️  GHL_API_KEY: Not set")
  console.log("   (Optional for now, needed for contact creation)")
} else {
  console.log(`✅ GHL_API_KEY: Set (${ghlKey.substring(0, 10)}...)`)
}

console.log("\n" + "=" .repeat(50))
console.log("\n📝 Next Steps:\n")

if (!vapiKey || vapiKey === "your_vapi_api_key_here" || vapiKey.length < 20) {
  console.log("1. Go to https://dashboard.vapi.ai")
  console.log("2. Click your profile → Settings")
  console.log("3. Go to 'API Keys' or 'Developers' section")
  console.log("4. Copy your PRIVATE API KEY (for server use)")
  console.log("5. Open your .env file")
  console.log("6. Replace VAPI_API_KEY value with your actual key")
  console.log("7. Save the file")
  console.log("8. Run: npm run deploy-squad")
} else {
  console.log("✅ VAPI_API_KEY appears to be set correctly!")
  console.log("   If you're still getting 401 errors:")
  console.log("   1. Check if the key is active in Vapi dashboard")
  console.log("   2. Verify your Vapi account has credits")
  console.log("   3. Try regenerating a new API key")
  console.log("   4. Make sure there are no extra spaces in .env")
}

console.log("\n")

