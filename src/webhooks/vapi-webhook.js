const express = require("express")
const axios = require("axios")
const GHLClient = require("../services/ghl-client")
const TimezoneDetector = require("../services/timezone-detector")
const CallingHoursValidator = require("../services/calling-hours-validator")
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
      return this.handleGHLToVapi(req, res)
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
   * Create or update contact in GHL (Simplified - Inbound leads)
   */
  async createContact(params) {
    const { 
      email, 
      phone, 
      postcode,
      postalCode // Support both naming conventions
    } = params

    try {
      // Validate required fields
      if (!email || !phone) {
        console.error("❌ Missing required fields: email and phone")
        return {
          success: false,
          message: "I need both your email and phone number to continue."
        }
      }

      console.log("\n👤 Creating/updating contact (simplified)...")
      console.log(`   Email: ${email}`)
      console.log(`   Phone: ${phone}`)
      console.log(`   Postal Code: ${postcode || postalCode}`)

      // Normalize phone number (default to GB)
      const normalizedPhone = this.normalizePhoneNumber(phone, "GB")

      // Generate a name from email
      const emailPrefix = email.split('@')[0]
      const generatedFirstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
      const generatedLastName = "Lead"

      // Search for existing contact
      let contact = await this.ghlClient.searchContact(email, normalizedPhone)

      const finalPostalCode = postcode || postalCode

      if (contact && contact.contacts && contact.contacts.length > 0) {
        // Update existing contact
        const existingContact = contact.contacts[0]
        const updatePayload = {
          email,
          phone: normalizedPhone,
          customField: {
            lead_source: "Voice Assistant - Inbound"
          }
        }
        
        // Add postal code if provided
        if (finalPostalCode) {
          updatePayload.postalCode = finalPostalCode
        }

        await this.ghlClient.updateContact(existingContact.id, updatePayload)

        console.log("✅ Updated existing contact:", existingContact.id)
        return {
          success: true,
          contactId: existingContact.id,
          message: "Thank you! I've updated your information."
        }
      } else {
        // Create new contact
        const createPayload = {
          firstName: generatedFirstName,
          lastName: generatedLastName,
          email,
          phone: normalizedPhone,
          source: "Voice Assistant - Inbound Lead",
          customField: {
            lead_source: "Voice Assistant - Inbound"
          }
        }

        // Add postal code if provided
        if (finalPostalCode) {
          createPayload.postalCode = finalPostalCode
        }

        const newContact = await this.ghlClient.createContact(createPayload)

        console.log("✅ Created new contact:", newContact.contact.id)
        return {
          success: true,
          contactId: newContact.contact.id,
          message: "Thank you! I've saved your information."
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
    return this.app
  }

  /**
   * Handle incoming webhook from GHL to initiate a VAPI call with timezone awareness
   */
  async handleGHLToVapi(req, res) {
    try {
      const payload = req.body
      console.log("\n\n📞 ========== GHL → VAPI CALL REQUEST ==========")
      console.log("📋 Payload:", JSON.stringify(payload, null, 2))

      // Extract data from payload
      const phone = payload.phone || payload.customer?.number
      const contactId = payload.contactId || payload.contact_id
      const name = payload.name || payload.customer?.name || "Customer"
      const squadId = payload.squadId || process.env.VAPI_SQUAD_ID // Using squad for outbound calls
      const phoneNumberId = payload.phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID

      // Validation
      if (!phone) {
        console.error("❌ Missing phone number")
        return res.status(400).json({
          success: false,
          error: "Missing phone number",
          message: "phone or customer.number is required"
        })
      }

      if (!squadId || !phoneNumberId) {
        console.error("❌ Missing VAPI configuration")
        return res.status(500).json({
          success: false,
          error: "Missing VAPI configuration",
          message: "VAPI_SQUAD_ID and VAPI_PHONE_NUMBER_ID must be set"
        })
      }

      console.log(`\n📱 Phone: ${phone}`)
      console.log(`👤 Name: ${name}`)
      console.log(`🆔 Contact ID: ${contactId || 'Not provided'}`)

      // STEP 1: Detect timezone from phone number
      const detectedTimezone = TimezoneDetector.detectFromPhone(phone)
      const timezoneName = TimezoneDetector.getTimezoneName(detectedTimezone)
      console.log(`\n🌍 Timezone detected: ${timezoneName} (${detectedTimezone})`)

      // STEP 2: Save timezone to GHL (if contact ID provided)
      if (contactId) {
        try {
          console.log(`💾 Saving timezone to GHL contact ${contactId}...`)
          await this.ghlClient.updateContact(contactId, {
            timezone: detectedTimezone // GHL built-in field
          })
          console.log(`✅ Timezone saved to GHL`)
        } catch (error) {
          console.error(`⚠️  Could not save timezone:`, error.message)
          // Don't fail the call if we can't save timezone
        }
      }

      // STEP 3: Check if within calling hours
      const callingHoursCheck = CallingHoursValidator.isWithinCallingHours(detectedTimezone)

      if (!callingHoursCheck.canCall) {
        console.log(`\n⏰ ========== OUTSIDE CALLING HOURS ==========`)
        console.log(`   Reason: ${callingHoursCheck.reason}`)
        console.log(`   Current time: ${callingHoursCheck.currentTime}`)
        console.log(`   Next available: ${callingHoursCheck.nextCallTime}`)

        // Update GHL with scheduled retry
        if (contactId) {
          try {
            await this.ghlClient.updateContact(contactId, {
              customFields: {
                call_status: 'scheduled_for_business_hours',
                call_attempts: '0',
                next_call_scheduled: callingHoursCheck.nextCallTime,
                last_call_time: new Date().toISOString()
              }
            })
            console.log(`✅ Contact updated with scheduled retry time`)
          } catch (error) {
            console.error(`⚠️  Could not update GHL:`, error.message)
          }
        }

        console.log("========== END CALL REQUEST (SCHEDULED) ==========\n")

        return res.json({
          success: true,
          callInitiated: false,
          scheduled: true,
          message: `Call scheduled for business hours (${timezoneName})`,
          reason: callingHoursCheck.reason,
          scheduledFor: callingHoursCheck.nextCallTime,
          timezone: detectedTimezone
        })
      }

      // STEP 4: Within calling hours - initiate call via VAPI
      console.log(`\n✅ WITHIN CALLING HOURS - Proceeding with call`)

      const vapiPayload = {
        squadId: squadId, // Using squad for outbound calls
        phoneNumberId: phoneNumberId,
        customer: {
          number: phone,
          name: name
        }
      }

      // Add assistant overrides if contact ID is provided
      if (contactId) {
        vapiPayload.assistantOverrides = {
          variableValues: {
            contact_id: contactId,
            phone: phone,
            firstName: name.split(' ')[0],
            fullName: name,
            timezone: detectedTimezone
          }
        }
      }

      console.log(`\n🚀 Calling VAPI API...`)
      console.log(`   Squad ID: ${squadId}`)
      console.log(`   Phone Number ID: ${phoneNumberId}`)

      const vapiResponse = await axios.post(
        'https://api.vapi.ai/call',
        vapiPayload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const callId = vapiResponse.data.id
      console.log(`✅ Call initiated successfully!`)
      console.log(`   Call ID: ${callId}`)

      // Update GHL with call status
      if (contactId) {
        try {
          // Get current attempt count
          let currentAttempts = 0
          try {
            const contact = await this.ghlClient.getContact(contactId)
            currentAttempts = parseInt(contact.customFieldsParsed?.call_attempts || "0")
          } catch (error) {
            console.log(`⚠️  Could not get current attempts, defaulting to 0`)
          }

          const newAttempts = currentAttempts + 1

          await this.ghlClient.updateContact(contactId, {
            customFields: {
              call_status: 'calling_now',
              call_attempts: newAttempts.toString(),
              last_call_time: new Date().toISOString(),
              vapi_call_id: callId
            }
          })
          console.log(`✅ GHL updated: Attempt #${newAttempts}, status=calling_now`)
        } catch (error) {
          console.error(`⚠️  Could not update GHL:`, error.message)
        }
      }

      console.log("========== END CALL REQUEST (INITIATED) ==========\n")

      return res.json({
        success: true,
        callInitiated: true,
        callId: callId,
        message: "Call initiated successfully",
        timezone: detectedTimezone,
        phone: phone
      })

    } catch (error) {
      console.error("\n❌ ========== ERROR IN GHL → VAPI ==========")
      console.error(`   Error: ${error.message}`)
      
      if (error.response) {
        console.error(`   Status: ${error.response.status}`)
        console.error(`   Response:`, JSON.stringify(error.response.data, null, 2))
      }
      
      console.error(error.stack)
      console.error("========== END ERROR ==========\n")

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
        details: error.response?.data || null
      })
    }
  }
}

module.exports = VapiWebhookHandler

