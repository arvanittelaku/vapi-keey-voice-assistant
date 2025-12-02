const axios = require('axios');

const RENDER_BASE_URL = 'https://vapi-keey-voice-assistant.onrender.com';

console.log('🧪 Testing Render Deployment...\n');
console.log('='.repeat(60));

async function testEndpoints() {
  const tests = [
    {
      name: 'Health Check',
      url: `${RENDER_BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Test Direct Route',
      url: `${RENDER_BASE_URL}/test-direct`,
      method: 'GET'
    },
    {
      name: 'Test After Route',
      url: `${RENDER_BASE_URL}/test-after`,
      method: 'GET'
    },
    {
      name: 'Vapi Webhook (should return 400 without proper payload)',
      url: `${RENDER_BASE_URL}/webhook/vapi`,
      method: 'POST',
      data: {},
      expectError: true
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        data: test.data || undefined,
        validateStatus: () => true // Accept any status code
      });

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Response:`, JSON.stringify(response.data, null, 2));
      
      if (test.expectError && response.status >= 400) {
        console.log(`   ✓ Expected error received (this is correct)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Endpoint testing complete!\n');
  console.log('Next steps:');
  console.log('1. All endpoints should be responding');
  console.log('2. Test with a real phone call to your Vapi number');
  console.log('3. Check Render logs for incoming webhook events\n');
}

testEndpoints().catch(console.error);

