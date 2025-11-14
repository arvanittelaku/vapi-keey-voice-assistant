const express = require("express")
const VapiClient = require("../services/vapi-client")
require("dotenv").config()

class GHLToVapiWebhook {
  constructor(app) {
    this.app = app
    this.vapiClient = new VapiClient()
    this.setupRoutes()
  }

  setupRoutes() {
    console.log("📝 GHLToVapiWebhook: Registering routes...")
    console.log("📝 GHL: this.app exists?", !!this.app)
    console.log("📝 GHL: this.app type:", typeof this.app)
    
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        service: "GHL to Vapi Bridge",
        timestamp: new Date().toISOString()
      })
    })

    // GHL Webhook - Trigger outbound call
    this.app.post("/webhook/ghl-trigger-call", async (req, res) => {
      try {
        console.log("\n🔔 GHL WEBHOOK RECEIVED - TRIGGER CALL")
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2))

        const contactData = req.body

        // Validate required fields
        if (!contactData.phone && !contactData.contactPhone) {
          console.error("❌ Missing phone number in payload")
          return res.status(400).json({ 
            error: "Phone number is required",
            field: "phone or contactPhone"
          })
        }

        // Extract contact information
        const phone = contactData.phone || contactData.contactPhone
        const firstName = contactData.firstName || contactData.first_name || contactData.name?.split(' ')[0] || "there"
        const lastName = contactData.lastName || contactData.last_name || contactData.name?.split(' ')[1] || ""
        const email = contactData.email || ""
        const contactId = contactData.id || contactData.contactId || ""

        // Detect call type: confirmation vs lead qualification
        const callType = contactData.callType || contactData.call_type || "lead_qualification"
        const isConfirmationCall = callType === "confirmation" || callType === "appointment_confirmation"

        // Extract appointment details (for confirmation calls)
        const appointmentTime = contactData.appointmentTime || contactData.appointment_time || ""
        const appointmentDate = contactData.appointmentDate || contactData.appointment_date || ""
        const appointmentId = contactData.appointmentId || contactData.appointment_id || ""

        // Optional fields
        const propertyAddress = contactData.address1 || contactData.propertyAddress || ""
        const city = contactData.city || ""
        const postcode = contactData.postalCode || contactData.postcode || ""
        const bedrooms = contactData.customField?.bedrooms || contactData.bedrooms || ""
        const region = contactData.customField?.region || contactData.region || "London"

        console.log("\n📋 Extracted Contact Data:")
        console.log(`   Name: ${firstName} ${lastName}`)
        console.log(`   Phone: ${phone}`)
        console.log(`   Email: ${email}`)
        console.log(`   Contact ID: ${contactId}`)
        console.log(`   Region: ${region}`)
        console.log(`   Call Type: ${callType}`)
        if (isConfirmationCall) {
          console.log(`   ⏰ Appointment Time: ${appointmentTime}`)
          console.log(`   📅 Appointment Date: ${appointmentDate}`)
          console.log(`   🆔 Appointment ID: ${appointmentId}`)
        }

        // Prepare metadata for the call
        const callMetadata = {
          contactId: contactId,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          propertyAddress: propertyAddress,
          city: city,
          postcode: postcode,
          bedrooms: bedrooms,
          region: region,
          callSource: "GHL Workflow",
          callType: callType,
          triggeredAt: new Date().toISOString()
        }

        // Add appointment details if it's a confirmation call
        if (isConfirmationCall) {
          callMetadata.appointmentTime = appointmentTime
          callMetadata.appointmentDate = appointmentDate
          callMetadata.appointmentId = appointmentId
          
          // Extract ONLY the time portion (e.g., "4:00 PM" from "Thursday, November 13, 2025 4:00 PM")
          let appointmentTimeOnly = appointmentTime
          const timeMatch = appointmentTime.match(/(\d{1,2}:\d{2}\s?[AP]M)/i)
          if (timeMatch) {
            appointmentTimeOnly = timeMatch[0]
          }
          callMetadata.appointmentTimeOnly = appointmentTimeOnly
          
          callMetadata.greeting = `Hi ${firstName}, this is Keey calling to confirm your appointment.`
        } else {
          callMetadata.greeting = `Hi ${firstName}, this is Keey calling about your property inquiry. Do you have a moment to chat?`
        }

        // Initiate Vapi call
        console.log("\n📞 Initiating Vapi outbound call...")
        
        // Ensure phone number is in E.164 format using libphonenumber-js
        const { parsePhoneNumber } = require('libphonenumber-js');
        let formattedPhone = phone;
        
        try {
          // Try to parse with proper library
          const defaultCountry = region === 'Dubai' ? 'AE' : 'GB';
          const phoneNumber = parsePhoneNumber(phone, defaultCountry);
          if (phoneNumber && phoneNumber.isValid()) {
            formattedPhone = phoneNumber.format('E.164');
            console.log(`   📱 Phone formatted with libphonenumber: "${phone}" → "${formattedPhone}"`);
          } else {
            // Fallback to manual formatting
            formattedPhone = phone
              .replace(/\s/g, '')      // Remove spaces
              .replace(/\(/g, '')      // Remove (
              .replace(/\)/g, '')      // Remove )
              .replace(/-/g, '')       // Remove dashes
              .replace(/\./g, '');     // Remove dots
            
            if (!formattedPhone.startsWith('+')) {
              const countryCode = region === 'Dubai' ? '+971' : '+44';
              formattedPhone = countryCode + formattedPhone.replace(/^0+/, '');
            }
            console.log(`   📱 Phone formatted manually: "${phone}" → "${formattedPhone}"`);
          }
        } catch (e) {
          // Fallback to manual formatting if parsing fails
          formattedPhone = phone
            .replace(/\s/g, '')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
            .replace(/-/g, '')
            .replace(/\./g, '');
          
          if (!formattedPhone.startsWith('+')) {
            const countryCode = region === 'Dubai' ? '+971' : '+44';
            formattedPhone = countryCode + formattedPhone.replace(/^0+/, '');
          }
          console.log(`   📱 Phone formatted (fallback): "${phone}" → "${formattedPhone}"`);
        }

        // Build call data based on call type
        const callData = {
          customer: {
            number: formattedPhone, // E.164 formatted phone number
            name: `${firstName} ${lastName}`.trim()
          },
          assistantOverrides: {
            variableValues: callMetadata, // All contact data available to AI
            firstMessage: callMetadata.greeting // Explicit personalized greeting
          }
        }

        // Use appropriate phone number, assistant/squad based on call type
        if (isConfirmationCall) {
          console.log("📋 Confirmation call detected - Using Confirmation Assistant")
          // Confirmation calls use phoneNumberId + assistantId (not squad)
          // Use dedicated confirmation phone if available, otherwise use main phone
          callData.phoneNumberId = process.env.VAPI_CONFIRMATION_PHONE_NUMBER_ID || process.env.VAPI_PHONE_NUMBER_ID
          callData.assistantId = process.env.VAPI_CONFIRMATION_ASSISTANT_ID
          
          if (!callData.phoneNumberId) {
            throw new Error("VAPI_PHONE_NUMBER_ID not configured - need phone number for confirmation calls")
          }
        } else {
          console.log("📋 Lead qualification call - Using Squad & Main Phone Number")
          callData.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
          callData.squadId = process.env.VAPI_SQUAD_ID
        }

        console.log("🔍 DEBUG - Original phone:", phone)
        console.log("🔍 DEBUG - Formatted phone:", formattedPhone)
        console.log("🔍 DEBUG - Phone Number ID:", callData.phoneNumberId)
        console.log("🔍 DEBUG - Assistant/Squad ID:", isConfirmationCall ? process.env.VAPI_CONFIRMATION_ASSISTANT_ID : process.env.VAPI_SQUAD_ID)
        console.log("📤 Call Data:", JSON.stringify(callData, null, 2))

        const call = await this.vapiClient.makeCall(callData)

        console.log("✅ Call initiated successfully!")
        console.log("📞 Call ID:", call.id)
        console.log("📊 Call Status:", call.status)

        // Respond to GHL webhook
        res.json({
          success: true,
          message: isConfirmationCall ? "Confirmation call initiated successfully" : "Call initiated successfully",
          callId: call.id,
          status: call.status,
          callType: callType,
          customer: {
            name: `${firstName} ${lastName}`.trim(),
            phone: phone
          }
        })

      } catch (error) {
        console.error("\n❌ ERROR initiating call:", error.message)
        if (error.response) {
          console.error("API Error:", JSON.stringify(error.response.data, null, 2))
        }

        res.status(500).json({
          success: false,
          error: error.message,
          details: error.response?.data || "Internal server error"
        })
      }
    })

    // Test endpoint - Trigger call manually (for Postman testing)
    this.app.post("/test/trigger-call", async (req, res) => {
      try {
        console.log("\n🧪 TEST CALL TRIGGER")
        console.log("📦 Test Payload:", JSON.stringify(req.body, null, 2))

        const { phone, firstName, lastName, email, contactId } = req.body

        if (!phone) {
          return res.status(400).json({ 
            error: "Phone number is required",
            example: {
              phone: "+447700900000",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              contactId: "test123"
            }
          })
        }

        const callMetadata = {
          contactId: contactId || "test-" + Date.now(),
          firstName: firstName || "Test",
          lastName: lastName || "User",
          email: email || "test@example.com",
          phone: phone,
          region: "London",
          callSource: "Manual Test",
          callType: "outbound-test",
          triggeredAt: new Date().toISOString(),
          greeting: `Hi ${firstName || "Test"}, this is Keey calling. This is a test call to verify our voice assistant is working correctly. Can you hear me?` // Personalized greeting
        }

        // Ensure phone number is in E.164 format
        let formattedPhone = phone.replace(/\s/g, ''); // Remove spaces
        
        // If phone doesn't start with +, try to add country code
        if (!formattedPhone.startsWith('+')) {
          // Default to UK for test calls
          formattedPhone = '+44' + formattedPhone.replace(/^0+/, ''); // Remove leading zeros
        }

        const callData = {
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          squadId: process.env.VAPI_SQUAD_ID, // Required for outbound calls
          customer: {
            number: formattedPhone, // E.164 formatted phone number
            name: `${firstName || "Test"} ${lastName || "User"}`.trim()
          },
          assistantOverrides: {
            variableValues: callMetadata, // All contact data available to AI
            firstMessage: `Hi ${firstName || "Test"}, this is Keey calling. This is a test call to verify our voice assistant is working correctly. Can you hear me?` // Explicit personalized greeting
          }
        }

        console.log("📤 Initiating test call...")
        console.log("🔍 DEBUG - Original phone:", phone)
        console.log("🔍 DEBUG - Formatted phone:", formattedPhone)
        console.log("🔍 DEBUG - Phone Number ID:", process.env.VAPI_PHONE_NUMBER_ID)
        console.log("🔍 DEBUG - Squad ID:", process.env.VAPI_SQUAD_ID)
        const call = await this.vapiClient.makeCall(callData)

        console.log("✅ Test call initiated!")
        console.log("📞 Call ID:", call.id)

        res.json({
          success: true,
          message: "Test call initiated successfully",
          callId: call.id,
          status: call.status,
          customer: callData.customer,
          metadata: callMetadata
        })

      } catch (error) {
        console.error("\n❌ ERROR in test call:", error.message)
        if (error.response) {
          console.error("API Error:", JSON.stringify(error.response.data, null, 2))
        }

        res.status(500).json({
          success: false,
          error: error.message,
          details: error.response?.data || "Internal server error"
        })
      }
    })
  }

  start(port) {
    this.app.listen(port, () => {
      console.log(`\n✅ GHL to Vapi Bridge running on port ${port}`)
      console.log(`📡 GHL Webhook: http://localhost:${port}/webhook/ghl-trigger-call`)
      console.log(`🧪 Test Endpoint: http://localhost:${port}/test/trigger-call`)
      console.log(`🏥 Health Check: http://localhost:${port}/health\n`)
    })
  }
}

module.exports = GHLToVapiWebhook

