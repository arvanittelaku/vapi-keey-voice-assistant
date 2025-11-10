const axios = require('axios');

const RENDER_URL = 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';

console.log('🧪 Testing Tool Webhook Call...\n');

// Simulate a Vapi function call webhook
const mockVapiToolCall = {
  message: {
    type: 'function-call',
    functionCall: {
      name: 'create_contact',
      parameters: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: `test.${Date.now()}@example.com`, // Unique email each time
        phone: `+4477009${String(Date.now()).slice(-5)}`, // Unique phone each time
        propertyAddress: '456 New Street',
        city: 'London',
        postcode: 'SW1A 2BB',
        bedrooms: '3',
        region: 'London'
      }
    }
  },
  call: {
    id: 'test-call-id-123'
  }
};

async function testToolWebhook() {
  try {
    console.log('📤 Sending mock tool call to:', RENDER_URL);
    console.log('📦 Payload:', JSON.stringify(mockVapiToolCall, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    const response = await axios.post(RENDER_URL, mockVapiToolCall, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Accept any status
    });

    console.log(`✅ Response Status: ${response.status}`);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Webhook is working correctly!');
    } else {
      console.log('\n⚠️  Unexpected status code. Check the response above.');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testToolWebhook();

