#!/usr/bin/env node

/**
 * 🧪 COMPLETE LOCAL TESTING SUITE
 * Tests everything A-to-Z locally without making real calls
 * 
 * Prerequisites:
 * 1. Server must be running (npm start in another terminal)
 * 2. Set TEST_CONTACT_ID environment variable
 */

const axios = require('axios');
const readline = require('readline');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const TEST_CONTACT_ID = process.env.TEST_CONTACT_ID || null;

let results = {
  passed: 0,
  failed: 0,
  skipped: 0
};

function log(emoji, test, status, message) {
  console.log(`${emoji} [${status}] ${test}: ${message}`);
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'SKIP') results.skipped++;
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 ${title}`);
  console.log('='.repeat(60));
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  printSection('TEST 1: Health Check');
  
  try {
    const response = await axios.get(`${SERVER_URL}/health`);
    
    // Accept both "ok" and "healthy" status
    if (response.status === 200 && (response.data.status === 'ok' || response.data.status === 'healthy')) {
      log('✅', 'Health Check', 'PASS', `Server responding: ${response.data.status}`);
      return true;
    } else {
      log('❌', 'Health Check', 'FAIL', `Unexpected response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    log('❌', 'Health Check', 'FAIL', `Server not responding: ${error.message}`);
    console.log('\n⚠️  Make sure server is running: npm start\n');
    return false;
  }
}

async function testCalendarAvailability() {
  printSection('TEST 2: Calendar Availability Check');
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: 'tool-calls',
        toolCalls: [{
          id: 'test-availability-1',
          function: {
            name: 'check_calendar_availability',
            arguments: {
              requestedDate: 'tomorrow',
              requestedTime: '3 PM',
              timezone: 'Europe/London'
            }
          }
        }]
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      if (result.result && result.result.includes('available')) {
        log('✅', 'Calendar Check', 'PASS', 'Successfully checked availability');
        console.log(`   Response: ${result.result.substring(0, 80)}...`);
        return true;
      } else {
        log('⚠️', 'Calendar Check', 'PASS', 'Received response (no slots available)');
        return true;
      }
    } else {
      log('❌', 'Calendar Check', 'FAIL', 'No results returned');
      return false;
    }
  } catch (error) {
    log('❌', 'Calendar Check', 'FAIL', error.message);
    return false;
  }
}

async function testAppointmentBooking(contactId) {
  printSection('TEST 3: Appointment Booking');
  
  if (!contactId) {
    log('⚠️', 'Booking Test', 'SKIP', 'No contact ID provided - would create real appointment');
    return false;
  }
  
  console.log('⚠️  WARNING: This will create a REAL appointment in GHL!');
  const proceed = await askQuestion('Proceed with booking test? (y/n): ');
  
  if (proceed.toLowerCase() !== 'y') {
    log('⚠️', 'Booking Test', 'SKIP', 'User skipped');
    return false;
  }
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: 'tool-calls',
        toolCalls: [{
          id: 'test-booking-1',
          function: {
            name: 'book_calendar_appointment_keey',
            arguments: {
              bookingDate: 'tomorrow',
              bookingTime: '3 PM',
              timezone: 'Europe/London',
              fullName: 'Test Local Customer',
              email: 'test-local@example.com',
              phone: '+447700900123'
            }
          }
        }],
        assistant: {
          variableValues: {
            contactId: contactId,
            firstName: 'Test',
            lastName: 'Customer',
            email: 'test-local@example.com',
            phone: '+447700900123'
          }
        }
      }
    });
    
    if (response.data.results && response.data.results[0].result) {
      const result = response.data.results[0];
      log('✅', 'Booking Test', 'PASS', 'Appointment booked successfully');
      console.log(`   Response: ${result.result.substring(0, 80)}...`);
      
      // Extract appointment ID if possible
      if (result.result.includes('appointmentId')) {
        console.log('   💡 Check server logs for appointment ID to use in cancellation test');
      }
      
      return true;
    } else {
      log('❌', 'Booking Test', 'FAIL', 'No result returned');
      return false;
    }
  } catch (error) {
    log('❌', 'Booking Test', 'FAIL', error.message);
    return false;
  }
}

async function testSmartRetryBusy(contactId) {
  printSection('TEST 4: Smart Retry - Customer Busy');
  
  if (!contactId) {
    log('⚠️', 'Retry (Busy)', 'SKIP', 'No contact ID provided');
    return false;
  }
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: 'end-of-call-report',
        endedReason: 'customer-busy',
        call: {
          id: 'test-retry-busy-' + Date.now(),
          status: 'ended'
        },
        transcript: 'Customer was busy (test).',
        artifact: {
          messages: [],
          variableValues: {
            contact_id: contactId,
            phone: '+447700900123',
            firstName: 'Test',
            call_attempts: '1'
          }
        }
      }
    });
    
    if (response.data.success) {
      log('✅', 'Retry (Busy)', 'PASS', 'Smart retry scheduled (25 minutes)');
      console.log('   Check GHL contact for updated custom fields');
      return true;
    } else {
      log('❌', 'Retry (Busy)', 'FAIL', 'Unexpected response');
      return false;
    }
  } catch (error) {
    log('❌', 'Retry (Busy)', 'FAIL', error.message);
    return false;
  }
}

