require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881'; // +447402769361

async function checkPhoneStatus() {
  console.log('\n📞 Checking Phone Number Status...\n');

  try {
    const response = await axios.get(`https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const phone = response.data;

    console.log('📱 Phone Number: ' + phone.number);
    console.log('   ID: ' + phone.id);
    console.log('   Provider: ' + phone.provider);
    console.log('   Status: ' + phone.status);
    console.log('   Name: ' + phone.name);
    
    if (phone.assistantId) {
      console.log('   ✅ Assigned to Assistant ID: ' + phone.assistantId);
    } else {
      console.log('   ❌ NO ASSISTANT ASSIGNED!');
    }

    if (phone.fallbackDestination) {
      console.log('   📞 Fallback: ' + phone.fallbackDestination.number);
    }

    console.log('\n🔍 Full Configuration:');
    console.log(JSON.stringify(phone, null, 2));

    if (phone.status !== 'active') {
      console.log('\n⚠️  WARNING: Phone number status is not "active"!');
      console.log('   This might be why calls are failing.');
    }

    if (phone.provider === 'twilio') {
      console.log('\n📋 Twilio Configuration:');
      console.log('   Account SID: ' + (phone.twilioAccountSid || 'Not set'));
      console.log('   Phone number should be active in Twilio dashboard');
      console.log('   Verify at: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkPhoneStatus();


