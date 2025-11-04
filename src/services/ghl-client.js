const axios = require("axios")
require("dotenv").config()

class GHLClient {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY
    this.locationId = process.env.GHL_LOCATION_ID
    this.baseURL = "https://services.leadconnectorhq.com"  // NEW API
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  }

  // Create or update contact
  async createContact(contactData) {
    try {
      const payload = {
        ...contactData,
        locationId: this.locationId
      }
      
      console.log("📝 Creating contact in GHL...")
      console.log("   Payload:", JSON.stringify(payload, null, 2))
      
      const response = await axios.post(
        `${this.baseURL}/contacts/`,
        payload,
        { headers: this.headers }
      )
      console.log("✅ Contact created successfully in GHL")
      console.log("   Contact ID:", response.data.contact?.id || response.data.id)
      return response.data
    } catch (error) {
      console.error("❌ Error creating contact in GHL")
      console.error("   Status:", error.response?.status)
      console.error("   Status Text:", error.response?.statusText)
      console.error("   Error Data:", JSON.stringify(error.response?.data, null, 2))
      console.error("   Full Response:", error.response)
      throw error
    }
  }

  // Update contact with call results
  async updateContact(contactId, updateData) {
    try {
      const response = await axios.put(
        `${this.baseURL}/contacts/${contactId}`,
        updateData,
        { headers: this.headers }
      )
      console.log("✅ Contact updated successfully in GHL")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error updating contact in GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get contact details
  async getContact(contactId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/contacts/${contactId}`,
        { headers: this.headers }
      )
      return response.data
    } catch (error) {
      console.error(
        "❌ Error getting contact from GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Search for contact by email or phone
  async searchContact(email = null, phone = null) {
    try {
      const params = { locationId: this.locationId }
      if (email) params.email = email
      if (phone) params.phone = phone

      const response = await axios.get(
        `${this.baseURL}/contacts/`,
        {
          headers: this.headers,
          params
        }
      )
      return response.data
    } catch (error) {
      console.error(
        "❌ Error searching contact in GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Check calendar availability for a specific time slot
  async checkCalendarAvailability(calendarId, startTime, endTime, timezone = "Europe/London") {
    try {
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      // Convert ISO strings to timestamps
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Invalid date format. Start: ${startTime}, End: ${endTime}`)
      }
      
      const startTimestamp = startDate.getTime()
      const endTimestamp = endDate.getTime()

      console.log(`📅 Checking calendar availability:`)
      console.log(`   Calendar ID: ${calendarId}`)
      console.log(`   Start: ${startDate.toISOString()}`)
      console.log(`   End: ${endDate.toISOString()}`)
      console.log(`   Timezone: ${timezone}`)
      
      const response = await axios.get(
        `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`,
        {
          headers,
          params: {
            startDate: startTimestamp,
            endDate: endTimestamp,
            timezone: timezone
          }
        }
      )

      console.log("✅ Calendar availability check successful")
      
      // GHL API returns slots grouped by date: { "2025-11-05": { "slots": [...] } }
      // Extract all slots from all dates
      const allSlots = []
      for (const dateKey in response.data) {
        if (response.data[dateKey]?.slots) {
          allSlots.push(...response.data[dateKey].slots)
        }
      }
      
      console.log(`📊 Found ${allSlots.length} free slots`)
      if (allSlots.length > 0) {
        console.log(`   First slot: ${allSlots[0]}`)
      }
      
      // Return normalized structure
      return {
        slots: allSlots,
        rawData: response.data
      }
    } catch (error) {
      console.error(
        "❌ Error checking calendar availability:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Create calendar appointment
  async createCalendarAppointment(calendarId, contactId, startTime, timezone = "Europe/London", appointmentTitle = "Property Consultation") {
    try {
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      const startTimeMs = typeof startTime === 'string' ? new Date(startTime).getTime() : startTime
      const startTimeISO = new Date(startTimeMs).toISOString()
      
      console.log(`📅 Creating appointment:`)
      console.log(`   Calendar ID: ${calendarId}`)
      console.log(`   Contact ID: ${contactId}`)
      console.log(`   Start Time: ${startTimeISO}`)
      console.log(`   Timezone: ${timezone}`)
      console.log(`   Title: ${appointmentTitle}`)

      const appointmentData = {
        calendarId: calendarId,
        locationId: this.locationId,
        contactId: contactId,
        startTime: startTimeISO,
        timezone: timezone,
        title: appointmentTitle,
        appointmentStatus: "confirmed"
      }

      const response = await axios.post(
        `https://services.leadconnectorhq.com/calendars/events/appointments`,
        appointmentData,
        { headers }
      )
      
      console.log("✅ Calendar appointment created successfully!")
      console.log("📅 Appointment ID:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error creating calendar appointment:",
        error.response?.data || error.message
      )
      
      if (error.response?.status === 401) {
        console.error(`
🔐 AUTHENTICATION ERROR:
   The GHL API returned "Invalid JWT" (401 Unauthorized).
   
   TO FIX:
   1. Go to GoHighLevel → Settings → Integrations → API
   2. Generate a NEW Location API Key
   3. Make sure it has "Calendar" write permissions
   4. Update GHL_API_KEY in your .env file
   5. Restart your server
        `)
      }
      
      throw error
    }
  }

  // Trigger workflow
  async triggerWorkflow(workflowId, contactId, customData = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/workflows/${workflowId}/contacts/${contactId}`,
        { customData },
        { headers: this.headers }
      )
      console.log("✅ Workflow triggered successfully")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error triggering workflow:",
        error.response?.data || error.message
      )
      throw error
    }
  }
}

module.exports = GHLClient

