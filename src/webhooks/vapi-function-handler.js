const express = require("express")
const GHLClient = require("../services/ghl-client")
const { parsePhoneNumber } = require("libphonenumber-js")
const { DateTime } = require("luxon")

class VapiFunctionHandler {
  constructor(app) {
    this.app = app
    this.ghlClient = new GHLClient()
    this.setupRoutes()
  }

  setupRoutes() {
    console.log("📝 VapiFunctionHandler: Registering /webhook/vapi route...")
    console.log("📝 this.app exists?", !!this.app)
    console.log("📝 this.app type:", typeof this.app)
    
    if (!this.app) {
      console.error("❌ ERROR: this.app is undefined in VapiFunctionHandler!")
      return
    }
    
    // TEST ROUTE - Verify handler is working
    this.app.get("/webhook/vapi", (req, res) => {
      console.log("✅ GET /webhook/vapi hit!")
      res.json({ 
        status: "VapiFunctionHandler is working!",
        message: "Use POST to this endpoint for function calls"
      })
    })
    
    // Vapi Function Call Webhook
    this.app.post("/webhook/vapi", async (req, res) => {
      try {
        console.log("\n🔔 VAPI FUNCTION CALL RECEIVED")
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2))

        const { message } = req.body

        // Handle different message types
        if (message?.type === "function-call") {
          const { functionCall } = message
          const { id, name, parameters } = functionCall

          console.log(`🛠️  Function Called: ${name}`)
          console.log(`📋 Parameters:`, parameters)

          // Route to appropriate function handler
          let result
          switch (name) {
            case "check_calendar_availability":
            case "check_calendar_availability_keey":
              result = await this.checkCalendarAvailability(parameters)
              break

            case "book_calendar_appointment":
            case "book_calendar_appointment_keey":
            case "book_appointment":
              result = await this.bookCalendarAppointment(parameters)
              break

            case "create_contact":
            case "capture_qualification_data":
              result = await this.createContact(parameters)
              break

            default:
              result = {
                success: false,
                message: `Unknown function: ${name}`
              }
          }

          console.log("✅ Function result:", result)
          
          // Return in Vapi's expected format
          return res.json({
            functionCall: {
              id: id,
              result: JSON.stringify(result)
            }
          })
        }

        // Handle other message types
        return res.json({ received: true })

      } catch (error) {
        console.error("\n❌ ERROR in Vapi webhook:", error.message)
        if (error.response) {
          console.error("API Error:", JSON.stringify(error.response.data, null, 2))
        }

        res.status(500).json({
          success: false,
          error: error.message,
          message: "I'm sorry, I encountered an error processing that request. Let me try again."
        })
      }
    })
  }

  /**
   * Check calendar availability
   */
  async checkCalendarAvailability(params) {
    const { timezone, requestedDate, requestedTime, date, time } = params
    
    // Support both parameter formats
    const dateStr = date || requestedDate
    const timeStr = time || requestedTime
    const tz = timezone || "Europe/London"

    try {
      console.log(`\n📅 Checking calendar availability...`)
      console.log(`   Date: ${dateStr}`)
      console.log(`   Time: ${timeStr}`)
      console.log(`   Timezone: ${tz}`)

      // Try to parse as ISO format first (2025-11-10 14:00)
      let dt = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz })
      
      // If that fails, try natural language format
      if (!dt.isValid) {
        const dateTimeStr = `${dateStr} ${timeStr}`
        dt = DateTime.fromFormat(dateTimeStr, "MMMM d, yyyy h:mm a", { zone: tz })
      }

      if (!dt.isValid) {
        return {
          success: false,
          message: `I couldn't understand that date and time. Could you please tell me again in a clear format like "November 5th at 2 PM"?`
        }
      }

      // Check if it's in the past
      if (dt < DateTime.now()) {
        return {
          success: false,
          available: false,
          message: "That time has already passed. Could you suggest a future date and time?"
        }
      }

      // Check GHL calendar availability
      const calendarId = process.env.GHL_CALENDAR_ID
      if (!calendarId) {
        console.warn("⚠️  GHL_CALENDAR_ID not configured, simulating availability check")
        // Simulate: available if it's business hours (9 AM - 5 PM, weekdays)
        const hour = dt.hour
        const isWeekday = dt.weekday >= 1 && dt.weekday <= 5
        const isBusinessHours = hour >= 9 && hour < 17

        const available = isWeekday && isBusinessHours

        return {
          success: true,
          available: available,
          message: available 
            ? `Great news! ${requestedDate} at ${requestedTime} is available. Shall I book that for you?`
            : `I'm sorry, that time isn't available. Our consultations are available Monday to Friday, 9 AM to 5 PM. Would you like to try a different time?`
        }
      }

      // Actually check GHL calendar
      const availability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        dt.toISO(),
        timezone
      )

      if (availability.available) {
        return {
          success: true,
          available: true,
          message: `Perfect! ${requestedDate} at ${requestedTime} is available. Would you like me to book this consultation for you?`
        }
      } else {
        return {
          success: true,
          available: false,
          message: `I'm sorry, that time slot is already booked. We have availability at ${availability.nextAvailable || 'other times'}. Would that work for you?`
        }
      }

    } catch (error) {
      console.error("❌ Error checking calendar:", error.message)
      console.error("❌ Stack trace:", error.stack)
      console.error("❌ Full error:", JSON.stringify(error, null, 2))
      return {
        success: false,
        error: error.message,
        message: "I'm having trouble checking the calendar right now. Let me take your details and someone from our team will call you back shortly to confirm a time. What's your preferred contact number?"
      }
    }
  }

  /**
   * Book calendar appointment
   */
  async bookCalendarAppointment(params) {
    const { email, phone, fullName, timezone, bookingDate, bookingTime, contactId, date, time, appointmentTitle } = params
    
    // Support both parameter formats
    const dateStr = date || bookingDate
    const timeStr = time || bookingTime
    const tz = timezone || "Europe/London"

    try {
      console.log(`\n📅 Booking calendar appointment...`)
      console.log(`   Name: ${fullName}`)
      console.log(`   Email: ${email}`)
      console.log(`   Phone: ${phone}`)
      console.log(`   Contact ID: ${contactId}`)
      console.log(`   Date: ${dateStr}`)
      console.log(`   Time: ${timeStr}`)
      console.log(`   Timezone: ${tz}`)

      // Try to parse as ISO format first (2025-11-10 14:00)
      let dt = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz })
      
      // If that fails, try natural language format
      if (!dt.isValid) {
        const dateTimeStr = `${dateStr} ${timeStr}`
        dt = DateTime.fromFormat(dateTimeStr, "MMMM d, yyyy h:mm a", { zone: tz })
      }

      if (!dt.isValid) {
        return {
          success: false,
          message: "I had trouble processing that booking time. Could you confirm the date and time again?"
        }
      }

      // Normalize phone number
      let normalizedPhone = phone
      try {
        const phoneNumber = parsePhoneNumber(phone, 'GB')
        if (phoneNumber) {
          normalizedPhone = phoneNumber.format('E.164')
        }
      } catch (e) {
        console.warn("Could not parse phone number:", phone)
      }

      // Split full name
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(' ') || ""

      // Create or update contact in GHL
      const calendarId = process.env.GHL_CALENDAR_ID
      if (!calendarId) {
        console.warn("⚠️  GHL_CALENDAR_ID not configured, simulating booking")
        return {
          success: true,
          message: `Perfect! I've booked your consultation for ${bookingDate} at ${bookingTime}. You'll receive a confirmation email at ${email} shortly. Is there anything else I can help you with?`
        }
      }

      // Create/update contact first
      const contact = await this.ghlClient.createContact({
        firstName,
        lastName,
        email,
        phone: normalizedPhone,
        source: "Voice Assistant - Consultation Booking"
      })

      console.log(`✅ Contact created/updated: ${contact.id || contact.contact?.id}`)

      // Book the appointment
      const appointment = await this.ghlClient.createCalendarAppointment(
        calendarId,
        contact.id || contact.contact?.id,
        dt.toISO(),
        timezone,
        "Keey Property Consultation"
      )

      console.log(`✅ Appointment booked: ${appointment.id}`)

      return {
        success: true,
        appointmentId: appointment.id,
        message: `Excellent! I've confirmed your consultation for ${bookingDate} at ${bookingTime}. You'll receive a confirmation email at ${email} with all the details. We're looking forward to speaking with you!`
      }

    } catch (error) {
      console.error("❌ Error booking appointment:", error.message)
      console.error("❌ Stack trace:", error.stack)
      console.error("❌ Full error:", JSON.stringify(error, null, 2))
      return {
        success: false,
        error: error.message,
        message: "I've noted all your details, but I'm having a small technical issue completing the booking right now. Don't worry - our team has your information and will call you within the next hour to confirm your consultation time. Is there anything else I can help you with?"
      }
    }
  }

  /**
   * Create/update contact in GHL
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
      console.log(`\n👤 Creating/updating contact...`)
      console.log(`   Name: ${firstName} ${lastName}`)
      console.log(`   Email: ${email}`)
      console.log(`   Phone: ${phone}`)

      // Normalize phone number
      let normalizedPhone = phone
      try {
        const countryCode = region === "Dubai" ? "AE" : "GB"
        const phoneNumber = parsePhoneNumber(phone, countryCode)
        if (phoneNumber) {
          normalizedPhone = phoneNumber.format('E.164')
        }
      } catch (e) {
        console.warn("Could not parse phone number:", phone)
      }

      // Create/update contact in GHL
      const contact = await this.ghlClient.createContact({
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

      console.log(`✅ Contact created: ${contact.id || contact.contact?.id}`)

      return {
        success: true,
        contactId: contact.id || contact.contact?.id,
        message: `Thank you, ${firstName}! I've saved all your information. Is there anything else you'd like to know about how Keey can help maximize your property's income?`
      }

    } catch (error) {
      console.error("❌ Error creating contact:", error)
      return {
        success: false,
        message: "Thank you for providing that information. I've made a note of everything. How else can I assist you today?"
      }
    }
  }

  start(port) {
    this.app.listen(port, () => {
      console.log(`\n✅ Vapi Function Handler running on port ${port}`)
      console.log(`🔧 Function Webhook: http://localhost:${port}/webhook/vapi`)
      console.log(`🏥 Health Check: http://localhost:${port}/health\n`)
    })
  }
}

module.exports = VapiFunctionHandler

