const { DateTime } = require('luxon')

/**
 * Smart Retry Calculator
 * Calculates optimal retry time based on call failure reason and attempt number
 */

class SmartRetryCalculator {
  /**
   * Calculate next retry time based on failure reason
   * @param {number} attemptNumber - Current attempt number (1, 2, 3...)
   * @param {string} endedReason - Why the call failed (voicemail, no-answer, busy, etc.)
   * @param {string} customerTimezone - IANA timezone
   * @returns {Object} - { nextCallTime, delayMinutes, adjustedForBusinessHours }
   */
  static calculateRetryTime(attemptNumber, endedReason, customerTimezone = "Europe/London") {
    console.log(`\n📊 Calculating retry time:`)
    console.log(`   Attempt: ${attemptNumber}`)
    console.log(`   Reason: ${endedReason}`)
    console.log(`   Timezone: ${customerTimezone}`)

    // Determine delay based on failure reason
    let delayMinutes = this.getDelayForReason(endedReason)
    console.log(`   Initial delay: ${delayMinutes} minutes`)

    // Calculate next call time
    const now = DateTime.now().setZone(customerTimezone)
    let nextCallTime = now.plus({ minutes: delayMinutes })

    console.log(`   Current time: ${now.toFormat('EEE, MMM dd, h:mm a ZZZZ')}`)
    console.log(`   Initial retry time: ${nextCallTime.toFormat('EEE, MMM dd, h:mm a ZZZZ')}`)

    // Adjust to business hours
    const adjusted = this.adjustToBusinessHours(nextCallTime, customerTimezone)
    
    console.log(`   ✅ Final retry time: ${adjusted.toFormat('EEE, MMM dd, h:mm a ZZZZ')}`)

    return {
      nextCallTime: adjusted.toISO(),
      nextCallTimeFormatted: adjusted.toFormat('EEE, MMM dd yyyy, h:mm a ZZZZ'),
      delayMinutes: delayMinutes,
      adjustedForBusinessHours: adjusted.toISO() !== nextCallTime.toISO(),
      attemptNumber: attemptNumber
    }
  }

  /**
   * Get delay in minutes based on failure reason
   * @param {string} endedReason - Call failure reason
   * @returns {number} - Delay in minutes
   */
  static getDelayForReason(endedReason) {
    const delays = {
      // Very short delays
      'customer-busy': 25,
      'user-busy': 25,
      
      // Medium delays
      'customer-did-not-answer': 120,     // 2 hours
      'no-answer': 120,
      'no-answer-from-user': 120,
      
      // Longer delays
      'voicemail': 240,                   // 4 hours
      'voicemail-reached': 240,
      
      // Default
      'default': 120                      // 2 hours
    }

    return delays[endedReason] || delays['default']
  }

  /**
   * Adjust time to fall within business hours (9 AM - 7 PM, Mon-Fri)
   * @param {DateTime} targetTime - Luxon DateTime object
   * @param {string} timezone - IANA timezone
   * @returns {DateTime} - Adjusted DateTime object
   */
  static adjustToBusinessHours(targetTime, timezone) {
    let adjusted = targetTime.setZone(timezone)
    const hour = adjusted.hour
    const dayOfWeek = adjusted.weekday

    console.log(`   🔧 Adjusting for business hours...`)

    // If after 7 PM, move to 10 AM next day
    if (hour >= 19) {
      console.log(`      ⏰ After 7 PM, moving to 10 AM next day`)
      adjusted = adjusted.plus({ days: 1 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
    }

    // If before 9 AM, move to 10 AM same day
    if (adjusted.hour < 9) {
      console.log(`      ⏰ Before 9 AM, moving to 10 AM`)
      adjusted = adjusted.set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
    }

    // Skip weekends
    let skippedDays = 0
    while (adjusted.weekday === 6 || adjusted.weekday === 7) {
      console.log(`      ⏭️  Weekend detected, moving to Monday`)
      adjusted = adjusted.plus({ days: 1 })
      skippedDays++
    }

    if (skippedDays > 0) {
      // If we skipped weekend, set to 10 AM Monday
      adjusted = adjusted.set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
    }

    return adjusted
  }

  /**
   * Check if should continue retrying
   * @param {number} attemptNumber - Current attempt number
   * @returns {boolean} - True if should retry, false if should give up
   */
  static shouldRetry(attemptNumber) {
    const MAX_ATTEMPTS = 3
    return attemptNumber < MAX_ATTEMPTS
  }

  /**
   * Test retry calculator
   */
  static runTests() {
    console.log('\n🧪 Testing Smart Retry Calculator:\n')

    const testCases = [
      { attempt: 1, reason: 'customer-busy', tz: 'Europe/London' },
      { attempt: 1, reason: 'no-answer', tz: 'Europe/London' },
      { attempt: 1, reason: 'voicemail', tz: 'Asia/Dubai' },
      { attempt: 2, reason: 'no-answer', tz: 'Europe/London' },
      { attempt: 3, reason: 'voicemail', tz: 'Asia/Dubai' }
    ]

    testCases.forEach((test, index) => {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`TEST ${index + 1}:`)
      const result = this.calculateRetryTime(test.attempt, test.reason, test.tz)
      console.log(`✅ Next call: ${result.nextCallTimeFormatted}`)
      console.log(`   Delay: ${result.delayMinutes} minutes`)
      console.log(`   Adjusted: ${result.adjustedForBusinessHours ? 'Yes' : 'No'}`)
    })

    console.log('\n')
  }
}

module.exports = SmartRetryCalculator

// Run tests if executed directly
if (require.main === module) {
  SmartRetryCalculator.runTests()
}

