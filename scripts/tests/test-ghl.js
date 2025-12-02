const GHLClient = require("../src/services/ghl-client")
require("dotenv").config()

async function testGHLIntegration() {
  console.log("🧪 Testing GoHighLevel Integration...\n")
  
  try {
    const ghl = new GHLClient()
    
    // Test 1: Create Test Contact
    console.log("1️⃣ Testing contact creation...")
    const testContact = await ghl.createContact({
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@example.com`,
      phone: "+447700900000",
      address1: "123 Test Street",
      city: "London",
      postalCode: "SW1A 1AA",
      customField: {
        bedrooms: "2",
        region: "London",
        lead_source: "Voice Assistant Test"
      }
    })
    
    console.log("✅ Contact created successfully!")
    console.log("Contact ID:", testContact.contact?.id || testContact.id)
    console.log()
    
    const contactId = testContact.contact?.id || testContact.id
    
    // Test 2: Get Contact
    console.log("2️⃣ Testing contact retrieval...")
    const retrievedContact = await ghl.getContact(contactId)
    console.log("✅ Contact retrieved successfully!")
    console.log("Name:", `${retrievedContact.contact?.firstName} ${retrievedContact.contact?.lastName}`)
    console.log()
    
    // Test 3: Update Contact
    console.log("3️⃣ Testing contact update...")
    await ghl.updateContact(contactId, {
      customField: {
        test_updated: "true",
        last_test_date: new Date().toISOString()
      }
    })
    console.log("✅ Contact updated successfully!")
    console.log()
    
    // Test 4: Check Calendar Availability (requires GHL_CALENDAR_ID)
    if (process.env.GHL_CALENDAR_ID) {
      console.log("4️⃣ Testing calendar availability...")
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0)
      
      const endTime = new Date(tomorrow)
      endTime.setHours(15, 0, 0, 0)
      
      const availability = await ghl.checkCalendarAvailability(
        process.env.GHL_CALENDAR_ID,
        tomorrow.toISOString(),
        endTime.toISOString(),
        "Europe/London"
      )
      
      console.log("✅ Calendar availability checked!")
      console.log("Available slots:", availability.slots?.length || 0)
      console.log()
      
      // Test 5: Create Appointment (only if slots available)
      if (availability.slots && availability.slots.length > 0) {
        console.log("5️⃣ Testing appointment creation...")
        const appointment = await ghl.createCalendarAppointment(
          process.env.GHL_CALENDAR_ID,
          contactId,
          availability.slots[0].startTime,
          "Europe/London",
          "Test Consultation - Keey Voice Assistant"
        )
        
        console.log("✅ Appointment created successfully!")
        console.log("Appointment ID:", appointment.id)
        console.log()
      } else {
        console.log("⚠️  Skipping appointment creation (no available slots)")
        console.log()
      }
    } else {
      console.log("⚠️  Skipping calendar tests (GHL_CALENDAR_ID not set)")
      console.log()
    }
    
    console.log("🎉 All GHL integration tests passed!")
    console.log("\n📋 Test Contact Details:")
    console.log(`Contact ID: ${contactId}`)
    console.log("You can view this contact in your GHL dashboard.")
    
  } catch (error) {
    console.error("❌ GHL integration test failed:")
    console.error("Error:", error.message)
    if (error.response) {
      console.error("Status:", error.response.status)
      console.error("Data:", JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

testGHLIntegration()

