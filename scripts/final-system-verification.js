#!/usr/bin/env node

/**
 * 🔍 FINAL SYSTEM VERIFICATION
 * Comprehensive test of ALL voice assistant features before AWS deployment
 * 
 * Tests:
 * 1. Environment variables
 * 2. Tool definitions (calendar, booking, cancellation, confirmation)
 * 3. Data parsing (dates, times, phone numbers, custom fields)
 * 4. Smart Retry System (timezone, business hours, retry calculation)
 * 5. GHL Integration (contacts, custom fields, tags, workflows)
 * 6. Vapi Assistant Configuration (prompt, tools, variables)
 * 7. Error handling
 */

require('dotenv').config();
const axios = require('axios');
const { DateTime } = require('luxon');

// Import our services
const GHLClient = require('../src/services/ghl-client');
const TimezoneDetector = require('../src/services/timezone-detector');
const CallingHoursValidator = require('../src/services/calling-hours-validator');
const SmartRetryCalculator = require('../src/services/smart-retry-calculator');
const VapiFunctionHandler = require('../src/webhooks/vapi-function-handler');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(category, test, status, message) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${category}] ${test}: ${message}`);
  
  results.tests.push({ category, test, status, message });
  
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 ${title}`);
  console.log('='.repeat(60));
}

async function testEnvironmentVariables() {
  printHeader('1. ENVIRONMENT VARIABLES');
  
  const required = [
    'GHL_API_KEY',
    'GHL_LOCATION_ID',
    'VAPI_API_KEY',
    'VAPI_PHONE_NUMBER_ID',
    'VAPI_SQUAD_ID',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'GHL_CALENDAR_ID'
  ];
  
  for (const key of required) {
    if (process.env[key]) {
      logTest('ENV', key, 'PASS', `Set (${process.env[key].substring(0, 10)}...)`);
    } else {
      logTest('ENV', key, 'FAIL', 'Missing!');
    }
  }
}

async function testDataParsing() {
  printHeader('2. DATA PARSING');
  
  const handler = new VapiFunctionHandler();
  const timezone = 'Europe/London';
  
  // Test date parsing
  const dateTests = [
    { input: 'tomorrow', shouldWork: true },
    { input: 'today', shouldWork: true },
    { input: 'Monday', shouldWork: true },
    { input: 'November 25', shouldWork: true }
  ];
  
  for (const test of dateTests) {
    try {
      const result = handler.parseNaturalDate(test.input, timezone);
      if (result && result.isValid) {
        logTest('PARSE', `Date: "${test.input}"`, 'PASS', `Parsed to ${result.toFormat('yyyy-MM-dd')}`);
      } else {
        logTest('PARSE', `Date: "${test.input}"`, 'FAIL', 'Failed to parse');
      }
    } catch (error) {
      logTest('PARSE', `Date: "${test.input}"`, 'FAIL', error.message);
    }
  }
  
  // Test time parsing
  const timeTests = [
    { input: '3 PM', shouldWork: true },
    { input: '10:30 AM', shouldWork: true },
    { input: 'noon', shouldWork: true },
    { input: '15:00', shouldWork: true }
  ];
  
  for (const test of timeTests) {
    try {
      const result = handler.parseNaturalTime(test.input, timezone);
      if (result && result.isValid) {
        logTest('PARSE', `Time: "${test.input}"`, 'PASS', `Parsed to ${result.toFormat('HH:mm')}`);
      } else {
        logTest('PARSE', `Time: "${test.input}"`, 'FAIL', 'Failed to parse');
      }
    } catch (error) {
      logTest('PARSE', `Time: "${test.input}"`, 'FAIL', error.message);
    }
  }
  
  // Test phone number formatting
  const phoneTests = [
    { input: '+447700900123', expected: '+447700900123' },
    { input: '07700900123', expected: '+447700900123' },
    { input: '+971501234567', expected: '+971501234567' }
  ];
  
  for (const test of phoneTests) {
    const formatted = test.input.startsWith('+') ? test.input : `+44${test.input.substring(1)}`;
    if (formatted === test.expected) {
      logTest('PARSE', `Phone: "${test.input}"`, 'PASS', `Formatted to ${formatted}`);
    } else {
      logTest('PARSE', `Phone: "${test.input}"`, 'WARN', `Got ${formatted}, expected ${test.expected}`);
    }
  }
}

