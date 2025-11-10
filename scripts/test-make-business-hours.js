const axios = require('axios');

// Your Make.com webhook URL
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/7199zpwa3bzxpoyar1um5wv60ymx0nzt';

// Simulate Twilio call data during BUSINESS HOURS
// Make.com will check the CURRENT time, so we just send the call data
const mockTwilioCallData = {
  CallSid: 'CAtest' + Math.random().toString(36).substr(2, 30),
  AccountSid: 'ACtest0000000000test0000000000test',
  From: '+447700900888', // Different fake UK customer number
  To: '+447402769361',   // Your Twilio number
  CallStatus: 'ringing',
  ApiVersion: '2010-04-01',
  Direction: 'inbound',
  ForwardedFrom: '',
  CallerName: 'Business Hours Test Customer'
};

async function testBusinessHours() {
  const now = new Date();
  const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const hours = ukTime.getHours();
  const minutes = ukTime.getMinutes();
  const dayOfWeek = ukTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  
  console.log('🧪 Testing Make.com Webhook - BUSINESS HOURS Simulation\n');
  console.log('='.repeat(60));
  console.log('⏰ Current UK Time:', ukTime.toLocaleString('en-GB', { 
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));
  
  // Check if we're actually in business hours
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
  const isBusinessHours = isWeekday && 
    ((hours === 10 && minutes >= 0) || (hours > 10 && hours < 18) || (hours === 18 && minutes < 30));
  
  if (isBusinessHours) {
    console.log('✅ You ARE currently in BUSINESS HOURS (Mon-Fri 10:00-18:30)');
    console.log('📞 Expected Result: Call should be forwarded to +447426923358');
  } else {
    console.log('⚠️  You are NOT currently in business hours');
    console.log('📞 Expected Result: Call should go to AI Assistant (off-hours)');
    if (!isWeekday) {
      console.log('   Reason: Today is Weekend');
    } else if (hours < 10 || (hours === 10 && minutes < 0)) {
      console.log('   Reason: Too early (before 10:00 AM)');
    } else {
      console.log('   Reason: Too late (after 6:30 PM)');
    }
  }
  
  console.log('='.repeat(60));
  console.log('\n📍 Webhook URL:', MAKE_WEBHOOK_URL);
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
        validateStatus: () => true
      }
    );

    console.log('\n✅ Response received from Make.com!');
    console.log('📊 Status Code:', response.status);
    console.log('📥 Response Data:\n', response.data);
    
    // Analyze the response
    const responseStr = String(response.data);
    
    if (responseStr.includes('<Dial>') && responseStr.includes('+447426923358')) {
      console.log('\n🎉 SUCCESS! Call routed to EMPLOYEE (+447426923358)');
      console.log('✅ This is the BUSINESS HOURS path - Working correctly!');
    } else if (responseStr.includes('AI assistant') || responseStr.includes('call you back')) {
      console.log('\n🤖 Call routed to AI ASSISTANT (off-hours path)');
      console.log('✅ This is the OFF-HOURS path - Working correctly!');
    } else {
      console.log('\n⚠️  Unexpected response format');
    }

  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📥 Response:', error.response.data);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Check Make.com History:');
  console.log('1. Go to Make.com → Click "History" (bottom left)');
  console.log('2. Find this test execution');
  console.log('3. Verify which path was taken (Business Hours or Off Hours)');
  console.log('='.repeat(60));
  
  console.log('\n💡 To test the OTHER scenario:');
  if (isBusinessHours) {
    console.log('   - Run this test AFTER 6:30 PM or on weekend');
    console.log('   - Use: npm run test-make (for off-hours)');
  } else {
    console.log('   - Run this test between 10:00 AM - 6:30 PM on a weekday');
    console.log('   - Current time is off-hours, so you\'ll see AI assistant path');
  }
  console.log('='.repeat(60));
}

// Run the test
testBusinessHours();

