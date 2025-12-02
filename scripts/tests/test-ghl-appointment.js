const axios = require("axios")
require("dotenv").config()

async function testGHLAppointmentCreation() {
  const apiKey = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID
  const calendarId = process.env.GHL_CALENDAR_ID
  const contactId = "teRvT86xUyZ316UtjmWu" // Your real contact ID
  
  console.log("🧪 Testing GHL Appointment Creation...")
  console.log("API Key:", apiKey ? `${apiKey.substring(0, 15)}...` : "NOT SET")
  console.log("Location ID:", locationId || "NOT SET")
  console.log("Calendar ID:", calendarId || "NOT SET")
  console.log("Contact ID:", contactId)
  
  const appointmentData = {
    "calendarId": calendarId,
    "locationId": locationId,
    "contactId": contactId,
    "startTime": "2025-11-12T10:00:00.000Z",
    "timezone": "Europe/London",
    "title": "Test Appointment",
    "appointmentStatus": "confirmed"
  }
  
  console.log("\n📤 Payload:", JSON.stringify(appointmentData, null, 2))
  
  try {
    const response = await axios.post(
      "https://services.leadconnectorhq.com/calendars/events/appointments",
      appointmentData,
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

testGHLAppointmentCreation()

