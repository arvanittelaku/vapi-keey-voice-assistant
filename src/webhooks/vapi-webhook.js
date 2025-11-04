const express = require("express")
const GHLClient = require("../services/ghl-client")
const { parsePhoneNumber, isValidPhoneNumber } = require("libphonenumber-js")
const { DateTime } = require("luxon")
require("dotenv").config()

class VapiWebhookHandler {
  constructor() {
    this.app = express()
    this.ghlClient = new GHLClient()
    this.setupMiddleware()
    this.setupRoutes()
  }

  /**
   * Normalize phone number to E.164 format
   * @param {string} phone - Raw phone number
   * @param {string} countryCode - ISO country code (e.g., 'GB', 'AE')
   * @returns {string|null} - E.164 formatted phone number or null if invalid
   */
  normalizePhoneNumber(phone, countryCode = "GB") {
    if (!phone) return null

    try {
      // Try to parse with country code
      if (countryCode) {
        const phoneNumber = parsePhoneNumber(phone, countryCode)
        if (phoneNumber && phoneNumber.isValid()) {
          return phoneNumber.number
        }
      }

      // Try to parse as international number (if it starts with +)
      if (phone.includes("+")) {
        const phoneNumber = parsePhoneNumber(phone)
        if (phoneNumber && phoneNumber.isValid()) {
          return phoneNumber.number
        }
      }

      // Try common countries for Keey (UK and UAE)
      const commonCountries = ["GB", "AE", "US"]
      for (const country of commonCountries) {
        try {
          const phoneNumber = parsePhoneNumber(phone, country)
          if (phoneNumber && phoneNumber.isValid()) {
            console.log(`📞 Detected ${country} phone number`)
            return phoneNumber.number
          }
        } catch (err) {
          continue
        }
      }

      // Last resort: if it's already in a valid format, use it
      if (isValidPhoneNumber(phone)) {
        const phoneNumber = parsePhoneNumber(phone)
        return phoneNumber.number
      }

      console.error(`❌ Could not parse phone number: ${phone}`)
      return null
    } catch (error) {
      console.error(`❌ Error parsing phone number ${phone}:`, error.message)
      return null
    }
  }

