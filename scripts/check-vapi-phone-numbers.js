require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';

async function checkPhoneNumbers() {
  console.log('\n📞 Checking Vapi Phone Numbers Configuration...\n');

  try {
    // Fetch all phone numbers
    const response = await axios.get('https://api.vapi.ai/phone-number', {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const phoneNumbers = response.data;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log('❌ No phone numbers found in your Vapi account');
      return;
    }

    console.log(`✅ Found ${phoneNumbers.length} phone number(s):\n`);

    for (const phone of phoneNumbers) {
      console.log(`📱 Phone: ${phone.number}`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Provider: ${phone.provider || 'Unknown'}`);
      
      if (phone.assistantId) {
        console.log(`   ✅ Assigned to Assistant ID: ${phone.assistantId}`);
        
        // Try to get assistant name
        try {
          const assistantResponse = await axios.get(`https://api.vapi.ai/assistant/${phone.assistantId}`, {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`   📝 Assistant Name: "${assistantResponse.data.name}"`);
        } catch (err) {
          console.log(`   ⚠️  Could not fetch assistant details`);
        }
      } else if (phone.squadId) {
        console.log(`   ✅ Assigned to Squad ID: ${phone.squadId}`);
        
        // Try to get squad name
        try {
          const squadResponse = await axios.get(`https://api.vapi.ai/squad/${phone.squadId}`, {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`   📝 Squad Name: "${squadResponse.data.name}"`);
        } catch (err) {
          console.log(`   ⚠️  Could not fetch squad details`);
        }
      } else {
        console.log(`   ❌ NOT ASSIGNED to any assistant or squad!`);
        console.log(`   ⚠️  This is why the call doesn't connect!`);
      }
      
      console.log('');
    }

    console.log('\n🎯 For INBOUND calls:');
    console.log('   The phone number should be assigned to "Keey Inbound Lead Assistant"');
    console.log('\n📞 For OUTBOUND calls:');
    console.log('   We use the assistantId directly in the API call (already working)');

  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error.response?.data || error.message);
  }
}

checkPhoneNumbers();

