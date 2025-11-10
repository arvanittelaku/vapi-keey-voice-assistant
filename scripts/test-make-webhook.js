const axios = require('axios');

// Your Make.com webhook URL
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/7199zpwa3bzxpoyar1um5wv60ymx0nzt';

// Simulate Twilio call data
const mockTwilioCallData = {
  CallSid: 'CAtest' + Math.random().toString(36).substr(2, 30),
  AccountSid: 'ACtest0000000000test0000000000test',
  From: '+447700900999', // Fake UK customer number
  To: '+447402769361',   // Your Twilio number
  CallStatus: 'ringing',
  ApiVersion: '2010-04-01',
  Direction: 'inbound',
  ForwardedFrom: '',
  CallerName: 'Test Customer'
};

async function testMakeWebhook() {
  console.log('🧪 Testing Make.com Webhook...\n');
  console.log('='.repeat(60));
  console.log('📍 Webhook URL:', MAKE_WEBHOOK_URL);
  console.log('📦 Simulated Call Data:', JSON.stringify(mockTwilioCallData, null, 2));
  console.log('='.repeat(60));

  try {
    console.log('\n📤 Sending test call to Make.com...');
    
    const response = await axios.post(
      MAKE_WEBHOOK_URL,
      mockTwilioCallData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Don't throw error on any status code
        validateStatus: () => true
      }
    );

    console.log('\n✅ Response received from Make.com!');
    console.log('📊 Status Code:', response.status);
    console.log('📥 Response Data:', response.data);
    
    if (response.status === 200) {
      console.log('\n🎉 SUCCESS! Make.com received and processed the webhook!');
      console.log('\n📋 Next Steps:');
      console.log('1. Go to Make.com → Click "History" (bottom left)');
      console.log('2. You should see this test call in the history');
      console.log('3. Click on it to see which route it took (Business Hours or Off Hours)');
    } else {
      console.log('\n⚠️  Unexpected status code. Check Make.com scenario settings.');
    }

  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📥 Response:', error.response.data);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
  console.log('\n💡 TIP: Run this script at different times to test routing:');
  console.log('   - During work hours (Mon-Fri 10:00-18:30 UK time)');
  console.log('   - During off hours (evenings/weekends)');
  console.log('='.repeat(60));
}

// Run the test
testMakeWebhook();

