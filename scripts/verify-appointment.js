const axios = require("axios")
require("dotenv").config()

async function verifyAppointment() {
  const apiKey = process.env.GHL_API_KEY
  const appointmentId = "9UT8cu5Xu6NbWAeHqsxL" // From the successful booking
  
  console.log("🔍 Verifying appointment...")
  console.log("Appointment ID:", appointmentId)
  
  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Version": "2021-07-28"
        }
      }
    )
    
    console.log("\n✅ APPOINTMENT EXISTS!")
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.log("\n❌ APPOINTMENT NOT FOUND!")
    console.log("Status:", error.response?.status)
    console.log("Error:", JSON.stringify(error.response?.data, null, 2))
  }
}

verifyAppointment()

