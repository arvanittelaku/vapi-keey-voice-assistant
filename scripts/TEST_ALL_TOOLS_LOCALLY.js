/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEST ALL VAPI TOOLS LOCALLY
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Tests all 5 Vapi function tools by simulating webhook calls:
 * 1. contact_create_keey
 * 2. check_calendar_availability_keey
 * 3. book_calendar_appointment_keey
 * 4. cancel_appointment_keey
 * 5. update_appointment_confirmation
 * 
 * This allows testing tool logic without making real Vapi calls.
 */

require('dotenv').config();
const VapiFunctionHandler = require('../src/webhooks/vapi-function-handler');
const { DateTime } = require('luxon');

// Mock Express app for testing
class MockExpressApp {
  constructor() {
    this.routes = {};
  }

  use(path, handler) {
    console.log(`📝 Registered middleware: ${path || 'global'}`);
  }

  post(path, handler) {
    console.log(`📝 Registered POST: ${path}`);
    this.routes[path] = handler;
  }

  // Simulate a POST request
  async simulatePost(path, body) {
    const handler = this.routes[path];
    if (!handler) {
      throw new Error(`No handler registered for ${path}`);
    }

    const req = {
      method: 'POST',
      path: path,
      body: body,
      headers: {'content-type': 'application/json'}
    };

    const res = {
      statusCode: 200,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    await handler(req, res);
    return { status: res.statusCode, data: res.data };
  }
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details = '') {
  results.total++;
  results.tests.push({ name, status, details });
  
  if (status === 'PASS') {
    results.passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    results.failed++;
    console.log(`❌ [FAIL] ${name}`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
}

async function test_contact_create(app) {
  console.log('\n📝 Testing: contact_create_keey\n');

  const testPayload = {
    message: {
      type: 'function-call',
      functionCall: {
        name: 'contact_create_keey',
        parameters: {
          email: 'test@example.com',
          phone: '+447700900123',
          postcode: 'SW1A 1AA'
        }
      },
      toolCallId: 'test-call-id-1'
    },
    call: { id: 'test-call-123' }
  };

  try {
    const response = await app.simulatePost('/webhook/vapi', testPayload);
    
    if (response.status === 200 && response.data?.results?.[0]?.result) {
      const result = response.data.results[0].result;
      logTest('Tool: contact_create_keey', 'PASS', `Result: ${result.substring(0, 50)}...`);
      return true;
    } else {
      logTest('Tool: contact_create_keey', 'FAIL', `Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Tool: contact_create_keey', 'FAIL', error.message);
    return false;
  }
}

async function test_check_calendar_availability(app) {
  console.log('\n📅 Testing: check_calendar_availability_keey\n');

  const tomorrow = DateTime.now().setZone('Europe/London').plus({ days: 1 });

  const testPayload = {
    message: {
      type: 'function-call',
      functionCall: {
        name: 'check_calendar_availability_keey',
        parameters: {
          requestedDate: tomorrow.toFormat('MMMM dd'), // e.g., "November 27"
          requestedTime: '2 PM',
          timezone: 'Europe/London'
        }
      },
      toolCallId: 'test-call-id-2'
    },
    call: { id: 'test-call-456' }
  };

  try {
    const response = await app.simulatePost('/webhook/vapi', testPayload);
    
    if (response.status === 200 && response.data?.results?.[0]?.result) {
      const result = response.data.results[0].result;
      logTest('Tool: check_calendar_availability_keey', 'PASS', `Found slots: ${result.includes('available')}`);
      return true;
    } else {
      logTest('Tool: check_calendar_availability_keey', 'FAIL', `Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Tool: check_calendar_availability_keey', 'FAIL', error.message);
    return false;
  }
}

async function test_book_calendar_appointment(app) {
  console.log('\n📆 Testing: book_calendar_appointment_keey\n');

  // Note: This will create a REAL appointment in GHL!
  // Use with caution or use a test contact ID
  
  const tomorrow = DateTime.now().setZone('Europe/London').plus({ days: 1 });
  const testContactId = process.env.TEST_CONTACT_ID || 'ZtrIOxo50WVcsLbWK961'; // Your test contact

  const testPayload = {
    message: {
      type: 'function-call',
      functionCall: {
        name: 'book_calendar_appointment_keey',
        parameters: {
          contactId: testContactId,
          bookingDate: tomorrow.toFormat('MMMM dd'), // e.g., "November 27"
          bookingTime: '2 PM',
          timezone: 'Europe/London',
          email: 'test@example.com',
          phone: '+447700900123',
          fullName: 'Test User'
        }
      },
      toolCallId: 'test-call-id-3'
    },
    call: { id: 'test-call-789' }
  };

  try {
    const response = await app.simulatePost('/webhook/vapi', testPayload);
    
    if (response.status === 200 && response.data?.results?.[0]?.result) {
      const result = response.data.results[0].result;
      const success = result.includes('scheduled') || result.includes('booked');
      
      if (success) {
        logTest('Tool: book_calendar_appointment_keey', 'PASS', 'Appointment booked successfully');
        
        // Extract appointment ID if possible
        console.log(`   Full result: ${result}`);
        return true;
      } else {
        logTest('Tool: book_calendar_appointment_keey', 'FAIL', `Booking failed: ${result}`);
        return false;
      }
    } else {
      logTest('Tool: book_calendar_appointment_keey', 'FAIL', `Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Tool: book_calendar_appointment_keey', 'FAIL', error.message);
    return false;
  }
}

async function test_update_appointment_confirmation(app) {
  console.log('\n✅ Testing: update_appointment_confirmation\n');

  const testContactId = process.env.TEST_CONTACT_ID || 'ZtrIOxo50WVcsLbWK961';
  const testAppointmentId = 'test-appointment-123'; // You can use a real appointment ID

  const testPayload = {
    message: {
      type: 'function-call',
      functionCall: {
        name: 'update_appointment_confirmation',
        parameters: {
          contactId: testContactId,
          appointmentId: testAppointmentId,
          status: 'confirmed'
        }
      },
      toolCallId: 'test-call-id-4'
    },
    call: { id: 'test-call-999' }
  };

  try {
    const response = await app.simulatePost('/webhook/vapi', testPayload);
    
    if (response.status === 200 && response.data?.results?.[0]?.result) {
      const result = response.data.results[0].result;
      logTest('Tool: update_appointment_confirmation', 'PASS', `Status updated: ${result.substring(0, 50)}...`);
      return true;
    } else {
      logTest('Tool: update_appointment_confirmation', 'FAIL', `Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Tool: update_appointment_confirmation', 'FAIL', error.message);
    return false;
  }
}

async function test_cancel_appointment(app) {
  console.log('\n🗑️  Testing: cancel_appointment_keey\n');

  const testContactId = process.env.TEST_CONTACT_ID || 'ZtrIOxo50WVcsLbWK961';
  const testAppointmentId = 'test-appointment-123'; // Use a real appointment ID to actually cancel

  const testPayload = {
    message: {
      type: 'function-call',
      functionCall: {
        name: 'cancel_appointment_keey',
        parameters: {
          appointmentId: testAppointmentId,
          contactId: testContactId,
          reason: 'Testing cancellation functionality'
        }
      },
      toolCallId: 'test-call-id-5'
    },
    call: { id: 'test-call-888' }
  };

  try {
    const response = await app.simulatePost('/webhook/vapi', testPayload);
    
    if (response.status === 200 && response.data?.results?.[0]?.result) {
      const result = response.data.results[0].result;
      logTest('Tool: cancel_appointment_keey', 'PASS', `Cancellation result: ${result.substring(0, 50)}...`);
      return true;
    } else {
      logTest('Tool: cancel_appointment_keey', 'FAIL', `Invalid response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Tool: cancel_appointment_keey', 'FAIL', error.message);
    return false;
  }
}

function generateReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TOOL TESTING REPORT');
  console.log('═'.repeat(70) + '\n');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  console.log(`Total Tool Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed} (${passRate}%)`);
  console.log(`❌ Failed: ${results.failed}`);

  console.log('\n' + '-'.repeat(70));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TOOLS WORKING! Ready for deployment!');
  } else {
    console.log(`\n❌ ${results.failed} tool(s) failed!`);
    console.log('🔧 Fix the issues above before deploying.');
    
    console.log('\nFailed tools:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - ${t.name}: ${t.details}`);
    });
  }

  console.log('\n' + '═'.repeat(70) + '\n');

  return results.failed === 0;
}

async function runAllToolTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    KEEY VOICE ASSISTANT                                ║');
  console.log('║                 VAPI TOOLS LOCAL TESTING                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  console.log('⏰ Started:', new Date().toLocaleString());
  console.log('📂 Working Directory:', process.cwd());
  console.log('');

  try {
    // Create mock app and initialize handler
    const mockApp = new MockExpressApp();
    const handler = new VapiFunctionHandler(mockApp);
    
    console.log('\n' + '='.repeat(70));
    console.log('🧪 Running Tool Tests');
    console.log('='.repeat(70));

    // Run all tool tests
    await test_contact_create(mockApp);
    await test_check_calendar_availability(mockApp);
    await test_book_calendar_appointment(mockApp);
    await test_update_appointment_confirmation(mockApp);
    await test_cancel_appointment(mockApp);

    const success = generateReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ FATAL ERROR during tool testing:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runAllToolTests();