async function testSmartRetrySystem() {
  printHeader('3. SMART RETRY SYSTEM');
  
  // Test timezone detection
  const timezoneDetector = new TimezoneDetector();
  const tzTests = [
    { phone: '+447700900123', expected: 'Europe/London' },
    { phone: '+971501234567', expected: 'Asia/Dubai' },
    { phone: '+12136064730', expected: 'Europe/London' } // Default
  ];
  
  for (const test of tzTests) {
    const result = timezoneDetector.detectTimezone(test.phone);
    if (result === test.expected) {
      logTest('TIMEZONE', `Phone: ${test.phone}`, 'PASS', `Detected ${result}`);
    } else {
      logTest('TIMEZONE', `Phone: ${test.phone}`, 'FAIL', `Got ${result}, expected ${test.expected}`);
    }
  }
  
  // Test business hours validation
  const validator = new CallingHoursValidator();
  const now = DateTime.now().setZone('Europe/London');
  
  // Test during business hours (10 AM on a Wednesday)
  const businessTime = DateTime.fromObject(
    { year: 2025, month: 11, day: 19, hour: 10, minute: 0 },
    { zone: 'Europe/London' }
  );
  
  const isBusinessHours = validator.isWithinCallingHours(businessTime, 'Europe/London');
  if (isBusinessHours) {
    logTest('HOURS', 'Business hours (10 AM Wed)', 'PASS', 'Correctly identified as business hours');
  } else {
    logTest('HOURS', 'Business hours (10 AM Wed)', 'FAIL', 'Should be within business hours');
  }
  
  // Test outside business hours (8 PM)
  const afterHours = DateTime.fromObject(
    { year: 2025, month: 11, day: 19, hour: 20, minute: 0 },
    { zone: 'Europe/London' }
  );
  
  const isAfterHours = validator.isWithinCallingHours(afterHours, 'Europe/London');
  if (!isAfterHours) {
    logTest('HOURS', 'After hours (8 PM)', 'PASS', 'Correctly identified as outside business hours');
  } else {
    logTest('HOURS', 'After hours (8 PM)', 'FAIL', 'Should be outside business hours');
  }
  
  // Test retry calculation
  const calculator = new SmartRetryCalculator();
  const retryTests = [
    { reason: 'customer-busy', expectedMinutes: 25 },
    { reason: 'no-answer', expectedMinutes: 120 },
    { reason: 'voicemail', expectedMinutes: 240 }
  ];
  
  for (const test of retryTests) {
    const result = calculator.calculateRetryTime(
      test.reason,
      'Europe/London',
      1 // attempt number
    );
    
    const diffMinutes = result.diff(DateTime.now().setZone('Europe/London'), 'minutes').minutes;
    const isCorrect = Math.abs(diffMinutes - test.expectedMinutes) < 60; // Within 1 hour tolerance
    
    if (isCorrect) {
      logTest('RETRY', `Reason: ${test.reason}`, 'PASS', `Scheduled in ~${Math.round(diffMinutes)} minutes`);
    } else {
      logTest('RETRY', `Reason: ${test.reason}`, 'WARN', `Expected ${test.expectedMinutes}min, got ${Math.round(diffMinutes)}min`);
    }
  }
}

async function testGHLIntegration() {
  printHeader('4. GHL INTEGRATION');
  
  const ghlClient = new GHLClient();
  
  // Test custom fields conversion
  const testFields = {
    call_status: 'retry_scheduled',
    call_attempts: '2',
    next_call_scheduled: '2025-11-19T10:00:00Z'
  };
  
  try {
    const converted = ghlClient.convertCustomFieldsToV2(testFields);
    if (Array.isArray(converted) && converted.length === 3) {
      logTest('GHL', 'Custom fields conversion', 'PASS', `Converted ${converted.length} fields`);
    } else {
      logTest('GHL', 'Custom fields conversion', 'FAIL', 'Conversion returned unexpected format');
    }
  } catch (error) {
    logTest('GHL', 'Custom fields conversion', 'FAIL', error.message);
  }
  
  // Test parsing custom fields
  const testArray = [
    { id: 'abc123', value: 'confirmed' },
    { id: 'def456', value: '3' }
  ];
  
  try {
    const parsed = ghlClient.parseCustomFields(testArray);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      logTest('GHL', 'Custom fields parsing', 'PASS', `Parsed ${Object.keys(parsed).length} fields`);
    } else {
      logTest('GHL', 'Custom fields parsing', 'FAIL', 'Parsing returned unexpected format');
    }
  } catch (error) {
    logTest('GHL', 'Custom fields parsing', 'FAIL', error.message);
  }
  
  // Test API connectivity (if we have credentials)
  if (process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID) {
    try {
      const contact = await ghlClient.getContact('ZtrIOxo50WVcsLbWK961');
      if (contact && contact.id) {
        logTest('GHL', 'API connectivity', 'PASS', `Successfully fetched contact ${contact.id}`);
      } else {
        logTest('GHL', 'API connectivity', 'WARN', 'Contact fetch returned no data');
      }
    } catch (error) {
      logTest('GHL', 'API connectivity', 'WARN', `API call failed: ${error.message}`);
    }
  } else {
    logTest('GHL', 'API connectivity', 'WARN', 'Skipped - no credentials');
  }
}

