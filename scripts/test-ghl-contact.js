const axios = require("axios")
require("dotenv").config()

async function testGHLContactCreation() {
  const apiKey = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID
  
  console.log("🧪 Testing GHL Contact Creation...")
  console.log("API Key:", apiKey ? `${apiKey.substring(0, 15)}...` : "NOT SET")
  console.log("Location ID:", locationId || "NOT SET")
  
  const payload = {
    "firstName": "TestUser",
    "lastName": "FromScript",
    "email": "test.script@example.com",
    "phone": "+447123456789",
    "address1": "123 Test Street",
    "city": "London",
    "postalCode": "SW1A 1AA",
    "locationId": locationId
  }
  
  console.log("\n📤 Payload:", JSON.stringify(payload, null, 2))
  
  try {
    const response = await axios.post(
      "https://services.leadconnectorhq.com/contacts/",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        }
      }
    )
    
    console.log("\n✅ SUCCESS!")
    console.log("Response:", JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.log("\n❌ FAILED!")
    console.log("Status:", error.response?.status)
    console.log("Status Text:", error.response?.statusText)
    console.log("Error Message:", JSON.stringify(error.response?.data, null, 2))
  }
}

testGHLContactCreation()

