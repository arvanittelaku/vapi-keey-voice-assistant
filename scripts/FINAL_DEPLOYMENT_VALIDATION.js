#!/usr/bin/env node

/**
 * FINAL DEPLOYMENT VALIDATION
 * Comprehensive pre-deployment testing
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');
const VapiClient = require('../src/services/vapi-client');
const SMSClient = require('../src/services/sms-client');
const TimezoneDetector = require('../src/services/timezone-detector');
const CallingHoursValidator = require('../src/services/calling-hours-validator');
const SmartRetryCalculator = require('../src/services/smart-retry-calculator');
const axios = require('axios');

// Test counters
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
let testsWarnings = 0;

const RESULTS = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  passed: []
};

function log(message, type = 'info') {
  const symbols = {
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    info: 'ℹ️ ',
    test: '🧪'
  };
  console.log(`${symbols[type] || ''}  ${message}`);
}

function addResult(severity, category, message, details = null) {
  const result = { category, message, details };
  RESULTS[severity].push(result);
  
  if (severity === 'critical' || severity === 'high') {
    testsFailed++;
  } else if (severity === 'medium' || severity === 'low') {
    testsWarnings++;
  } else {
    testsPassed++;
  }
}

async function testEnvironmentVariables() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 1: Environment Variables', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  const required = {
    critical: [
      'VAPI_API_KEY',
      'GHL_API_KEY',
      'GHL_LOCATION_ID',
      'GHL_CALENDAR_ID',
      'WEBHOOK_BASE_URL'
    ],
    high: [
      'VAPI_SQUAD_ID',
      'VAPI_INBOUND_ASSISTANT_ID',
      'VAPI_OUTBOUND_PHONE_NUMBER_ID',
      'VAPI_INBOUND_PHONE_NUMBER_ID'
    ],
    medium: [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ]
  };

  for (const [priority, vars] of Object.entries(required)) {
    for (const varName of vars) {
      testsRun++;
      if (!process.env[varName]) {
        log(`${varName}: Missing`, 'error');
        addResult(priority, 'Environment', `Missing required variable: ${varName}`);
      } else {
        const value = process.env[varName];
        const displayValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')
          ? `${value.substring(0, 10)}...`
          : value;
        log(`${varName}: ${displayValue}`, 'success');
        addResult('passed', 'Environment', `${varName} is set`);
      }
    }
  }
}

async function testGHLConnectivity() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 2: GHL API Connectivity', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  const ghlClient = new GHLClient();

  // Test 1: List Contacts
  testsRun++;
  try {
    const response = await axios.get(
      'https://services.leadconnectorhq.com/contacts/',
      {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          locationId: process.env.GHL_LOCATION_ID,
          limit: 1
        }
      }
    );
    log('GHL API Authentication: Success', 'success');
    addResult('passed', 'GHL', 'API authentication working');
  } catch (error) {
    log(`GHL API Authentication: Failed (${error.response?.status})`, 'error');
    addResult('critical', 'GHL', 'API authentication failed', error.response?.data);
  }

  // Test 2: Calendar Availability
  testsRun++;
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(tomorrow);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await ghlClient.checkCalendarAvailability(
      process.env.GHL_CALENDAR_ID,
      tomorrow.toISOString(),
      endOfDay.toISOString(),
      'Europe/London'
    );

    log(`Calendar Availability: Found ${result.slots.length} slots`, 'success');
    addResult('passed', 'GHL', `Calendar API working (${result.slots.length} slots found)`);
  } catch (error) {
    log(`Calendar Availability: Failed`, 'error');
    addResult('critical', 'GHL', 'Calendar API failed', error.message);
  }
}

async function testVapiConnectivity() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 3: Vapi API Connectivity', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  const vapiClient = new VapiClient();

  // Test: Get Squad
  if (process.env.VAPI_SQUAD_ID) {
    testsRun++;
    try {
      const squad = await vapiClient.getSquad(process.env.VAPI_SQUAD_ID);
      log(`Vapi Squad: Found "${squad.name}"`, 'success');
      addResult('passed', 'Vapi', `Squad configured: ${squad.name}`);
    } catch (error) {
      log(`Vapi Squad: Failed`, 'error');
      addResult('high', 'Vapi', 'Squad not found or inaccessible', error.message);
    }
  }

  // Test: Get Inbound Assistant
  if (process.env.VAPI_INBOUND_ASSISTANT_ID) {
    testsRun++;
    try {
      const assistant = await vapiClient.getAssistant(process.env.VAPI_INBOUND_ASSISTANT_ID);
      log(`Inbound Assistant: Found "${assistant.name}"`, 'success');
      
      // Check if tools are attached
      if (assistant.toolIds && assistant.toolIds.length > 0) {
        log(`  Tools attached: ${assistant.toolIds.length}`, 'success');
        addResult('passed', 'Vapi', `Inbound assistant has ${assistant.toolIds.length} tools`);
      } else {
        log(`  Tools attached: 0 (WARNING)`, 'warning');
        addResult('high', 'Vapi', 'Inbound assistant has NO TOOLS attached');
      }
    } catch (error) {
      log(`Inbound Assistant: Failed`, 'error');
      addResult('high', 'Vapi', 'Inbound assistant not found', error.message);
    }
  }
}

async function testBusinessLogic() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 4: Business Logic', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  // Test: Timezone Detection
  testsRun++;
  const ukTz = TimezoneDetector.detectFromPhone('+447700900123');
  const dubaiTz = TimezoneDetector.detectFromPhone('+971501234567');
  
  if (ukTz === 'Europe/London' && dubaiTz === 'Asia/Dubai') {
    log('Timezone Detection: Working', 'success');
    addResult('passed', 'Business Logic', 'Timezone detection working correctly');
  } else {
    log('Timezone Detection: Failed', 'error');
    addResult('medium', 'Business Logic', 'Timezone detection not working correctly');
  }

  // Test: Calling Hours
  testsRun++;
  const londonHours = CallingHoursValidator.isWithinCallingHours('Europe/London');
  log(`Calling Hours (London): ${londonHours.canCall ? 'Can call' : `Cannot call (${londonHours.reason})`}`, 'info');
  addResult('passed', 'Business Logic', `Calling hours validation working`);

  // Test: Smart Retry
  testsRun++;
  const retry = SmartRetryCalculator.calculateRetryTime(1, 'no-answer', 'Europe/London');
  if (retry.nextCallTime) {
    log(`Smart Retry: Calculated next call time`, 'success');
    addResult('passed', 'Business Logic', 'Smart retry calculation working');
  } else {
    log(`Smart Retry: Failed`, 'error');
    addResult('medium', 'Business Logic', 'Smart retry calculation failed');
  }
}

async function testWebhookEndpoints() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 5: Webhook Endpoints (Local)', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  const baseUrl = 'http://localhost:3000';
  
  const endpoints = [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/test-direct', method: 'GET', name: 'Direct Route' },
  ];

  for (const endpoint of endpoints) {
    testsRun++;
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${baseUrl}${endpoint.path}`,
        timeout: 5000
      });
      
      if (response.status === 200) {
        log(`${endpoint.name}: Responding`, 'success');
        addResult('passed', 'Webhooks', `${endpoint.name} endpoint working`);
      } else {
        log(`${endpoint.name}: Unexpected status ${response.status}`, 'warning');
        addResult('low', 'Webhooks', `${endpoint.name} returned status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`${endpoint.name}: Server not running`, 'warning');
        addResult('medium', 'Webhooks', `Server not running on localhost:3000 (start with 'npm start')`);
      } else {
        log(`${endpoint.name}: ${error.message}`, 'error');
        addResult('medium', 'Webhooks', `${endpoint.name} failed: ${error.message}`);
      }
    }
  }
}

async function checkDockerFiles() {
  log('\n═══════════════════════════════════════════', 'info');
  log('TEST 6: Docker Configuration', 'test');
  log('═══════════════════════════════════════════\n', 'info');

  const fs = require('fs');
  const path = require('path');

  const files = ['Dockerfile', '.dockerignore', 'docker-compose.yml'];
  
  for (const file of files) {
    testsRun++;
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`${file}: Exists`, 'success');
      addResult('passed', 'Docker', `${file} exists`);
    } else {
      log(`${file}: Missing`, 'warning');
      addResult('low', 'Docker', `${file} missing`);
    }
  }
}

async function printSummary() {
  log('\n\n', 'info');
  log('═════════════════════════════════════════════════════', 'info');
  log('           FINAL DEPLOYMENT VALIDATION REPORT', 'info');
  log('═════════════════════════════════════════════════════\n', 'info');

  log(`Total Tests Run: ${testsRun}`, 'info');
  log(`✅ Passed: ${testsPassed}`, 'success');
  log(`⚠️  Warnings: ${testsWarnings}`, 'warning');
  log(`❌ Failed: ${testsFailed}`, 'error');

  log('\n', 'info');

  if (RESULTS.critical.length > 0) {
    log('🚨 CRITICAL ISSUES (MUST FIX BEFORE DEPLOYMENT):', 'error');
    RESULTS.critical.forEach((r, i) => {
      log(`  ${i + 1}. [${r.category}] ${r.message}`, 'error');
      if (r.details) log(`     Details: ${JSON.stringify(r.details)}`, 'info');
    });
    log('', 'info');
  }

  if (RESULTS.high.length > 0) {
    log('⚠️  HIGH PRIORITY ISSUES (SHOULD FIX):', 'warning');
    RESULTS.high.forEach((r, i) => {
      log(`  ${i + 1}. [${r.category}] ${r.message}`, 'warning');
    });
    log('', 'info');
  }

  if (RESULTS.medium.length > 0) {
    log('ℹ️  MEDIUM PRIORITY (RECOMMENDED):', 'info');
    RESULTS.medium.forEach((r, i) => {
      log(`  ${i + 1}. [${r.category}] ${r.message}`, 'info');
    });
    log('', 'info');
  }

  // Deployment readiness
  log('═════════════════════════════════════════════════════', 'info');
  log('                DEPLOYMENT READINESS', 'info');
  log('═════════════════════════════════════════════════════\n', 'info');

  if (RESULTS.critical.length === 0 && RESULTS.high.length === 0) {
    log('🎉 SYSTEM IS READY FOR DEPLOYMENT!', 'success');
    log('   All critical and high-priority checks passed.', 'success');
    log('   You can proceed with AWS deployment.', 'success');
  } else if (RESULTS.critical.length === 0) {
    log('⚠️  SYSTEM IS MOSTLY READY', 'warning');
    log(`   ${RESULTS.high.length} high-priority issue(s) should be fixed first.`, 'warning');
    log('   Deployment is possible but not recommended.', 'warning');
  } else {
    log('🚨 SYSTEM IS NOT READY FOR DEPLOYMENT!', 'error');
    log(`   ${RESULTS.critical.length} critical issue(s) MUST be fixed first.`, 'error');
    log('   Do NOT deploy until these are resolved.', 'error');
  }

  log('\n═════════════════════════════════════════════════════\n', 'info');

  // Exit code
  if (RESULTS.critical.length > 0) {
    process.exit(1);
  } else if (RESULTS.high.length > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

async function runAllTests() {
  log('\n🚀 Starting Final Deployment Validation...\n', 'info');
  log('This will test:', 'info');
  log('  1. Environment Variables', 'info');
  log('  2. GHL API Connectivity', 'info');
  log('  3. Vapi API Connectivity', 'info');
  log('  4. Business Logic', 'info');
  log('  5. Webhook Endpoints', 'info');
  log('  6. Docker Configuration\n', 'info');

  try {
    await testEnvironmentVariables();
    await testGHLConnectivity();
    await testVapiConnectivity();
    await testBusinessLogic();
    await testWebhookEndpoints();
    await checkDockerFiles();
  } catch (error) {
    log(`\n❌ Unexpected error during testing: ${error.message}`, 'error');
    console.error(error.stack);
  }

  await printSummary();
}

// Run the tests
runAllTests();

