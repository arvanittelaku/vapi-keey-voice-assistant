/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMPLETE LOCAL AUDIT - Keey Voice Assistant
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * This script performs a comprehensive audit of all components:
 * ✅ Service files
 * ✅ Webhook handlers
 * ✅ Assistant configurations
 * ✅ Tool implementations
 * ✅ Environment variables
 * ✅ API connectivity
 * 
 * Run this script to verify everything is ready for deployment.
 */

require('dotenv').config();
const VapiClient = require('../src/services/vapi-client');
const GHLClient = require('../src/services/ghl-client');
const SMSClient = require('../src/services/sms-client');
const TimezoneDetector = require('../src/services/timezone-detector');
const CallingHoursValidator = require('../src/services/calling-hours-validator');
const SmartRetryCalculator = require('../src/services/smart-retry-calculator');

// Test results collection
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, status, message = '') {
  results.total++;
  results.tests.push({ name, status, message });
  
  if (status === 'PASS') {
    results.passed++;
    console.log(`✅ [PASS] ${name}`);
  } else if (status === 'FAIL') {
    results.failed++;
    console.log(`❌ [FAIL] ${name}`);
  } else if (status === 'WARN') {
    results.warnings++;
    console.log(`⚠️  [WARN] ${name}`);
  }
  
  if (message) {
    console.log(`   ${message}`);
  }
}

async function testEnvironmentVariables() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 SECTION 1: ENVIRONMENT VARIABLES');
  console.log('='.repeat(70) + '\n');

  const requiredVars = [
    'VAPI_API_KEY',
    'GHL_API_KEY',
    'GHL_LOCATION_ID',
    'GHL_CALENDAR_ID',
    'VAPI_PHONE_NUMBER_ID',
    'VAPI_SQUAD_ID',
    'VAPI_INBOUND_ASSISTANT_ID',
    'VAPI_MAIN_ASSISTANT_ID',
    'VAPI_SERVICES_ASSISTANT_ID',
    'VAPI_PRICING_ASSISTANT_ID',
    'VAPI_CONFIRMATION_ASSISTANT_ID'
  ];

  const optionalVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'VAPI_CONFIRMATION_PHONE_NUMBER_ID'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logTest(`Required: ${varName}`, 'PASS', `Value: ${process.env[varName].substring(0, 10)}...`);
    } else {
      logTest(`Required: ${varName}`, 'FAIL', 'Missing! This is required for the system to work.');
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logTest(`Optional: ${varName}`, 'PASS', `Value: ${process.env[varName].substring(0, 10)}...`);
    } else {
      logTest(`Optional: ${varName}`, 'WARN', 'Not set. Some features may not work.');
    }
  }
}

async function testServiceClasses() {
  console.log('\n' + '='.repeat(70));
  console.log('🧩 SECTION 2: SERVICE CLASSES');
  console.log('='.repeat(70) + '\n');

  // Test VapiClient initialization
  try {
    const vapiClient = new VapiClient();
    logTest('VapiClient initialization', 'PASS');
  } catch (error) {
    logTest('VapiClient initialization', 'FAIL', error.message);
  }

  // Test GHLClient initialization
  try {
    const ghlClient = new GHLClient();
    logTest('GHLClient initialization', 'PASS');
  } catch (error) {
    logTest('GHLClient initialization', 'FAIL', error.message);
  }

  // Test SMSClient initialization
  try {
    const smsClient = new SMSClient();
    logTest('SMSClient initialization', 'PASS');
  } catch (error) {
    logTest('SMSClient initialization', 'FAIL', error.message);
  }

  // Test TimezoneDetector
  try {
    const timezone = TimezoneDetector.detectFromPhone('+447700900123');
    if (timezone === 'Europe/London') {
      logTest('TimezoneDetector - UK number', 'PASS', `Detected: ${timezone}`);
    } else {
      logTest('TimezoneDetector - UK number', 'FAIL', `Expected: Europe/London, Got: ${timezone}`);
    }

    const timezoneDubai = TimezoneDetector.detectFromPhone('+971501234567');
    if (timezoneDubai === 'Asia/Dubai') {
      logTest('TimezoneDetector - Dubai number', 'PASS', `Detected: ${timezoneDubai}`);
    } else {
      logTest('TimezoneDetector - Dubai number', 'FAIL', `Expected: Asia/Dubai, Got: ${timezoneDubai}`);
    }
  } catch (error) {
    logTest('TimezoneDetector', 'FAIL', error.message);
  }

  // Test CallingHoursValidator
  try {
    const result = CallingHoursValidator.isWithinCallingHours('Europe/London');
    logTest('CallingHoursValidator - London', 'PASS', `Can call: ${result.canCall}, Reason: ${result.reason}`);
  } catch (error) {
    logTest('CallingHoursValidator - London', 'FAIL', error.message);
  }

  // Test SmartRetryCalculator
  try {
    const retryResult = SmartRetryCalculator.calculateRetryTime(1, 'no-answer', 'Europe/London');
    if (retryResult.nextCallTime) {
      logTest('SmartRetryCalculator', 'PASS', `Next retry: ${retryResult.nextCallTimeFormatted}`);
    } else {
      logTest('SmartRetryCalculator', 'FAIL', 'Did not return nextCallTime');
    }
  } catch (error) {
    logTest('SmartRetryCalculator', 'FAIL', error.message);
  }
}