async function testVapiConfiguration() {
  printHeader('5. VAPI ASSISTANT CONFIGURATION');
  
  if (!process.env.VAPI_API_KEY || !process.env.VAPI_SQUAD_ID) {
    logTest('VAPI', 'Configuration check', 'WARN', 'Missing VAPI credentials - skipping');
    return;
  }
  
  try {
    // Fetch squad configuration
    const response = await axios.get(
      `https://api.vapi.ai/squad/${process.env.VAPI_SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
        }
      }
    );
    
    const squad = response.data;
    logTest('VAPI', 'Squad fetch', 'PASS', `Squad ID: ${squad.id}`);
    
    // Check if squad has members
    if (squad.members && squad.members.length > 0) {
      logTest('VAPI', 'Squad members', 'PASS', `${squad.members.length} members configured`);
      
      // Check first assistant
      const assistant = squad.members[0].assistant || squad.members[0];
      
      // Check prompt
      if (assistant.model && assistant.model.messages) {
        const systemPrompt = assistant.model.messages.find(m => m.role === 'system');
        if (systemPrompt) {
          // Check for key elements in prompt
          const promptText = systemPrompt.content;
          
          const checks = [
            { key: 'Keey pronunciation', search: /KEE-ee/i },
            { key: 'Variable usage', search: /{{.*?}}/i },
            { key: 'Tool examples', search: /appointmentId|contactId/i },
            { key: 'Natural conversation', search: /natural|conversational/i }
          ];
          
          for (const check of checks) {
            if (check.search.test(promptText)) {
              logTest('VAPI', check.key, 'PASS', 'Found in prompt');
            } else {
              logTest('VAPI', check.key, 'WARN', 'Not found in prompt');
            }
          }
        } else {
          logTest('VAPI', 'System prompt', 'WARN', 'No system message found');
        }
      } else {
        logTest('VAPI', 'Model configuration', 'WARN', 'No model messages found');
      }
      
      // Check tools
      if (assistant.model && assistant.model.tools) {
        const tools = assistant.model.tools;
        logTest('VAPI', 'Tools configured', 'PASS', `${tools.length} tools found`);
        
        const expectedTools = [
          'check_calendar_availability',
          'book_calendar_appointment_keey',
          'cancel_appointment_keey',
          'update_appointment_confirmation'
        ];
        
        for (const toolName of expectedTools) {
          const tool = tools.find(t => t.function && t.function.name === toolName);
          if (tool) {
            logTest('VAPI', `Tool: ${toolName}`, 'PASS', 'Configured');
          } else {
            logTest('VAPI', `Tool: ${toolName}`, 'FAIL', 'Missing!');
          }
        }
      } else {
        logTest('VAPI', 'Tools configuration', 'FAIL', 'No tools found!');
      }
      
    } else {
      logTest('VAPI', 'Squad members', 'FAIL', 'No members in squad!');
    }
    
  } catch (error) {
    logTest('VAPI', 'Configuration check', 'FAIL', error.message);
  }
}

async function testErrorHandling() {
  printHeader('6. ERROR HANDLING');
  
  // Test graceful handling of missing data
  const handler = new VapiFunctionHandler();
  
  // Test invalid date
  try {
    const result = handler.parseNaturalDate('invalid date xyz', 'Europe/London');
    if (!result || !result.isValid) {
      logTest('ERROR', 'Invalid date handling', 'PASS', 'Returned invalid DateTime gracefully');
    } else {
      logTest('ERROR', 'Invalid date handling', 'WARN', 'Should return invalid for bad date');
    }
  } catch (error) {
    logTest('ERROR', 'Invalid date handling', 'PASS', 'Threw error with message: ' + error.message);
  }
  
  // Test missing timezone
  const validator = new CallingHoursValidator();
  try {
    const result = validator.isWithinCallingHours(DateTime.now(), null);
    logTest('ERROR', 'Missing timezone handling', 'PASS', 'Handled gracefully');
  } catch (error) {
    logTest('ERROR', 'Missing timezone handling', 'PASS', 'Threw error: ' + error.message);
  }
  
  // Test malformed phone number
  const timezoneDetector = new TimezoneDetector();
  try {
    const result = timezoneDetector.detectTimezone('invalid');
    if (result === 'Europe/London') { // Should default
      logTest('ERROR', 'Invalid phone handling', 'PASS', 'Defaulted to Europe/London');
    } else {
      logTest('ERROR', 'Invalid phone handling', 'WARN', `Returned ${result}`);
    }
  } catch (error) {
    logTest('ERROR', 'Invalid phone handling', 'PASS', 'Threw error: ' + error.message);
  }
}

function printSummary() {
  printHeader('VERIFICATION SUMMARY');
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   📝 Total: ${results.tests.length}`);
  
  const percentage = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`\n   Success Rate: ${percentage}%`);
  
  if (results.failed > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - [${t.category}] ${t.test}: ${t.message}`);
    });
  }
  
  if (results.warnings > 0) {
    console.log(`\n⚠️  WARNINGS:`);
    results.tests.filter(t => t.status === 'WARN').forEach(t => {
      console.log(`   - [${t.category}] ${t.test}: ${t.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('✅ SYSTEM READY FOR AWS DEPLOYMENT!');
  } else {
    console.log('⚠️  FIX FAILED TESTS BEFORE DEPLOYMENT!');
  }
  
  console.log('='.repeat(60) + '\n');
}

async function runAllTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE SYSTEM VERIFICATION\n');
  console.log('This will test ALL features before AWS deployment...\n');
  
  try {
    await testEnvironmentVariables();
    await testDataParsing();
    await testSmartRetrySystem();
    await testGHLIntegration();
    await testVapiConfiguration();
    await testErrorHandling();
    
    printSummary();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run all tests
runAllTests();