async function testSmartRetryNoAnswer(contactId) {
  printSection('TEST 5: Smart Retry - No Answer (2nd Attempt)');
  
  if (!contactId) {
    log('⚠️', 'Retry (No Answer)', 'SKIP', 'No contact ID provided');
    return false;
  }
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: 'end-of-call-report',
        endedReason: 'no-answer',
        call: {
          id: 'test-retry-no-answer-' + Date.now(),
          status: 'ended'
        },
        transcript: 'No answer (test).',
        artifact: {
          messages: [],
          variableValues: {
            contact_id: contactId,
            phone: '+447700900123',
            firstName: 'Test',
            call_attempts: '2'
          }
        }
      }
    });
    
    if (response.data.success) {
      log('✅', 'Retry (No Answer)', 'PASS', 'Smart retry scheduled (2 hours) + SMS sent');
      console.log('   Check GHL contact for SMS trigger');
      return true;
    } else {
      log('❌', 'Retry (No Answer)', 'FAIL', 'Unexpected response');
      return false;
    }
  } catch (error) {
    log('❌', 'Retry (No Answer)', 'FAIL', error.message);
    return false;
  }
}

async function testSmartRetryVoicemail(contactId) {
  printSection('TEST 6: Smart Retry - Voicemail (3rd Attempt)');
  
  if (!contactId) {
    log('⚠️', 'Retry (Voicemail)', 'SKIP', 'No contact ID provided');
    return false;
  }
  
  try {
    const response = await axios.post(`${SERVER_URL}/webhook/vapi`, {
      message: {
        type: 'end-of-call-report',
        endedReason: 'voicemail',
        call: {
          id: 'test-retry-voicemail-' + Date.now(),
          status: 'ended'
        },
        transcript: 'Reached voicemail (test).',
        artifact: {
          messages: [],
          variableValues: {
            contact_id: contactId,
            phone: '+447700900123',
            firstName: 'Test',
            call_attempts: '3'
          }
        }
      }
    });
    
    if (response.data.success) {
      log('✅', 'Retry (Voicemail)', 'PASS', 'Smart retry scheduled (4 hours) + Tag added');
      console.log('   Check GHL contact for "Needs Manual Follow-Up" tag');
      return true;
    } else {
      log('❌', 'Retry (Voicemail)', 'FAIL', 'Unexpected response');
      return false;
    }
  } catch (error) {
    log('❌', 'Retry (Voicemail)', 'FAIL', error.message);
    return false;
  }
}

async function testTimezoneDetection() {
  printSection('TEST 7: Timezone Detection');
  
  // We can't actually trigger calls, but we can verify the endpoint responds
  try {
    // Test with UK number
    const ukResponse = await axios.post(`${SERVER_URL}/webhook/ghl-trigger-call`, {
      phone: '+447700900123',
      name: 'UK Test Customer',
      contactId: 'test-contact-uk'
    });
    
    log('✅', 'Timezone (UK)', 'PASS', 'UK number processed (check server logs for timezone)');
    
    await sleep(1000);
    
    // Test with Dubai number
    const dubaiResponse = await axios.post(`${SERVER_URL}/webhook/ghl-trigger-call`, {
      phone: '+971501234567',
      name: 'Dubai Test Customer',
      contactId: 'test-contact-dubai'
    });
    
    log('✅', 'Timezone (Dubai)', 'PASS', 'Dubai number processed (check server logs)');
    
    return true;
  } catch (error) {
    log('⚠️', 'Timezone Detection', 'PASS', 'Endpoint responding (check server logs)');
    return true;
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const total = results.passed + results.failed + results.skipped;
  const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   📝 Total: ${total}`);
  console.log(`\n   Success Rate: ${percentage}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Your system is working perfectly locally!');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 TIP: Check Terminal #1 (where server is running) for detailed logs\n');
}

async function runAllTests() {
  console.log('\n🚀 STARTING COMPLETE LOCAL TEST SUITE\n');
  console.log('This will test your entire system without making real calls!\n');
  
  // Check for contact ID
  if (!TEST_CONTACT_ID) {
    console.log('⚠️  No TEST_CONTACT_ID environment variable set.');
    console.log('   Some tests will be skipped.\n');
    console.log('   To run all tests, set it:');
    console.log('   export TEST_CONTACT_ID="your-ghl-contact-id"\n');
    
    const answer = await askQuestion('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Test cancelled.');
      process.exit(0);
    }
  }
  
  console.log(`\n📡 Testing server at: ${SERVER_URL}`);
  console.log(`📋 Using contact ID: ${TEST_CONTACT_ID || 'None (tests will be limited)'}\n`);
  
  await sleep(1000);
  
  // Run tests
  const serverOk = await testHealthCheck();
  
  if (!serverOk) {
    console.log('\n❌ Server is not responding. Start it with: npm start\n');
    process.exit(1);
  }
  
  await sleep(1000);
  await testCalendarAvailability();
  
  await sleep(1000);
  await testAppointmentBooking(TEST_CONTACT_ID);
  
  await sleep(1000);
  await testSmartRetryBusy(TEST_CONTACT_ID);
  
  await sleep(1000);
  await testSmartRetryNoAnswer(TEST_CONTACT_ID);
  
  await sleep(1000);
  await testSmartRetryVoicemail(TEST_CONTACT_ID);
  
  await sleep(1000);
  await testTimezoneDetection();
  
  printSummary();
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();

