#!/usr/bin/env node

/**
 * Test Assistant Tool Calls
 * 
 * This script simulates what a Vapi assistant would send when calling tools.
 * Use this to verify your webhook handler correctly processes tool calls
 * with the parameters that assistants will actually use.
 */

const axios = require("axios")
require("dotenv").config()

const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL 
  ? `${process.env.WEBHOOK_BASE_URL}/webhook/vapi`
  : "http://localhost:3000/webhook/vapi"

console.log("🧪 Testing Assistant Tool Calls")
console.log("=" .repeat(60))
console.log(`Webhook URL: ${WEBHOOK_URL}\n`)

/**
 * Test 1: Contact Creation (Inbound Assistant Use Case)
 */
async function testContactCreation() {
  console.log("\n📝 Test 1: Contact Creation")
  console.log("-".repeat(60))
  console.log("Scenario: Inbound assistant collects lead information\n")

  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        id: "call_" + Date.now(),
        name: "create_contact",
        parameters: {
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@example.com",
          phone: "+447700900456",
          propertyAddress: "15 Baker Street",
          city: "London",
          postcode: "NW1 6XE",
          bedrooms: "3",
          region: "London"
        }
      }
    }
  }

  try {
    console.log("📤 Sending:", JSON.stringify(payload.message.functionCall.parameters, null, 2))
    const response = await axios.post(WEBHOOK_URL, payload)
    console.log("\n✅ Response:", JSON.stringify(response.data, null, 2))
    
    // Extract contactId for next test
    const result = JSON.parse(response.data.functionCall.result)
    return result.contactId
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message)
    return null
  }
}

/**
 * Test 2: Check Calendar Availability
 */
async function testCalendarAvailability() {
  console.log("\n\n📅 Test 2: Check Calendar Availability")
  console.log("-".repeat(60))
  console.log("Scenario: Assistant checks if requested time is available\n")

  // Test with future date (tomorrow at 2 PM)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD format

  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        id: "call_" + Date.now(),
        name: "check_calendar_availability",
        parameters: {
          requestedDate: dateStr,
          requestedTime: "14:00",
          timezone: "Europe/London"
        }
      }
    }
  }

  try {
    console.log("📤 Sending:", JSON.stringify(payload.message.functionCall.parameters, null, 2))
    const response = await axios.post(WEBHOOK_URL, payload)
    console.log("\n✅ Response:", JSON.stringify(response.data, null, 2))
    
    const result = JSON.parse(response.data.functionCall.result)
    return { available: result.available, date: dateStr, time: "14:00" }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message)
    return null
  }
}

/**
 * Test 3: Book Appointment (With ContactId from Test 1)
 */
async function testBookAppointmentWithContactId(contactId, appointmentDetails) {
  console.log("\n\n🎫 Test 3: Book Appointment (with contactId)")
  console.log("-".repeat(60))
  console.log("Scenario: Assistant books appointment using existing contact\n")

  if (!contactId) {
    console.warn("⚠️  Skipping - no contactId from Test 1")
    return
  }

  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        id: "call_" + Date.now(),
        name: "book_appointment",
        parameters: {
          contactId: contactId,
          fullName: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          phone: "+447700900456",
          bookingDate: appointmentDetails.date,
          bookingTime: appointmentDetails.time,
          timezone: "Europe/London",
          appointmentTitle: "Keey Property Consultation"
        }
      }
    }
  }

  try {
    console.log("📤 Sending:", JSON.stringify(payload.message.functionCall.parameters, null, 2))
    const response = await axios.post(WEBHOOK_URL, payload)
    console.log("\n✅ Response:", JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message)
  }
}

/**
 * Test 4: Book Appointment (Without ContactId - Creates Contact Inline)
 */
async function testBookAppointmentWithoutContactId() {
  console.log("\n\n🎫 Test 4: Book Appointment (without contactId)")
  console.log("-".repeat(60))
  console.log("Scenario: Assistant books appointment and creates contact inline\n")

  // Test with day after tomorrow at 3 PM
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  const dateStr = dayAfterTomorrow.toISOString().split('T')[0]

  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        id: "call_" + Date.now(),
        name: "book_appointment",
        parameters: {
          fullName: "Michael Brown",
          email: "michael.brown@example.com",
          phone: "+447700900789",
          bookingDate: dateStr,
          bookingTime: "15:00",
          timezone: "Europe/London",
          appointmentTitle: "Keey Property Consultation"
        }
      }
    }
  }

  try {
    console.log("📤 Sending:", JSON.stringify(payload.message.functionCall.parameters, null, 2))
    const response = await axios.post(WEBHOOK_URL, payload)
    console.log("\n✅ Response:", JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message)
  }
}

/**
 * Test 5: Alternative Function Names
 */
async function testAlternativeFunctionNames() {
  console.log("\n\n🔄 Test 5: Alternative Function Names")
  console.log("-".repeat(60))
  console.log("Scenario: Test that webhook recognizes alternative function names\n")

  const tests = [
    {
      name: "contact_create_keey",
      params: {
        firstName: "Test",
        lastName: "Alternative",
        email: "test@example.com",
        phone: "+447700900000"
      }
    },
    {
      name: "check_calendar_availability_keey",
      params: {
        requestedDate: "2025-11-15",
        requestedTime: "10:00"
      }
    },
    {
      name: "book_calendar_appointment",
      params: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "+447700900000",
        bookingDate: "2025-11-15",
        bookingTime: "10:00"
      }
    }
  ]

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`)
    const payload = {
      message: {
        type: "function-call",
        functionCall: {
          id: "call_" + Date.now(),
          name: test.name,
          parameters: test.params
        }
      }
    }

    try {
      const response = await axios.post(WEBHOOK_URL, payload)
      const result = JSON.parse(response.data.functionCall.result)
      console.log(`  ✅ ${test.name} - Recognized: ${result.success ? 'YES' : 'NO'}`)
    } catch (error) {
      console.error(`  ❌ ${test.name} - Error:`, error.response?.data?.error || error.message)
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    // Test 1: Create Contact
    const contactId = await testContactCreation()
    
    // Test 2: Check Availability
    const appointmentDetails = await testCalendarAvailability()
    
    // Test 3: Book with ContactId
    if (contactId && appointmentDetails?.available) {
      await testBookAppointmentWithContactId(contactId, appointmentDetails)
    }
    
    // Test 4: Book without ContactId
    await testBookAppointmentWithoutContactId()
    
    // Test 5: Alternative function names
    await testAlternativeFunctionNames()
    
    console.log("\n\n" + "=".repeat(60))
    console.log("✅ All tests completed!")
    console.log("=".repeat(60))
    console.log("\n💡 What this tells us:")
    console.log("   ✅ If all tests passed → Assistants will work correctly")
    console.log("   ❌ If any failed → Check tool configuration in Vapi Dashboard")
    console.log("\n📋 Next Steps:")
    console.log("   1. Review TOOL_VERIFICATION_GUIDE.md")
    console.log("   2. Verify tools in Vapi Dashboard match these parameters")
    console.log("   3. Test a real call with Vapi credits")
    
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message)
    process.exit(1)
  }
}

// Run tests
runAllTests()









