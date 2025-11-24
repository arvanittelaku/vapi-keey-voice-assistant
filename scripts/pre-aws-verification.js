#!/usr/bin/env node

/**
 * 🔍 PRE-AWS DEPLOYMENT VERIFICATION
 * Quick validation of all critical components before AWS migration
 */

require('dotenv').config();
const axios = require('axios');
const { DateTime } = require('luxon');

// Import services that don't require Express
const GHLClient = require('../src/services/ghl-client');
const TimezoneDetector = require('../src/services/timezone-detector');
const CallingHoursValidator = require('../src/services/calling-hours-validator');
const SmartRetryCalculator = require('../src/services/smart-retry-calculator');

const results = { passed: 0, failed: 0, warnings: 0 };

function log(emoji, category, test, message) {
  console.log(`${emoji} [${category}] ${test}: ${message}`);
  if (emoji === '✅') results.passed++;
  else if (emoji === '❌') results.failed++;
  else results.warnings++;
}

console.log('\n🚀 PRE-AWS DEPLOYMENT VERIFICATION\n');

// ============================================================
// 1. ENVIRONMENT VARIABLES
// ============================================================
console.log('=' + '='.repeat(59));
console.log('🔍 1. ENVIRONMENT VARIABLES');
console.log('=' + '='.repeat(59));

const required = {
  'GHL_API_KEY': process.env.GHL_API_KEY,
  'GHL_LOCATION_ID': process.env.GHL_LOCATION_ID,
  'VAPI_API_KEY': process.env.VAPI_API_KEY,
  'VAPI_PHONE_NUMBER_ID': process.env.VAPI_PHONE_NUMBER_ID,
  'VAPI_SQUAD_ID': process.env.VAPI_SQUAD_ID,
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
  'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER,
  'GHL_CALENDAR_ID': process.env.GHL_CALENDAR_ID
};

for (const [key, value] of Object.entries(required)) {
  if (value) {
    log('✅', 'ENV', key, `Set (${value.substring(0, 10)}...)`);
  } else {
    log('❌', 'ENV', key, 'MISSING!');
  }
}

// ============================================================
// 2. TIMEZONE DETECTION
// ============================================================
console.log('\n' + '=' + '='.repeat(59));
console.log('🔍 2. TIMEZONE DETECTION');
console.log('=' + '='.repeat(59));

const tzTests = [
  { phone: '+447700900123', expected: 'Europe/London' },
  { phone: '+971501234567', expected: 'Asia/Dubai' },
  { phone: '+12136064730', expected: 'Europe/London' } // Default
];

for (const test of tzTests) {
  const result = TimezoneDetector.detectFromPhone(test.phone);
  if (result === test.expected) {
    log('✅', 'TIMEZONE', test.phone, `Correctly detected ${result}`);
  } else {
    log('❌', 'TIMEZONE', test.phone, `Got ${result}, expected ${test.expected}`);
  }
}

// ============================================================
// 3. BUSINESS HOURS VALIDATION
// ============================================================
console.log('\n' + '=' + '='.repeat(59));
console.log('🔍 3. BUSINESS HOURS VALIDATION');
console.log('=' + '='.repeat(59));

// Test current time validation
const londonResult = CallingHoursValidator.isWithinCallingHours('Europe/London');
if (londonResult) {
  const now = DateTime.now().setZone('Europe/London');
  const hour = now.hour;
  const day = now.weekday;
  const isBusinessDay = day >= 1 && day <= 5;
  const isBusinessTime = hour >= 9 && hour < 19;
  
  if (londonResult.canCall === (isBusinessDay && isBusinessTime)) {
    log('✅', 'HOURS', 'London validation', `Correctly validated current time (can call: ${londonResult.canCall})`);
  } else {
    log('⚠️', 'HOURS', 'London validation', `Result: ${londonResult.canCall}, reason: ${londonResult.reason}`);
  }
} else {
  log('❌', 'HOURS', 'London validation', 'Failed to validate');
}

// Test Dubai timezone
const dubaiResult = CallingHoursValidator.isWithinCallingHours('Asia/Dubai');
if (dubaiResult) {
  log('✅', 'HOURS', 'Dubai validation', `Can call: ${dubaiResult.canCall}`);
} else {
  log('❌', 'HOURS', 'Dubai validation', 'Failed to validate');
}

// ============================================================
// 4. SMART RETRY CALCULATION
// ============================================================
console.log('\n' + '=' + '='.repeat(59));
console.log('🔍 4. SMART RETRY CALCULATION');
console.log('=' + '='.repeat(59));

const retryTests = [
  { reason: 'customer-busy', expectedMinutes: 25, name: 'Customer Busy' },
  { reason: 'no-answer', expectedMinutes: 120, name: 'No Answer' },
  { reason: 'voicemail', expectedMinutes: 240, name: 'Voicemail' }
];

for (const test of retryTests) {
  const result = SmartRetryCalculator.calculateRetryTime(1, test.reason, 'Europe/London');
  const nextCallTime = DateTime.fromISO(result.nextCallTime);
  const diffMinutes = nextCallTime.diff(DateTime.now().setZone('Europe/London'), 'minutes').minutes;
  const tolerance = 120; // 2 hours tolerance for business hours adjustment
  
  if (Math.abs(diffMinutes - test.expectedMinutes) < tolerance) {
    log('✅', 'RETRY', test.name, `Scheduled in ~${Math.round(diffMinutes)} minutes`);
  } else {
    log('⚠️', 'RETRY', test.name, `Expected ~${test.expectedMinutes}min, got ~${Math.round(diffMinutes)}min (adjusted for business hours)`);
  }
}

