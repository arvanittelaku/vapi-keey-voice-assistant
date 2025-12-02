const axios = require("axios")
require("dotenv").config()

async function testWebhook() {
  const baseUrl = process.env.WEBHOOK_BASE_URL || "http://localhost:3000"
  
  console.log("🧪 Testing Webhook Endpoints...")
  console.log(`📡 Base URL: ${baseUrl}\n`)
  
  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing health endpoint...")
    const healthResponse = await axios.get(`${baseUrl}/health`)
    console.log("✅ Health check passed:", healthResponse.data)
    console.log()
    
    // Test 2: Mock Function Call - create_contact
    console.log("2️⃣ Testing create_contact function...")
    const createContactPayload = {
      message: {
        type: "function-call",
        functionCall: {
          name: "create_contact",
          parameters: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+447700900000",
            propertyAddress: "123 Test Street",
            city: "London",
            postcode: "SW1A 1AA",
            bedrooms: "2",
            region: "London"
          }
        }
      }
    }
    
    const createContactResponse = await axios.post(
      `${baseUrl}/webhook/vapi`,
      createContactPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`
        }
      }
    )
    console.log("✅ create_contact test passed")
    console.log("Response:", JSON.stringify(createContactResponse.data, null, 2))
    console.log()
    
    // Test 3: Mock Function Call - check_calendar_availability
    console.log("3️⃣ Testing check_calendar_availability function...")
    const checkAvailabilityPayload = {
      message: {
        type: "function-call",
        functionCall: {
          name: "check_calendar_availability",
          parameters: {
            date: "2025-11-10",
            time: "14:00",
            timezone: "Europe/London"
          }
        }
      }
    }
    
    const checkAvailabilityResponse = await axios.post(
      `${baseUrl}/webhook/vapi`,
      checkAvailabilityPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`
        }
      }
    )
    console.log("✅ check_calendar_availability test passed")
    console.log("Response:", JSON.stringify(checkAvailabilityResponse.data, null, 2))
    console.log()
    
    // Test 4: Mock End of Call Report
    console.log("4️⃣ Testing end-of-call-report...")
    const endOfCallPayload = {
      message: {
        type: "end-of-call-report",
        call: {
          id: "test-call-123",
          duration: 300,
          summary: "Test call completed successfully",
          metadata: {
            contactId: "test-contact-123"
          }
        },
        transcript: "This is a test call transcript.",
        endedReason: "customer-ended"
      }
    }
    
    const endOfCallResponse = await axios.post(
      `${baseUrl}/webhook/vapi`,
      endOfCallPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`
        }
      }
    )
    console.log("✅ end-of-call-report test passed")
    console.log("Response:", JSON.stringify(endOfCallResponse.data, null, 2))
    console.log()
    
    console.log("🎉 All webhook tests passed!")
    
  } catch (error) {
    console.error("❌ Webhook test failed:")
    if (error.response) {
      console.error("Status:", error.response.status)
      console.error("Data:", error.response.data)
    } else {
      console.error(error.message)
    }
    process.exit(1)
  }
}

testWebhook()

