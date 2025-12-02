const axios = require("axios")
require("dotenv").config()

async function testGHLSlots() {
  const apiKey = process.env.GHL_API_KEY
  const calendarId = process.env.GHL_CALENDAR_ID
  
  // Test for tomorrow at 2 PM
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)
  
  const startTime = tomorrow.getTime()
  const endTime = startTime + (3600 * 1000) // 1 hour later
  
  console.log("🧪 Testing GHL Calendar Slots...")
  console.log("Calendar ID:", calendarId)
  console.log("Start Time:", new Date(startTime).toISOString())
  console.log("End Time:", new Date(endTime).toISOString())
  
  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        params: {
          startDate: startTime,
          endDate: endTime,
          timezone: "Europe/London"
        }
      }
    )
    
    console.log("\n✅ SUCCESS!")
    console.log("Response:", JSON.stringify(response.data, null, 2))
    console.log("\n📊 Slots found:", response.data.slots?.length || 0)
    
    if (response.data.slots && response.data.slots.length > 0) {
      console.log("\n📅 Available slots:")
      response.data.slots.forEach((slot, i) => {
        console.log(`   ${i + 1}. ${new Date(slot).toISOString()}`)
      })
    } else {
      console.log("\n⚠️  No slots returned!")
      console.log("This could mean:")
      console.log("   1. Calendar has no working hours configured")
      console.log("   2. Calendar is not published/active")
      console.log("   3. The time range doesn't match calendar availability")
    }
  } catch (error) {
    console.log("\n❌ FAILED!")
    console.log("Status:", error.response?.status)
    console.log("Error:", JSON.stringify(error.response?.data, null, 2))
  }
}

testGHLSlots()

