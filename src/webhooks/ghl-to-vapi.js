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
          callType: "outbound",
          triggeredAt: new Date().toISOString(),
          greeting: `Hi ${firstName}, this is Keey calling about your property inquiry. Do you have a moment to chat?` // Personalized greeting
        }

        // Initiate Vapi call
        console.log("\n📞 Initiating Vapi outbound call...")
        
        const callData = {
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          squadId: process.env.VAPI_SQUAD_ID, // Required for outbound calls
          customer: {
            number: phone.replace(/\s/g, ''), // Remove any spaces from phone number
            name: `${firstName} ${lastName}`.trim()
          },
          assistantOverrides: {
            variableValues: callMetadata // greeting is now part of variableValues
          }
        }

        console.log("📤 Call Data:", JSON.stringify(callData, null, 2))

        const call = await this.vapiClient.makeCall(callData)

        console.log("✅ Call initiated successfully!")
        console.log("📞 Call ID:", call.id)
        console.log("📊 Call Status:", call.status)

        // Respond to GHL webhook
        res.json({
          success: true,
          message: "Call initiated successfully",
          callId: call.id,
          status: call.status,
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

        const callData = {
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          squadId: process.env.VAPI_SQUAD_ID, // Required for outbound calls
          customer: {
            number: phone.replace(/\s/g, ''), // Remove any spaces
            name: `${firstName || "Test"} ${lastName || "User"}`.trim()
          },
          assistantOverrides: {
            variableValues: callMetadata // greeting is now part of variableValues
          }
        }

        console.log("📤 Initiating test call...")
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

    // 404 handler
    this.app.use((req, res) => {
      console.log("❌ 404 - Route not found:", req.url)
      res.status(404).json({ error: "Not found" })
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