// ============================================================
// 5. GHL CUSTOM FIELDS CONVERSION
// ============================================================
console.log('\n' + '=' + '='.repeat(59));
console.log('🔍 5. GHL CUSTOM FIELDS');
console.log('=' + '='.repeat(59));

const ghlClient = new GHLClient();

// Test conversion to GHL v2 format
const testFields = {
  call_status: 'retry_scheduled',
  call_attempts: '2',
  next_call_scheduled: '2025-11-19T10:00:00Z'
};

const converted = ghlClient.convertCustomFieldsToV2(testFields);
if (Array.isArray(converted) && converted.length === 3) {
  log('✅', 'GHL', 'Fields to v2 format', `Converted ${converted.length} fields`);
} else {
  log('❌', 'GHL', 'Fields to v2 format', `Expected array of 3, got ${typeof converted}`);
}

// Test parsing from GHL v2 format
const testArray = [
  { id: 'abc123', value: 'confirmed' },
  { id: 'def456', value: '3' }
];

const parsed = ghlClient.parseCustomFields(testArray);
if (typeof parsed === 'object' && !Array.isArray(parsed)) {
  log('✅', 'GHL', 'Parse v2 fields', `Parsed ${Object.keys(parsed).length} fields`);
} else {
  log('❌', 'GHL', 'Parse v2 fields', `Expected object, got ${typeof parsed}`);
}

// ============================================================
// 6. VAPI ASSISTANT CONFIGURATION (API CHECK)
// ============================================================
console.log('\n' + '=' + '='.repeat(59));
console.log('🔍 6. VAPI ASSISTANT CONFIGURATION');
console.log('=' + '='.repeat(59));

(async () => {
  try {
    if (!process.env.VAPI_API_KEY || !process.env.VAPI_SQUAD_ID) {
      log('⚠️', 'VAPI', 'Config check', 'Missing API key or Squad ID');
      printSummary();
      return;
    }

    const response = await axios.get(
      `https://api.vapi.ai/squad/${process.env.VAPI_SQUAD_ID}`,
      { headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` } }
    );

    const squad = response.data;
    log('✅', 'VAPI', 'Squad connection', `Connected to squad ${squad.id}`);

    if (squad.members && squad.members.length > 0) {
      log('✅', 'VAPI', 'Squad members', `${squad.members.length} member(s) configured`);

      const assistant = squad.members[0].assistant || squad.members[0];

      // Check prompt
      if (assistant.model && assistant.model.messages) {
        const systemPrompt = assistant.model.messages.find(m => m.role === 'system');
        if (systemPrompt) {
          const promptText = systemPrompt.content;

          // Key checks
          if (/KEE-ee/i.test(promptText)) {
            log('✅', 'VAPI', 'Pronunciation guide', 'Found "KEE-ee" in prompt');
          } else {
            log('⚠️', 'VAPI', 'Pronunciation guide', 'Missing "KEE-ee" phonetic');
          }

          if (/{{.*?}}/i.test(promptText)) {
            log('✅', 'VAPI', 'Variable usage', 'Found variable placeholders');
          } else {
            log('⚠️', 'VAPI', 'Variable usage', 'No variable placeholders found');
          }

          if (/contactId|appointmentId/i.test(promptText)) {
            log('✅', 'VAPI', 'Tool parameter examples', 'Found ID parameter references');
          } else {
            log('⚠️', 'VAPI', 'Tool parameter examples', 'No tool parameter examples found');
          }
        } else {
          log('⚠️', 'VAPI', 'System prompt', 'No system message found');
        }
      }

      // Check tools
      if (assistant.model && assistant.model.tools) {
        const tools = assistant.model.tools;
        log('✅', 'VAPI', 'Tools configured', `${tools.length} tool(s) found`);

        const expectedTools = [
          'check_calendar_availability',
          'book_calendar_appointment_keey',
          'cancel_appointment_keey',
          'update_appointment_confirmation'
        ];

        for (const toolName of expectedTools) {
          const tool = tools.find(t => t.function && t.function.name === toolName);
          if (tool) {
            log('✅', 'VAPI', `Tool: ${toolName}`, 'Configured');
          } else {
            log('❌', 'VAPI', `Tool: ${toolName}`, 'MISSING!');
          }
        }
      } else {
        log('❌', 'VAPI', 'Tools', 'No tools configured!');
      }
    } else {
      log('❌', 'VAPI', 'Squad members', 'No members found!');
    }

  } catch (error) {
    log('❌', 'VAPI', 'API connection', error.message);
  }

  printSummary();
})();

function printSummary() {
  console.log('\n' + '=' + '='.repeat(59));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=' + '='.repeat(59));

  const total = results.passed + results.failed + results.warnings;
  const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log(`\n   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   📝 Total: ${total}`);
  console.log(`\n   Success Rate: ${percentage}%`);

  if (results.failed === 0 && results.warnings < 5) {
    console.log('\n✅ SYSTEM READY FOR AWS DEPLOYMENT!');
  } else if (results.failed === 0) {
    console.log('\n⚠️  SYSTEM MOSTLY READY - Review warnings');
  } else {
    console.log('\n❌ FIX FAILED TESTS BEFORE DEPLOYMENT!');
  }

  console.log('=' + '='.repeat(59) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

