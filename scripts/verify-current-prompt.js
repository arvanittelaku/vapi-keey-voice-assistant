const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84';

async function verifyPrompt() {
  try {
    console.log('🔍 Fetching current Main Assistant configuration...\n');

    const response = await axios.get(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const systemMessage = response.data.model.messages.find(m => m.role === 'system');
    const prompt = systemMessage ? systemMessage.content : 'No system message found';

    // Check for key timezone-related phrases
    const checks = {
      'Asks for timezone': prompt.includes('is your property in London or Dubai') || prompt.includes('Are you in London or Dubai'),
      'Has timezone mapping': prompt.includes('Europe/London') && prompt.includes('Asia/Dubai'),
      'Redirects invalid locations': prompt.includes('we currently operate in London and Dubai'),
      'No default timezone': !prompt.includes('default to "Europe/London"') || prompt.includes('NEVER assume'),
      'Variable syntax for outbound': prompt.includes('{{firstName}}') && prompt.includes('{{email}}'),
    };

    console.log('✅ VERIFICATION RESULTS:\n');
    Object.keys(checks).forEach(check => {
      console.log(`   ${checks[check] ? '✅' : '❌'} ${check}`);
    });

    console.log('\n📋 RELEVANT SECTIONS:\n');
    
    // Extract booking flow section
    const bookingFlowMatch = prompt.match(/Booking flow:[\s\S]*?(?=\n\n[A-Z])/);
    if (bookingFlowMatch) {
      console.log('=== BOOKING FLOW ===');
      console.log(bookingFlowMatch[0].substring(0, 800));
      console.log('...\n');
    }

    // Extract timezone mapping section
    const timezoneMatch = prompt.match(/TIMEZONE MAPPING:[\s\S]*?(?=\n\n[A-Z])/);
    if (timezoneMatch) {
      console.log('=== TIMEZONE MAPPING ===');
      console.log(timezoneMatch[0]);
      console.log('\n');
    }

    // Check if all verifications passed
    const allPassed = Object.values(checks).every(v => v === true);
    
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED! The assistant is correctly configured.\n');
      console.log('🧪 NEXT STEP: Test with a real call to confirm behavior.');
    } else {
      console.log('⚠️  SOME CHECKS FAILED! The configuration may need adjustment.');
    }

  } catch (error) {
    console.error('❌ Error fetching assistant:', error.response?.data || error.message);
  }
}

verifyPrompt();

