require('dotenv').config()
const axios = require('axios')
const TimezoneDetector = require('../src/services/timezone-detector')
const CallingHoursValidator = require('../src/services/calling-hours-validator')
const SmartRetryCalculator = require('../src/services/smart-retry-calculator')

/**
 * Comprehensive Test Suite for Smart Retry System
 * Tests timezone detection, calling hours, retry calculation, and webhook integration
 */

class SmartRetrySystemTest {
  constructor() {
    this.serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`
    this.passed = 0
    this.failed = 0
    this.skipped = 0
  }

  log(message) {
    console.log(message)
  }

  logTest(name) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`🧪 TEST: ${name}`)
    console.log('='.repeat(70))
  }

  logResult(success, message) {
    if (success) {
      this.passed++
      console.log(`✅ PASS: ${message}`)
    } else {
      this.failed++
      console.error(`❌ FAIL: ${message}`)
    }
  }

  logSkip(message) {
    this.skipped++
    console.log(`⏭️  SKIP: ${message}`)
  }

  // ============================================================
  // TEST 1: Timezone Detection
  // ============================================================
  async testTimezoneDetection() {
    this.logTest("Timezone Detection for UK and Dubai")

    const testCases = [
      { phone: '+447700900123', expected: 'Europe/London', name: 'UK +44' },
      { phone: '447700900123', expected: 'Europe/London', name: 'UK without +' },
      { phone: '+44 7700 900 123', expected: 'Europe/London', name: 'UK with spaces' },
      { phone: '+971501234567', expected: 'Asia/Dubai', name: 'Dubai +971' },
      { phone: '971501234567', expected: 'Asia/Dubai', name: 'Dubai without +' },
      { phone: '+971 50 123 4567', expected: 'Asia/Dubai', name: 'Dubai with spaces' },
      { phone: '+12136064730', expected: 'Europe/London', name: 'Unknown (US) → default' },
      { phone: null, expected: 'Europe/London', name: 'Null → default' }
    ]

    for (const test of testCases) {
      const result = TimezoneDetector.detectFromPhone(test.phone)
      const success = result === test.expected
      this.logResult(success, `${test.name}: ${result}`)
    }
  }

  // ============================================================
  // TEST 2: Calling Hours Validation
  // ============================================================
  async testCallingHoursValidation() {
    this.logTest("Calling Hours Validation (9 AM - 7 PM)")

    const londonCheck = CallingHoursValidator.isWithinCallingHours('Europe/London')
    console.log(`\n📍 London (Europe/London):`)
    console.log(`   Can call: ${londonCheck.canCall}`)
    console.log(`   Reason: ${londonCheck.reason}`)
    console.log(`   Current time: ${londonCheck.currentTime}`)
    if (!londonCheck.canCall) {
      console.log(`   Next available: ${londonCheck.nextCallTime}`)
    }

    const dubaiCheck = CallingHoursValidator.isWithinCallingHours('Asia/Dubai')
    console.log(`\n📍 Dubai (Asia/Dubai):`)
    console.log(`   Can call: ${dubaiCheck.canCall}`)
    console.log(`   Reason: ${dubaiCheck.reason}`)
    console.log(`   Current time: ${dubaiCheck.currentTime}`)
    if (!dubaiCheck.canCall) {
      console.log(`   Next available: ${dubaiCheck.nextCallTime}`)
    }

    // Both checks should have a result
    this.logResult(
      londonCheck.hasOwnProperty('canCall') && dubaiCheck.hasOwnProperty('canCall'),
      "Both timezones returned valid results"
    )
  }

  // ============================================================
  // TEST 3: Smart Retry Calculation
  // ============================================================
  async testSmartRetryCalculation() {
    this.logTest("Smart Retry Time Calculation")

    const testCases = [
      { attempt: 1, reason: 'customer-busy', tz: 'Europe/London', expectedDelay: 25 },
      { attempt: 1, reason: 'no-answer', tz: 'Europe/London', expectedDelay: 120 },
      { attempt: 1, reason: 'voicemail', tz: 'Asia/Dubai', expectedDelay: 240 },
      { attempt: 2, reason: 'no-answer', tz: 'Europe/London', expectedDelay: 120 },
      { attempt: 3, reason: 'voicemail', tz: 'Asia/Dubai', expectedDelay: 240 }
    ]

    for (const test of testCases) {
      const result = SmartRetryCalculator.calculateRetryTime(
        test.attempt,
        test.reason,
        test.tz
      )
      
      const success = result.delayMinutes === test.expectedDelay && 
                     result.nextCallTime !== null &&
                     result.nextCallTimeFormatted !== null
      
      this.logResult(
        success,
        `Attempt ${test.attempt}, ${test.reason}: ${result.delayMinutes} min delay → ${result.nextCallTimeFormatted}`
      )
    }
  }

  // ============================================================
  // TEST 4: Webhook - Outside Business Hours
  // ============================================================
  async testWebhookOutsideHours() {
    this.logTest("Webhook: Call Request Outside Business Hours")

    // Test with a time that's definitely outside hours (if it's currently within hours)
    // For now, we'll just test that the endpoint exists and responds

    try {
      const response = await axios.post(
        `${this.serverUrl}/webhook/ghl-to-vapi`,
        {
          phone: '+447700900123',
          contactId: 'test-contact-123',
          name: 'Test User'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true // Accept any status
        }
      )

      if (response.status === 200 || response.status === 400) {
        this.logResult(true, `Webhook responded with ${response.status}`)
        
        if (response.data.scheduled) {
          console.log(`   📅 Call scheduled for: ${response.data.scheduledFor}`)
          console.log(`   🌍 Timezone: ${response.data.timezone}`)
        } else if (response.data.callInitiated) {
          console.log(`   📞 Call initiated: ${response.data.callId}`)
          console.log(`   🌍 Timezone: ${response.data.timezone}`)
        }
      } else {
        this.logResult(false, `Unexpected status: ${response.status}`)
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logSkip("Server not running (start with: npm start)")
      } else {
        this.logResult(false, error.message)
      }
    }
  }

  // ============================================================
  // TEST 5: Webhook - Missing Phone Number
  // ============================================================
  async testWebhookMissingPhone() {
    this.logTest("Webhook: Missing Phone Number Validation")

    try {
      const response = await axios.post(
        `${this.serverUrl}/webhook/ghl-to-vapi`,
        {
          contactId: 'test-contact-123',
          name: 'Test User'
          // phone is missing
        },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        }
      )

      const success = response.status === 400 && 
                     response.data.error === "Missing phone number"
      
      this.logResult(success, `Validation error returned: ${response.status}`)
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logSkip("Server not running")
      } else {
        this.logResult(false, error.message)
      }
    }
  }

  // ============================================================
  // TEST 6: Environment Variables
  // ============================================================
  async testEnvironmentVariables() {
    this.logTest("Environment Variables")

    const required = [
      'GHL_API_KEY',
      'GHL_LOCATION_ID',
      'VAPI_API_KEY',
      'VAPI_SQUAD_ID', // Using squad for outbound calls
      'VAPI_PHONE_NUMBER_ID'
    ]

    for (const varName of required) {
      const value = process.env[varName]
      const isSet = value && value.length > 10
      
      if (isSet) {
        this.logResult(true, `${varName} is set (${value.substring(0, 15)}...)`)
      } else if (value) {
        this.logResult(false, `${varName} is set but too short (${value.length} chars)`)
      } else {
        this.logResult(false, `${varName} is NOT set`)
      }
    }
  }

  // ============================================================
  // TEST 7: Server Health Check
  // ============================================================
  async testServerHealth() {
    this.logTest("Server Health Check")

    try {
      const response = await axios.get(`${this.serverUrl}/health`)
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.logResult(true, `Server is healthy: ${response.data.service}`)
        console.log(`   Timestamp: ${response.data.timestamp}`)
      } else {
        this.logResult(false, `Unexpected response: ${response.status}`)
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logSkip("Server not running")
      } else {
        this.logResult(false, error.message)
      }
    }
  }

  // ============================================================
  // RUN ALL TESTS
  // ============================================================
  async runAll() {
    console.log('\n\n')
    console.log('╔' + '═'.repeat(70) + '╗')
    console.log('║' + ' '.repeat(10) + 'SMART RETRY SYSTEM - COMPREHENSIVE TEST SUITE' + ' '.repeat(15) + '║')
    console.log('╚' + '═'.repeat(70) + '╝')
    console.log(`\n📅 Date: ${new Date().toISOString()}`)
    console.log(`🌍 Server: ${this.serverUrl}`)

    try {
      // Core services tests (no server needed)
      await this.testTimezoneDetection()
      await this.testCallingHoursValidation()
      await this.testSmartRetryCalculation()
      
      // Environment tests
      await this.testEnvironmentVariables()
      
      // Server/webhook tests (requires server running)
      await this.testServerHealth()
      await this.testWebhookOutsideHours()
      await this.testWebhookMissingPhone()
      
    } catch (error) {
      console.error('\n❌ Test suite error:', error)
    }

    // Print summary
    console.log('\n\n')
    console.log('╔' + '═'.repeat(70) + '╗')
    console.log('║' + ' '.repeat(28) + 'TEST SUMMARY' + ' '.repeat(30) + '║')
    console.log('╚' + '═'.repeat(70) + '╝')
    console.log(`\n✅ Passed:  ${this.passed}`)
    console.log(`❌ Failed:  ${this.failed}`)
    console.log(`⏭️  Skipped: ${this.skipped}`)
    console.log(`📊 Total:   ${this.passed + this.failed + this.skipped}\n`)

    const allPassed = this.failed === 0
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! 🎉\n')
    } else {
      console.log(`⚠️  ${this.failed} test(s) failed. Please review the errors above.\n`)
    }

    // Exit with appropriate code
    process.exit(this.failed > 0 ? 1 : 0)
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new SmartRetrySystemTest()
  tester.runAll()
}

module.exports = SmartRetrySystemTest

