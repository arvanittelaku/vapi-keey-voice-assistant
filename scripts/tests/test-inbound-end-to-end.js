#!/usr/bin/env node

/**
 * END-TO-END TEST for Simplified Inbound Assistant
 * 
 * This script simulates what Vapi will send to our webhook
 * and verifies the entire flow works correctly
 */

require('dotenv').config();
const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

console.log('\n🧪 ===== END-TO-END TEST: SIMPLIFIED INBOUND =====\n');

// Test data - simulating what Vapi will send
const testCases = [
  {
    name: 'Test 1: All 3 fields provided',
    payload: {
      message: {
        type: 'function-call',
        functionCall: {
          name: 'contact_create_keey',
          parameters: {
            email: 'john.smith@example.com',
            phone: '+447700900123',
            postcode: 'SW1A 1AA'
          }
        }
      }
    },
    expected: 'success'
  },
  {
    name: 'Test 2: Only email and phone (no postal code)',
    payload: {
      message: {
        type: 'function-call',
        functionCall: {
          name: 'contact_create_keey',
          parameters: {
            email: 'jane.doe@example.com',
            phone: '+447700900456'
          }
        }
      }
    },
    expected: 'success'
  },
  {
    name: 'Test 3: Missing email (should fail gracefully)',
    payload: {
      message: {
        type: 'function-call',
        functionCall: {
          name: 'contact_create_keey',
          parameters: {
            phone: '+447700900789',
            postcode: 'E1 6AN'
          }
        }
      }
    },
    expected: 'error'
  },
  {
    name: 'Test 4: Using postalCode instead of postcode',
    payload: {
      message: {
        type: 'function-call',
        functionCall: {
          name: 'contact_create_keey',
          parameters: {
            email: 'test@example.com',
            phone: '+447700900999',
            postalCode: 'M1 1AE' // Different spelling
          }
        }
      }
    },
    expected: 'success'
  }
];

async function runTest(testCase, index) {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('   Parameters:', JSON.stringify(testCase.payload.message.functionCall.parameters, null, 2));
  
  try {
    const response = await axios.post(
      `${WEBHOOK_URL}/webhook/vapi`,
      testCase.payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(WEBHOOK_SECRET && { 'Authorization': `Bearer ${WEBHOOK_SECRET}` })
        },
        timeout: 10000
      }
    );

    const success = response.data.success || response.data.results?.[0]?.result?.success;
    
    if (testCase.expected === 'success' && success) {
      console.log('   ✅ PASS - Contact created successfully');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return { test: testCase.name, status: 'PASS' };
    } else if (testCase.expected === 'error' && !success) {
      console.log('   ✅ PASS - Failed as expected (validation working)');
      return { test: testCase.name, status: 'PASS' };
    } else {
      console.log('   ❌ FAIL - Unexpected result');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return { test: testCase.name, status: 'FAIL' };
    }
    
  } catch (error) {
    if (testCase.expected === 'error') {
      console.log('   ✅ PASS - Error handled correctly');
      return { test: testCase.name, status: 'PASS' };
    } else {
      console.log('   ❌ FAIL - Unexpected error');
      console.log('   Error:', error.response?.data || error.message);
      return { test: testCase.name, status: 'FAIL', error: error.message };
    }
  }
}

async function runAllTests() {
  console.log('Target Webhook:', WEBHOOK_URL);
  console.log('Testing simplified contact creation...\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  
  if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED! The simplified inbound assistant is working correctly.');
    console.log('\n🎯 What was tested:');
    console.log('   ✓ Contact creation with all 3 fields');
    console.log('   ✓ Contact creation with only email + phone');
    console.log('   ✓ Validation for missing required fields');
    console.log('   ✓ Both postcode and postalCode spellings');
    console.log('\n✨ System is ready for production use!');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Review the errors above');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Check if server is running first
async function checkServerHealth() {
  try {
    await axios.get(`${WEBHOOK_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('\n❌ Server is not running or not accessible!');
    console.error(`   URL: ${WEBHOOK_URL}/health`);
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Make sure your server is running:');
    console.error('   npm start\n');
    return false;
  }
}

(async () => {
  const serverUp = await checkServerHealth();
  if (serverUp) {
    await runAllTests();
  } else {
    process.exit(1);
  }
})();