  setupMiddleware() {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))

    // Log ALL incoming requests
    this.app.use((req, res, next) => {
      console.log(`📥 INCOMING REQUEST: ${req.method} ${req.url} from ${req.ip}`)
      next()
    })

    // Basic authentication for webhook endpoints
    this.app.use("/webhook", (req, res, next) => {
      console.log(`\n🔍 Webhook request: ${req.method} ${req.path}`)
      
      // Skip authentication for public endpoints
      if (req.path === "/public" || req.path === "/health") {
        return next()
      }

      // Verify webhook secret
      const authHeader = req.headers.authorization
      const expectedAuth = `Bearer ${process.env.WEBHOOK_SECRET}`

      if (process.env.NODE_ENV !== "production") {
        // Skip auth in development
        return next()
      }

      if (authHeader !== expectedAuth) {
        console.log("❌ Unauthorized webhook request")
        return res.status(401).json({ error: "Unauthorized" })
      }

      next()
    })
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ 
        status: "healthy", 
        service: "Keey Voice Assistant",
        timestamp: new Date().toISOString()
      })
    })

    // Main Vapi webhook endpoint
    this.app.post("/webhook/vapi", async (req, res) => {
      try {
        const { message } = req.body

        console.log("\n📞 VAPI WEBHOOK EVENT:", message?.type)

        // Handle different webhook events
        switch (message?.type) {
          case "end-of-call-report":
            await this.handleEndOfCall(message)
            break
          case "function-call":
            return await this.handleFunctionCall(req, res)
          case "status-update":
            console.log("📊 Call status update:", message.status)
            break
          default:
            console.log("ℹ️ Unhandled webhook type:", message?.type)
        }

        res.json({ received: true })
      } catch (error) {
        console.error("❌ Error in webhook handler:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })

    // GHL to Vapi integration endpoint (for triggering outbound calls from GHL)
    this.app.post("/webhook/ghl-to-vapi", async (req, res) => {
      try {
        console.log("\n🔔 GHL WEBHOOK RECEIVED")
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2))

        // Handle GHL workflow triggers for outbound calls
        const contactData = req.body

        // Validate required fields
        if (!contactData.phone) {
          return res.status(400).json({ error: "Phone number is required" })
        }

        // Process and potentially initiate outbound call
        console.log("✅ GHL webhook processed successfully")
        res.json({ received: true, contactId: contactData.id })
      } catch (error) {
        console.error("❌ Error processing GHL webhook:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })

    // 404 handler
    this.app.use((req, res) => {
      console.log("❌ 404 - Route not found:", req.url)
      res.status(404).json({ error: "Not found" })
    })
  }

  /**
   * Handle function calls from Vapi assistant
   */
  async handleFunctionCall(req, res) {
    const { message } = req.body
    const functionCall = message.functionCall

    console.log("\n🔧 FUNCTION CALL:", functionCall.name)
    console.log("📥 Parameters:", JSON.stringify(functionCall.parameters, null, 2))

    try {
      let result

      switch (functionCall.name) {
        case "check_calendar_availability":
          result = await this.checkCalendarAvailability(functionCall.parameters)
          break

        case "create_contact":
          result = await this.createContact(functionCall.parameters)
          break

        case "book_appointment":
          result = await this.bookAppointment(functionCall.parameters)
          break

        case "transfer_to_services":
          result = await this.transferToSubAgent("services")
          break

        case "transfer_to_pricing":
          result = await this.transferToSubAgent("pricing")
          break

        default:
          console.log("❌ Unknown function:", functionCall.name)
          result = { error: "Unknown function" }
      }

      console.log("✅ Function result:", result)
      res.json({ result })
    } catch (error) {
      console.error("❌ Function call error:", error)
      res.json({ 
        error: error.message,
        details: "There was an error processing your request. Please try again."
      })
    }
  }

  /**
   * Check calendar availability
   */
  async checkCalendarAvailability(params) {
    const { date, time, timezone = "Europe/London" } = params

    try {
      // Construct start and end times for the requested slot
      const startTime = new Date(`${date}T${time}`)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 minutes later

      const calendarId = process.env.GHL_CALENDAR_ID
      const availability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        startTime.toISOString(),
        endTime.toISOString(),
        timezone
      )

      const isAvailable = availability.slots && availability.slots.length > 0

      return {
        available: isAvailable,
        message: isAvailable 
          ? `Yes, ${date} at ${time} is available.`
          : `Sorry, ${date} at ${time} is not available. Would you like to try a different time?`
      }
    } catch (error) {
      console.error("❌ Error checking availability:", error)
      return {
        available: false,
        message: "I'm having trouble checking availability right now. Let me transfer you to our booking team."
      }
    }
  }

  /**
   * Create or update contact in GHL
   */
  async createContact(params) {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      propertyAddress, 
      city, 
      postcode, 
      bedrooms,
      region = "London"
    } = params

    try {
      // Normalize phone number
      const countryCode = region === "Dubai" ? "AE" : "GB"
      const normalizedPhone = this.normalizePhoneNumber(phone, countryCode)

      // Search for existing contact
      let contact = await this.ghlClient.searchContact(email, normalizedPhone)

      if (contact && contact.contacts && contact.contacts.length > 0) {
        // Update existing contact
        const existingContact = contact.contacts[0]
        await this.ghlClient.updateContact(existingContact.id, {
          firstName,
          lastName,
          email,
          phone: normalizedPhone,
          address1: propertyAddress,
          city,
          postalCode: postcode,
          customField: {
            bedrooms: bedrooms?.toString(),
            region: region,
            lead_source: "Voice Assistant"
          }
        })

        console.log("✅ Updated existing contact:", existingContact.id)
        return {
          success: true,
          contactId: existingContact.id,
          message: "Your information has been updated."
        }
      } else {
        // Create new contact
        const newContact = await this.ghlClient.createContact({
          firstName,
          lastName,
          email,
          phone: normalizedPhone,
          address1: propertyAddress,
          city,
          postalCode: postcode,
          customField: {
            bedrooms: bedrooms?.toString(),
            region: region,
            lead_source: "Voice Assistant"
          }
        })

        console.log("✅ Created new contact:", newContact.contact.id)
        return {
          success: true,
          contactId: newContact.contact.id,
          message: "Thank you! Your information has been saved."
        }
      }
    } catch (error) {
      console.error("❌ Error creating contact:", error)
      return {
        success: false,
        message: "I'm having trouble saving your information. Our team will follow up with you shortly."
      }
    }
  }

  /**
   * Book appointment in GHL calendar
   */
  async bookAppointment(params) {
    const { 
      contactId, 
      date, 
      time, 
      timezone = "Europe/London",
      appointmentTitle = "Property Management Consultation"
    } = params

    try {
      const startTime = new Date(`${date}T${time}`)
      const calendarId = process.env.GHL_CALENDAR_ID

      const appointment = await this.ghlClient.createCalendarAppointment(
        calendarId,
        contactId,
        startTime.toISOString(),
        timezone,
        appointmentTitle
      )

      return {
        success: true,
        appointmentId: appointment.id,
        message: `Perfect! Your consultation is booked for ${date} at ${time}. You'll receive a confirmation email shortly.`
      }
    } catch (error) {
      console.error("❌ Error booking appointment:", error)
      return {
        success: false,
        message: "I'm having trouble booking that time slot. Let me transfer you to our booking team to help you directly."
      }
    }
  }

  /**
   * Transfer to sub-agent (Services or Pricing)
   */
  async transferToSubAgent(agentType) {
    // In Vapi, sub-agents are configured with assistant IDs
    const subAgentId = agentType === "services" 
      ? process.env.VAPI_SERVICES_ASSISTANT_ID 
      : process.env.VAPI_PRICING_ASSISTANT_ID

    return {
      transfer: true,
      assistantId: subAgentId,
      message: `Let me connect you with our ${agentType} specialist.`
    }
  }

  /**
   * Handle end of call - save call data to GHL
   */
  async handleEndOfCall(message) {
    console.log("\n📞 CALL ENDED")
    console.log("📊 Call Summary:", message.call?.summary || "No summary")
    console.log("⏱️ Duration:", message.endedReason)

    try {
      // Extract call data
      const transcript = message.transcript || ""
      const duration = message.call?.duration || 0
      const callId = message.call?.id

      // If we have a contact ID from the call, update it with call results
      if (message.call?.metadata?.contactId) {
        await this.ghlClient.updateContact(message.call.metadata.contactId, {
          customField: {
            last_call_transcript: transcript,
            last_call_duration: duration.toString(),
            last_call_id: callId,
            last_call_date: new Date().toISOString()
          }
        })
      }

      console.log("✅ Call data saved to GHL")
    } catch (error) {
      console.error("❌ Error saving call data:", error)
    }
  }

  /**
   * Start the Express server
   */
  start(port) {
    this.app.listen(port, () => {
      console.log(`\n✅ Keey Voice Assistant server running on port ${port}`)
      console.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/vapi`)
      console.log(`🏥 Health check: http://localhost:${port}/health\n`)
    })
  }
}

module.exports = VapiWebhookHandler

