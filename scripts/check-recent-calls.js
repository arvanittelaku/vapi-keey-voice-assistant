require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';

async function checkRecentCalls() {
  console.log('\n📞 Fetching Recent Call Logs...\n');

  try {
    // Fetch recent calls (sorted by creation time)
    const response = await axios.get('https://api.vapi.ai/call', {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      params: {
        limit: 5, // Get last 5 calls
      }
    });

    const calls = response.data;

    if (!calls || calls.length === 0) {
      console.log('❌ No recent calls found');
      return;
    }

    console.log(`✅ Found ${calls.length} recent call(s):\n`);

    for (const call of calls) {
      console.log('=' .repeat(80));
      console.log(`📱 Call ID: ${call.id}`);
      console.log(`   Type: ${call.type || 'Unknown'}`);
      console.log(`   Status: ${call.status || 'Unknown'}`);
      console.log(`   Created: ${new Date(call.createdAt).toLocaleString()}`);
      console.log(`   Duration: ${call.endedReason || 'N/A'}`);
      
      if (call.customer) {
        console.log(`   Customer: ${call.customer.number || 'Unknown'}`);
      }
      
      if (call.phoneNumber) {
        console.log(`   Phone Number: ${call.phoneNumber.number || 'Unknown'}`);
      }
      
      if (call.assistantId) {
        console.log(`   Assistant ID: ${call.assistantId}`);
      }
      
      if (call.endedReason) {
        console.log(`   ⚠️  Ended Reason: ${call.endedReason}`);
      }
      
      if (call.messages && call.messages.length > 0) {
        console.log(`\n   📝 Messages (${call.messages.length}):`);
        call.messages.slice(0, 5).forEach((msg, idx) => {
          console.log(`      ${idx + 1}. [${msg.role}] ${msg.message || msg.content || JSON.stringify(msg).substring(0, 100)}`);
        });
      }
      
      console.log('');
    }

    // Get detailed info for the most recent call
    if (calls.length > 0) {
      const latestCallId = calls[0].id;
      console.log('\n🔍 Fetching detailed info for latest call...\n');
      
      try {
        const detailResponse = await axios.get(`https://api.vapi.ai/call/${latestCallId}`, {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📋 Full Call Details:');
        console.log(JSON.stringify(detailResponse.data, null, 2));
      } catch (err) {
        console.log('⚠️  Could not fetch detailed call info');
      }
    }

  } catch (error) {
    console.error('❌ Error fetching calls:', error.response?.data || error.message);
  }
}

checkRecentCalls();

