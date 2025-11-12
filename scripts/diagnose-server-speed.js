const axios = require('axios');

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';

async function testServerResponseTime() {
  console.log('🔍 Testing server response time...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${SERVER_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Tool Call (check availability)',
      url: `${SERVER_URL}/webhook/vapi`,
      method: 'POST',
      data: {
        message: {
          toolCalls: [
            {
              id: "call_TEST_SPEED",
              type: "function",
              function: {
                name: "check_calendar_availability_keey",
                arguments: JSON.stringify({
                  timezone: "Europe/London",
                  requestedDate: "tomorrow",
                  requestedTime: "10 AM"
                })
              }
            }
          ],
          type: "tool-calls"
        },
        call: {
          id: "test-speed-diagnostic"
        }
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n⏱️  Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    const startTime = Date.now();
    
    try {
      const config = {
        method: test.method,
        url: test.url,
        timeout: 25000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Response received in ${duration}ms`);
      console.log(`   Status: ${response.status}`);
      
      if (duration > 5000) {
        console.log(`   ⚠️  WARNING: Response took >5 seconds (Vapi may timeout)`);
      }
      
      if (duration > 10000) {
        console.log(`   🚨 CRITICAL: Response took >10 seconds (Vapi WILL timeout)`);
      }
      
      console.log(`   Response data:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Error after ${duration}ms: ${error.message}`);
      
      if (error.code === 'ECONNABORTED') {
        console.log(`   🚨 Request timed out - server too slow!`);
      }
      
      if (error.response) {
        console.log(`   Response status: ${error.response.status}`);
        console.log(`   Response data:`, error.response.data);
      }
    }
  }
  
  console.log('\n\n📊 DIAGNOSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('If any response took >5 seconds, your server is too slow for Vapi.');
  console.log('Solutions:');
  console.log('1. Upgrade Render to paid plan ($7/month) - RECOMMENDED');
  console.log('2. Use external monitoring (UptimeRobot) to keep server warm');
  console.log('3. Migrate to a faster hosting platform (Railway, Fly.io)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testServerResponseTime();