async function testVapiConnectivity() {
  console.log('\n' + '='.repeat(70));
  console.log('📡 SECTION 3: VAPI API CONNECTIVITY');
  console.log('='.repeat(70) + '\n');

  const vapiClient = new VapiClient();

  // Test getting phone numbers
  try {
    const phoneNumbers = await vapiClient.getPhoneNumbers();
    if (phoneNumbers && phoneNumbers.length > 0) {
      logTest('Vapi - Get Phone Numbers', 'PASS', `Found ${phoneNumbers.length} phone number(s)`);
      console.log(`   Phone numbers: ${phoneNumbers.map(p => p.number || p.id).join(', ')}`);
    } else {
      logTest('Vapi - Get Phone Numbers', 'WARN', 'No phone numbers found');
    }
  } catch (error) {
    logTest('Vapi - Get Phone Numbers', 'FAIL', error.message);
  }

  // Test getting assistants
  const assistantIds = [
    { name: 'Inbound', id: process.env.VAPI_INBOUND_ASSISTANT_ID },
    { name: 'Main', id: process.env.VAPI_MAIN_ASSISTANT_ID },
    { name: 'Services', id: process.env.VAPI_SERVICES_ASSISTANT_ID },
    { name: 'Pricing', id: process.env.VAPI_PRICING_ASSISTANT_ID },
    { name: 'Confirmation', id: process.env.VAPI_CONFIRMATION_ASSISTANT_ID }
  ];

  for (const { name, id } of assistantIds) {
    if (!id) {
      logTest(`Vapi - ${name} Assistant`, 'WARN', 'ID not set in environment');
      continue;
    }

    try {
      const assistant = await vapiClient.getAssistant(id);
      if (assistant && assistant.id) {
        logTest(`Vapi - ${name} Assistant`, 'PASS', `Name: ${assistant.name || 'Unnamed'}`);
      } else {
        logTest(`Vapi - ${name} Assistant`, 'FAIL', 'Assistant not found');
      }
    } catch (error) {
      logTest(`Vapi - ${name} Assistant`, 'FAIL', error.message);
    }
  }

  // Test getting squad
  const squadId = process.env.VAPI_SQUAD_ID;
  if (squadId) {
    try {
      const squad = await vapiClient.getSquad(squadId);
      if (squad && squad.id) {
        logTest('Vapi - Squad', 'PASS', `Name: ${squad.name || 'Unnamed'}, Members: ${squad.members?.length || 0}`);
      } else {
        logTest('Vapi - Squad', 'FAIL', 'Squad not found');
      }
    } catch (error) {
      logTest('Vapi - Squad', 'FAIL', error.message);
    }
  } else {
    logTest('Vapi - Squad', 'WARN', 'VAPI_SQUAD_ID not set');
  }
}

async function testGHLConnectivity() {
  console.log('\n' + '='.repeat(70));
  console.log('📡 SECTION 4: GHL API CONNECTIVITY');
  console.log('='.repeat(70) + '\n');

  const ghlClient = new GHLClient();

  // Test calendar availability (uses cache if available)
  try {
    const calendarId = process.env.GHL_CALENDAR_ID;
    if (!calendarId) {
      logTest('GHL - Calendar Availability', 'WARN', 'GHL_CALENDAR_ID not set');
    } else {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startTime = tomorrow.toISOString();
      const endTime = new Date(tomorrow.getTime() + (24 * 60 * 60 * 1000)).toISOString();

      const availability = await ghlClient.checkCalendarAvailability(
        calendarId,
        startTime,
        endTime,
        'Europe/London'
      );

      if (availability && availability.slots !== undefined) {
        logTest('GHL - Calendar Availability', 'PASS', `Found ${availability.slots.length} slot(s) for tomorrow`);
      } else {
        logTest('GHL - Calendar Availability', 'FAIL', 'Invalid response format');
      }
    }
  } catch (error) {
    logTest('GHL - Calendar Availability', 'FAIL', error.message);
  }

  // Test custom field IDs
  try {
    const customFieldIds = ghlClient.customFieldIds;
    const requiredFields = [
      'call_status',
      'call_result',
      'call_attempts',
      'last_call_time',
      'next_call_scheduled',
      'ended_reason'
    ];

    let allFieldsPresent = true;
    let missingFields = [];

    for (const field of requiredFields) {
      if (!customFieldIds[field]) {
        allFieldsPresent = false;
        missingFields.push(field);
      }
    }

    if (allFieldsPresent) {
      logTest('GHL - Custom Field IDs', 'PASS', `All ${requiredFields.length} required fields configured`);
    } else {
      logTest('GHL - Custom Field IDs', 'FAIL', `Missing: ${missingFields.join(', ')}`);
    }
  } catch (error) {
    logTest('GHL - Custom Field IDs', 'FAIL', error.message);
  }
}

