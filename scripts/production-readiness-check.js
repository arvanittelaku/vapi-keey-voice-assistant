#!/usr/bin/env node
/**
 * Production Readiness Verification Script
 * 
 * Checks all components are ready for production deployment
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 PRODUCTION READINESS CHECK\n');
console.log('==================================================\n');

const checks = [];

// 1. Environment Variables
console.log('1️⃣  Checking Environment Variables...\n');

const requiredEnvVars = {
  'VAPI_API_KEY': 'Vapi API Key',
  'VAPI_PHONE_NUMBER_ID': 'Main Phone Number ID',
  'VAPI_CONFIRMATION_PHONE_NUMBER_ID': 'Confirmation Phone ID',
  'VAPI_SQUAD_ID': 'Squad ID',
  'VAPI_INBOUND_ASSISTANT_ID': 'Inbound Assistant ID',
  'VAPI_CONFIRMATION_ASSISTANT_ID': 'Confirmation Assistant ID',
  'GHL_API_KEY': 'GHL API Key',
  'GHL_LOCATION_ID': 'GHL Location ID',
  'GHL_CALENDAR_ID': 'GHL Calendar ID',
  'GHL_WORKFLOW_CONFIRMED': 'Confirmed Workflow Webhook',
  'GHL_WORKFLOW_CANCELLED': 'Cancelled Workflow Webhook',
  'GHL_WORKFLOW_RESCHEDULE': 'Reschedule Workflow Webhook',
  'GHL_WORKFLOW_NO_ANSWER': 'No Answer Workflow Webhook',
  'TWILIO_ACCOUNT_SID': 'Twilio Account SID',
  'TWILIO_AUTH_TOKEN': 'Twilio Auth Token',
  'TWILIO_PHONE_NUMBER': 'Twilio Phone Number'
};

let envComplete = true;
Object.entries(requiredEnvVars).forEach(([key, desc]) => {
  if (process.env[key]) {
    console.log(`   ✅ ${desc}`);
  } else {
    console.log(`   ❌ ${desc} - MISSING`);
    envComplete = false;
  }
});

checks.push({ name: 'Environment Variables', status: envComplete ? 'PASS' : 'FAIL' });
console.log('');

// 2. Check Required Files
console.log('2️⃣  Checking Required Files...\n');

const requiredFiles = [
  'server.js',
  'src/webhooks/vapi-function-handler.js',
  'src/webhooks/ghl-to-vapi.js',
  'src/services/ghl-client.js',
  'src/services/vapi-client.js',
  'src/services/sms-client.js',
  'src/services/smart-retry-calculator.js',
  'src/services/timezone-detector.js',
  'package.json'
];

let filesComplete = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    filesComplete = false;
  }
});

checks.push({ name: 'Required Files', status: filesComplete ? 'PASS' : 'FAIL' });
console.log('');

// 3. Check Dependencies
console.log('3️⃣  Checking Dependencies...\n');

const packageJson = require('../package.json');
const requiredDeps = [
  'express',
  'axios',
  'dotenv',
  'luxon',
  'libphonenumber-js',
  'twilio'
];

let depsComplete = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep} (v${packageJson.dependencies[dep]})`);
  } else {
    console.log(`   ❌ ${dep} - MISSING`);
    depsComplete = false;
  }
});

checks.push({ name: 'Dependencies', status: depsComplete ? 'PASS' : 'FAIL' });
console.log('');

// 4. Check GHL Workflow Configuration
console.log('4️⃣  Checking GHL Workflows Configuration...\n');

const workflows = [
  { name: 'Confirmed', var: 'GHL_WORKFLOW_CONFIRMED' },
  { name: 'Cancelled', var: 'GHL_WORKFLOW_CANCELLED' },
  { name: 'Reschedule', var: 'GHL_WORKFLOW_RESCHEDULE' },
  { name: 'No Answer', var: 'GHL_WORKFLOW_NO_ANSWER' }
];

let workflowsComplete = true;
workflows.forEach(wf => {
  const configured = process.env[wf.var];
  if (configured && configured.includes('leadconnectorhq.com')) {
    console.log(`   ✅ ${wf.name} workflow - Webhook URL configured`);
  } else {
    console.log(`   ❌ ${wf.name} workflow - NOT CONFIGURED or INVALID`);
    workflowsComplete = false;
  }
});

checks.push({ name: 'GHL Workflows', status: workflowsComplete ? 'PASS' : 'FAIL' });
console.log('');

// 5. Feature Implementation Check
console.log('5️⃣  Checking Feature Implementation...\n');

const features = [
  { name: 'Call Attempt Tracking', check: () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'src/webhooks/vapi-function-handler.js'), 'utf8');
    return code.includes('handleFailedCallWithSmartRetry') && code.includes('call_attempts');
  }},
  { name: '3-Strike Auto-Tagging', check: () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'src/webhooks/vapi-function-handler.js'), 'utf8');
    return code.includes('Needs Manual Follow-Up') && code.includes('attemptNumber >= 3');
  }},
  { name: 'Smart Retry Calculator', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'src/services/smart-retry-calculator.js'));
  }},
  { name: 'Timezone Detection', check: () => {
    return fs.existsSync(path.join(__dirname, '..', 'src/services/timezone-detector.js'));
  }},
  { name: 'SMS Fallback', check: () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'src/webhooks/vapi-function-handler.js'), 'utf8');
    return code.includes('sendConfirmationReminder');
  }},
  { name: 'Workflow Triggers', check: () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'src/webhooks/vapi-function-handler.js'), 'utf8');
    return code.includes('triggerWorkflowByStatus');
  }}
];

let featuresComplete = true;
features.forEach(feature => {
  const implemented = feature.check();
  if (implemented) {
    console.log(`   ✅ ${feature.name}`);
  } else {
    console.log(`   ❌ ${feature.name} - NOT IMPLEMENTED`);
    featuresComplete = false;
  }
});

checks.push({ name: 'Feature Implementation', status: featuresComplete ? 'PASS' : 'FAIL' });
console.log('');

// Final Summary
console.log('==================================================');
console.log('📊 PRODUCTION READINESS SUMMARY\n');

const allPassed = checks.every(c => c.status === 'PASS');

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${check.name}: ${check.status}`);
});

console.log('');

if (allPassed) {
  console.log('🎉 SYSTEM IS PRODUCTION READY! 🎉\n');
  console.log('Next steps:');
  console.log('1. Deploy server to production');
  console.log('2. Update GHL workflow webhook URLs');
  console.log('3. Run end-to-end tests');
  console.log('4. Monitor logs for first few days');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  SYSTEM NEEDS ATTENTION\n');
  console.log('Fix the failed checks above before deploying.');
  console.log('');
  process.exit(1);
}

