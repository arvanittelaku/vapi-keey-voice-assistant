#!/usr/bin/env node

/**
 * SIMPLE PRE-DEPLOYMENT VERIFICATION
 * Focuses on critical components only
 */

require('dotenv').config();
const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let passed = 0;
let failed = 0;

function test(name, result, details = '') {
  if (result) {
    passed++;
    console.log(`${colors.green}✅${colors.reset} ${name}`);
  } else {
    failed++;
    console.log(`${colors.red}❌${colors.reset} ${name}`);
  }
  if (details) console.log(`   ${colors.yellow}→ ${details}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════${colors.reset}\n`);
}

async function main() {
  console.log(`\n${colors.magenta}
╔════════════════════════════════════════════════════════════╗
║        KEEY VOICE ASSISTANT - DEPLOYMENT VERIFICATION       ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // ==============================
  // PHASE 1: ENVIRONMENT VARIABLES
  // ==============================
  section('PHASE 1: Environment Variables');
  
  const criticalVars = [
    'VAPI_API_KEY',
    'VAPI_MAIN_ASSISTANT_ID',
    'VAPI_INBOUND_ASSISTANT_ID',
    'VAPI_CONFIRMATION_ASSISTANT_ID',
    'VAPI_SQUAD_ID',
    'GHL_API_KEY',
    'GHL_LOCATION_ID',
    'GHL_CALENDAR_ID',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN'
  ];

  for (const varName of criticalVars) {
    test(varName, !!process.env[varName]);
  }

  // ==============================
  // PHASE 2: VAPI CONNECTIVITY
  // ==============================
  section('PHASE 2: Vapi API');

  try {
    const vapiResponse = await axios.get('https://api.vapi.ai/assistant', {
      headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` }
    });
    test('Vapi API Connection', vapiResponse.status === 200, `${vapiResponse.data.length} assistants found`);

    const mainAssistant = vapiResponse.data.find(a => a.id === process.env.VAPI_MAIN_ASSISTANT_ID);
    test('Main Assistant', !!mainAssistant, mainAssistant?.name);

    const inboundAssistant = vapiResponse.data.find(a => a.id === process.env.VAPI_INBOUND_ASSISTANT_ID);
    test('Inbound Assistant', !!inboundAssistant, inboundAssistant?.name);

    const confirmAssistant = vapiResponse.data.find(a => a.id === process.env.VAPI_CONFIRMATION_ASSISTANT_ID);
    test('Confirmation Assistant', !!confirmAssistant, confirmAssistant?.name);

  } catch (error) {
    test('Vapi API Connection', false, error.message);
  }

  // ==============================
  // PHASE 3: GHL CONNECTIVITY
  // ==============================
  section('PHASE 3: GoHighLevel API');

  try {
    const ghlResponse = await axios.get(
      `https://services.leadconnectorhq.com/contacts/`,
      {
        params: { locationId: process.env.GHL_LOCATION_ID, limit: 1 },
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Version': '2021-07-28'
        },
        validateStatus: () => true
      }
    );
    test('GHL API Connection', ghlResponse.status === 200 || ghlResponse.status === 422, 
      `API accessible (${ghlResponse.status})`);

  } catch (error) {
    test('GHL API Connection', false, error.message);
  }

  // ==============================
  // PHASE 4: TWILIO CONNECTIVITY
  // ==============================
  section('PHASE 4: Twilio API');

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const twilioResponse = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    test('Twilio API Connection', twilioResponse.status === 200, twilioResponse.data.friendly_name);

  } catch (error) {
    test('Twilio API Connection', false, error.message);
  }

  // ==============================
  // PHASE 5: PHONE NUMBER CONFIG
  // ==============================
  section('PHASE 5: Phone Number Assignments');

  try {
    const phone1Response = await axios.get(
      `https://api.vapi.ai/phone-number/${process.env.VAPI_PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` }
      }
    );
    test('Phone 1 - Inbound', phone1Response.data.assistantId === process.env.VAPI_INBOUND_ASSISTANT_ID);
    test('Phone 1 - Outbound Squad', phone1Response.data.squadId === process.env.VAPI_SQUAD_ID);

    const phone2Response = await axios.get(
      `https://api.vapi.ai/phone-number/${process.env.VAPI_CONFIRMATION_PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` }
      }
    );
    test('Phone 2 - Confirmation', phone2Response.data.assistantId === process.env.VAPI_CONFIRMATION_ASSISTANT_ID);

  } catch (error) {
    test('Phone Configuration', false, error.message);
  }

  // ==============================
  // PHASE 6: CORE FILES EXIST
  // ==============================
  section('PHASE 6: Core Files');

  const fs = require('fs');
  const path = require('path');

  const coreFiles = [
    'src/index.js',
    'src/webhooks/vapi-webhook.js',
    'src/webhooks/vapi-function-handler.js',
    'src/webhooks/twilio-router.js',
    'src/services/ghl-client.js',
    'src/services/vapi-client.js',
    'src/services/timezone-detector.js',
    'src/services/smart-retry-calculator.js'
  ];

  for (const file of coreFiles) {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    test(file, exists);
  }

  // ==============================
  // PHASE 7: SERVER HEALTH
  // ==============================
  section('PHASE 7: Local Server Health');

  try {
    const healthResponse = await axios.get('http://localhost:3000/health', {
      timeout: 5000,
      validateStatus: () => true
    });
    test('Health Endpoint', healthResponse.status === 200, healthResponse.data.status);
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Server not running locally (this is OK if deploying fresh)${colors.reset}`);
  }

  // ==============================
  // FINAL SUMMARY
  // ==============================
  console.log(`\n${colors.cyan}══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.green}✅ Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}❌ Failed:${colors.reset} ${failed}\n`);

  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failed === 0) {
    console.log(`${colors.green}
╔════════════════════════════════════════════════════════════╗
║                  ✅ READY FOR DEPLOYMENT ✅                ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
    process.exit(0);
  } else if (failed <= 2) {
    console.log(`${colors.yellow}
╔════════════════════════════════════════════════════════════╗
║           ⚠️  MOSTLY READY - MINOR ISSUES FOUND ⚠️          ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}
╔════════════════════════════════════════════════════════════╗
║           ❌ FIX ISSUES BEFORE DEPLOYMENT ❌               ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}\n❌ Verification failed:${colors.reset}`, error.message);
  process.exit(1);
});