async function testAssistantConfigurations() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 SECTION 5: ASSISTANT CONFIGURATIONS');
  console.log('='.repeat(70) + '\n');

  const configFiles = [
    '../src/config/inbound-assistant-config.js',
    '../src/config/main-assistant-config.js',
    '../src/config/services-assistant-config.js',
    '../src/config/pricing-assistant-config.js',
    '../src/config/confirmation-assistant-config.js'
  ];

  for (const configPath of configFiles) {
    const configName = configPath.split('/').pop().replace('.js', '');
    try {
      const config = require(configPath);
      
      // Check basic structure
      if (config.name && config.model && config.voice) {
        logTest(`Config - ${configName}`, 'PASS', `Name: ${config.name}`);
        
        // Check if voice is properly configured
        if (config.voice.provider && config.voice.voiceId) {
          console.log(`   Voice: ${config.voice.provider} - ${config.voice.voiceId}`);
        }
        
        // Check if model is configured
        if (config.model.provider && config.model.model) {
          console.log(`   Model: ${config.model.provider}/${config.model.model}`);
        }
        
        // Check if firstMessage exists
        if (config.firstMessage) {
          console.log(`   First message: ${config.firstMessage.substring(0, 50)}...`);
        }
      } else {
        logTest(`Config - ${configName}`, 'FAIL', 'Missing required fields (name, model, or voice)');
      }
    } catch (error) {
      logTest(`Config - ${configName}`, 'FAIL', error.message);
    }
  }
}

async function testWebhookHandlers() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 SECTION 6: WEBHOOK HANDLER FILES');
  console.log('='.repeat(70) + '\n');

  const webhookFiles = [
    '../src/webhooks/vapi-function-handler.js',
    '../src/webhooks/ghl-to-vapi.js',
    '../src/webhooks/twilio-router.js',
    '../src/webhooks/ghl-sms-handler.js',
    '../src/webhooks/vapi-webhook.js'
  ];

  for (const webhookPath of webhookFiles) {
    const webhookName = webhookPath.split('/').pop().replace('.js', '');
    try {
      const WebhookClass = require(webhookPath);
      
      // Try to instantiate (but don't actually set up routes)
      if (typeof WebhookClass === 'function') {
        logTest(`Webhook - ${webhookName}`, 'PASS', 'Class loads successfully');
      } else {
        logTest(`Webhook - ${webhookName}`, 'FAIL', 'Not a valid class');
      }
    } catch (error) {
      logTest(`Webhook - ${webhookName}`, 'FAIL', error.message);
    }
  }
}

function generateReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 FINAL AUDIT REPORT');
  console.log('═'.repeat(70) + '\n');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed} (${passRate}%)`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  console.log('\n' + '-'.repeat(70));
  
  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 PERFECT! All tests passed with no warnings!');
    console.log('✅ System is ready for deployment!');
  } else if (results.failed === 0) {
    console.log(`\n✅ All tests passed! (${results.warnings} warnings)`);
    console.log('⚠️  System is functional but check warnings above.');
  } else {
    console.log(`\n❌ ${results.failed} test(s) failed!`);
    console.log('🔧 Fix the issues above before deploying.');
    
    // List failed tests
    console.log('\nFailed tests:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }

  console.log('\n' + '═'.repeat(70) + '\n');

  return results.failed === 0;
}

async function runCompleteAudit() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    KEEY VOICE ASSISTANT                                ║');
  console.log('║                  COMPLETE LOCAL AUDIT                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  console.log('⏰ Started:', new Date().toLocaleString());
  console.log('📂 Working Directory:', process.cwd());
  console.log('🔧 Node Version:', process.version);
  console.log('');

  try {
    await testEnvironmentVariables();
    await testServiceClasses();
    await testVapiConnectivity();
    await testGHLConnectivity();
    await testAssistantConfigurations();
    await testWebhookHandlers();

    const success = generateReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ FATAL ERROR during audit:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the audit
runCompleteAudit();

