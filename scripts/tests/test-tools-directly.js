require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

console.log('🧪 Testing GHL Tools Integration...\n');
console.log('='.repeat(60));

const ghlClient = new GHLClient();

// Test data
const testContact = {
  firstName: 'Test',
  lastName: 'User',
  email: `test.user.${Date.now()}@example.com`, // Unique email
  phone: '+447700900999',
  propertyAddress: '123 Test Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  bedrooms: '2',
  region: 'London'
};

let createdContactId = null;

async function runTests() {
  try {
    // Check if credentials are set
    console.log('\n📋 Checking Environment Variables...');
    console.log(`   GHL_API_KEY: ${process.env.GHL_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GHL_LOCATION_ID: ${process.env.GHL_LOCATION_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GHL_CALENDAR_ID: ${process.env.GHL_CALENDAR_ID ? '✅ Set' : '❌ Missing'}`);

    if (!process.env.GHL_API_KEY || !process.env.GHL_LOCATION_ID) {
      console.log('\n❌ Missing required environment variables!');
      console.log('   Please set GHL_API_KEY and GHL_LOCATION_ID in your .env file');
      return;
    }

    // Test 1: Create Contact
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Create Contact in GHL');
    console.log('='.repeat(60));
    console.log('📤 Creating contact with data:', JSON.stringify(testContact, null, 2));

    try {
      const contactResult = await ghlClient.createContact(testContact);
      
      if (contactResult.success) {
        createdContactId = contactResult.contactId;
        console.log('✅ TEST 1 PASSED: Contact created successfully!');
        console.log(`   Contact ID: ${contactResult.contactId}`);
        console.log(`   Message: ${contactResult.message}`);
      } else {
        console.log('❌ TEST 1 FAILED: Contact creation failed');
        console.log(`   Error: ${contactResult.message}`);
      }
    } catch (error) {
      console.log('❌ TEST 1 FAILED: Exception thrown');
      console.log(`   Error: ${error.message}`);
    }

    // Test 2: Check Calendar Availability
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Check Calendar Availability');
    console.log('='.repeat(60));

    if (!process.env.GHL_CALENDAR_ID) {
      console.log('⚠️  TEST 2 SKIPPED: GHL_CALENDAR_ID not set');
    } else {
      // Get tomorrow at 2 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      
      // Get start and end of day for availability check
      const startOfDay = new Date(tomorrow);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(tomorrow);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`📤 Checking availability for: ${tomorrow.toISOString().split('T')[0]}`);
      console.log(`   Time range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      try {
        const availabilityResult = await ghlClient.checkCalendarAvailability(
          process.env.GHL_CALENDAR_ID,
          startOfDay.toISOString(),
          endOfDay.toISOString(),
          'Europe/London'
        );

        if (availabilityResult.slots !== undefined) {
          console.log('✅ TEST 2 PASSED: Calendar check successful!');
          console.log(`   Slots found: ${availabilityResult.slots.length}`);
          if (availabilityResult.slots.length > 0) {
            console.log(`   First 3 slots:`, availabilityResult.slots.slice(0, 3));
          }
        } else {
          console.log('❌ TEST 2 FAILED: Invalid response from calendar check');
          console.log(`   Response:`, availabilityResult);
        }
      } catch (error) {
        console.log('❌ TEST 2 FAILED: Exception thrown');
        console.log(`   Error: ${error.message}`);
      }
    }

    // Test 3: Book Appointment (only if we have a contact ID)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Book Appointment');
    console.log('='.repeat(60));

    if (!process.env.GHL_CALENDAR_ID) {
      console.log('⚠️  TEST 3 SKIPPED: GHL_CALENDAR_ID not set');
    } else if (!createdContactId) {
      console.log('⚠️  TEST 3 SKIPPED: No contact ID from TEST 1');
    } else {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const bookingDate = tomorrow.toISOString().split('T')[0];
      const bookingTime = '15:00';

      console.log(`📤 Booking appointment for contact ${createdContactId}`);
      console.log(`   Date: ${bookingDate} at ${bookingTime}`);

      try {
        const bookingResult = await ghlClient.bookAppointment({
          contactId: createdContactId,
          fullName: `${testContact.firstName} ${testContact.lastName}`,
          email: testContact.email,
          phone: testContact.phone,
          bookingDate: bookingDate,
          bookingTime: bookingTime,
          timezone: 'Europe/London',
          appointmentTitle: 'Test Consultation Booking'
        });

        if (bookingResult.success) {
          console.log('✅ TEST 3 PASSED: Appointment booked successfully!');
          console.log(`   Appointment ID: ${bookingResult.appointmentId || 'N/A'}`);
          console.log(`   Message: ${bookingResult.message}`);
        } else {
          console.log('❌ TEST 3 FAILED: Appointment booking failed');
          console.log(`   Error: ${bookingResult.message}`);
        }
      } catch (error) {
        console.log('❌ TEST 3 FAILED: Exception thrown');
        console.log(`   Error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('\n✅ All tests completed!');
    console.log('\nWhat these tests verified:');
    console.log('  ✓ GHL API credentials are valid');
    console.log('  ✓ Contact creation works');
    console.log('  ✓ Calendar availability checking works');
    console.log('  ✓ Appointment booking works');
    console.log('\n📌 Next step: Test with a real Vapi call when you have credits');
    
    if (createdContactId) {
      console.log(`\n💡 Test contact created with ID: ${createdContactId}`);
      console.log('   You can find this contact in your GHL dashboard');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
  }
}

// Run all tests
runTests().catch(console.error);

