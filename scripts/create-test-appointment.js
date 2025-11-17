require('dotenv').config();
const axios = require('axios');
const { DateTime } = require('luxon');

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'SMEvb6HVyyzvx0EekevW';
const CALENDAR_ID = process.env.GHL_CALENDAR_ID || 'fxuTx3pBbcUUBW2zMhSN'; // Keey calendar ID

// Contact details
const CONTACT_ID = 'ZtrIOxo50WVcsLbWK961'; // Test Receiver contact

async function createTestAppointment() {
  console.log('\n📅 CREATING TEST APPOINTMENT\n');
  console.log('═'.repeat(80));

  try {
    // Create appointment for tomorrow at 10:00 AM (likely to be available)
    const appointmentTime = DateTime.now()
      .setZone('Europe/London')
      .plus({ days: 1 })
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 });

    const startTime = appointmentTime.toISO();

    console.log('\n📋 Appointment Details:\n');
    console.log(`   Contact ID: ${CONTACT_ID}`);
    console.log(`   Calendar ID: ${CALENDAR_ID}`);
    console.log(`   Location ID: ${GHL_LOCATION_ID}`);
    console.log(`   Start Time: ${appointmentTime.toFormat('DDDD @ h:mm a ZZZZ')}`);
    console.log(`   Timezone: Europe/London`);

    // Prepare appointment data (must match GHL API format)
    const appointmentData = {
      calendarId: CALENDAR_ID,
      locationId: GHL_LOCATION_ID,
      contactId: CONTACT_ID,
      startTime: startTime,
      timezone: 'Europe/London',
      title: 'Test Appointment - Confirmation Call Testing',
      appointmentStatus: 'confirmed',
    };

    console.log('\n📤 Sending request to GHL API...\n');

    // Create the appointment (using exact same format as working code)
    const response = await axios.post(
      `https://services.leadconnectorhq.com/calendars/events/appointments`,
      appointmentData,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        timeout: 5000,
      }
    );

    console.log('✅ APPOINTMENT CREATED SUCCESSFULLY!\n');
    console.log('═'.repeat(80));

    const appointment = response.data;
    const appointmentId = appointment.id || appointment.appointmentId || appointment._id;

    console.log('\n📋 APPOINTMENT DETAILS:\n');
    console.log(`   Appointment ID: ${appointmentId}`);
    console.log(`   Contact ID: ${CONTACT_ID}`);
    console.log(`   Start Time: ${appointmentTime.toFormat('DDDD @ h:mm a')}`);
    console.log(`   Status: ${appointment.appointmentStatus || 'confirmed'}`);

    console.log('\n═'.repeat(80));
    console.log('\n✅ READY FOR TESTING!\n');
    console.log('📮 USE THESE VALUES IN POSTMAN:\n');
    console.log('═'.repeat(80));
    console.log('\nMethod: POST');
    console.log('URL: https://vapi-keey-voice-assistant.onrender.com/webhook/ghl-trigger-call\n');
    console.log('Headers:');
    console.log('  Content-Type: application/json\n');
    console.log('Body (raw JSON):');
    console.log(JSON.stringify({
      phone: '+12136064730',
      firstName: 'Test',
      lastName: 'Receiver',
      email: 'john.doe@example.com',
      contactId: CONTACT_ID,
      callType: 'confirmation',
      appointmentTime: appointmentTime.toFormat('EEEE, MMMM dd, yyyy h:mm a'),
      appointmentId: appointmentId,
    }, null, 2));
    console.log('\n═'.repeat(80));

    console.log('\n🎯 WHAT TO DO NEXT:\n');
    console.log('   1. Copy the JSON body above');
    console.log('   2. Paste it into Postman');
    console.log('   3. Send the request');
    console.log('   4. Check Render logs for "Call initiated successfully"');
    console.log('   5. Check Vapi dashboard for new call\n');

    console.log('📊 View appointment in GHL:');
    console.log(`   https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts/detail/${CONTACT_ID}\n`);

  } catch (error) {
    console.error('\n❌ ERROR CREATING APPOINTMENT:\n');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.statusText);
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received from GHL API');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Check your internet connection and API key');
    } else {
      console.error('   Error:', error.message);
    }
    
    console.error('\n📋 Full error object:');
    console.error(JSON.stringify({
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    }, null, 2));

    console.log('\n💡 TROUBLESHOOTING:\n');
    console.log('   - Check GHL_API_KEY is set in .env');
    console.log('   - Verify calendar ID is correct');
    console.log('   - Ensure contact exists in GHL');
    console.log('   - Check GHL API rate limits\n');
    
    process.exit(1);
  }
}

createTestAppointment();

