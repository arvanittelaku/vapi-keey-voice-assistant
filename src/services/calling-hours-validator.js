const { DateTime } = require('luxon')

/**
 * Calling Hours Validator
 * Checks if current time is within business calling hours (9 AM - 7 PM, Mon-Fri)
 */

class CallingHoursValidator {
  /**
   * Check if current time is within calling hours in the given timezone
   * @param {string} timezone - IANA timezone (Europe/London or Asia/Dubai)
   * @returns {Object} - { canCall, reason, nextCallTime, currentTime }
   */
  static isWithinCallingHours(timezone = "Europe/London") {
    try {
      const now = DateTime.now().setZone(timezone)
      const hour = now.hour
      const dayOfWeek = now.weekday // 1=Monday, 7=Sunday

      console.log(`\n⏰ Checking calling hours in ${timezone}:`)
      console.log(`   Current time: ${now.toFormat('EEE, MMM dd yyyy, h:mm a ZZZZ')}`)
      console.log(`   Hour: ${hour}, Day: ${dayOfWeek} (${this.getDayName(dayOfWeek)})`)

      // Check weekend (Saturday=6, Sunday=7)
      if (dayOfWeek === 6 || dayOfWeek === 7) {
        console.log(`   ❌ Weekend detected - cannot call`)
        const nextCallTime = this.getNextBusinessDay(now, timezone)
        return {
          canCall: false,
          reason: "weekend",
          nextCallTime: nextCallTime,
          currentTime: now.toISO()
        }
      }

      // Too early (before 9 AM)
      if (hour < 9) {
        console.log(`   ❌ Too early (before 9 AM) - cannot call`)
        const nextCallTime = now.set({ hour: 10, minute: 0, second: 0 }).toISO()
        return {
          canCall: false,
          reason: "too_early",
          nextCallTime: nextCallTime,
          currentTime: now.toISO()
        }
      }

      // Too late (7 PM or after)
      if (hour >= 19) {
        console.log(`   ❌ Too late (after 7 PM) - cannot call`)
        const nextDay = now.plus({ days: 1 }).set({ hour: 10, minute: 0, second: 0 })
        const nextCallTime = this.getNextBusinessDay(nextDay, timezone)
        return {
          canCall: false,
          reason: "too_late",
          nextCallTime: nextCallTime,
          currentTime: now.toISO()
        }
      }

      // Within hours!
      console.log(`   ✅ Within calling hours (9 AM - 7 PM, weekday)`)
      return {
        canCall: true,
        reason: "ok",
        nextCallTime: null,
        currentTime: now.toISO()
      }

    } catch (error) {
      console.error("❌ Error checking calling hours:", error.message)
      return {
        canCall: false,
        reason: "error",
        nextCallTime: null,
        currentTime: null,
        error: error.message
      }
    }
  }

  /**
   * Get next business day at 10 AM (skip weekends)
   * @param {DateTime} currentDateTime - Luxon DateTime object
   * @param {string} timezone - IANA timezone
   * @returns {string} - ISO timestamp of next business day at 10 AM
   */
  static getNextBusinessDay(currentDateTime, timezone) {
    let next = currentDateTime.setZone(timezone)

    // Skip weekends
    while (next.weekday === 6 || next.weekday === 7) {
      console.log(`   ⏭️  Skipping ${this.getDayName(next.weekday)}, moving to next day`)
      next = next.plus({ days: 1 })
    }

    // Set to 10 AM
    next = next.set({ hour: 10, minute: 0, second: 0, millisecond: 0 })

    console.log(`   📅 Next business day: ${next.toFormat('EEE, MMM dd yyyy, h:mm a ZZZZ')}`)
    return next.toISO()
  }

  /**
   * Get day name from weekday number
   * @param {number} weekday - 1=Monday, 7=Sunday
   * @returns {string} - Day name
   */
  static getDayName(weekday) {
    const days = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday'
    }
    return days[weekday] || 'Unknown'
  }

  /**
   * Test calling hours validation
   */
  static runTests() {
    console.log('\n🧪 Testing Calling Hours Validation:\n')

    // Test with current time
    console.log('TEST 1: Current time in London')
    const londonResult = this.isWithinCallingHours('Europe/London')
    console.log(`Result: canCall=${londonResult.canCall}, reason=${londonResult.reason}`)

    console.log('\n' + '='.repeat(60))

    console.log('\nTEST 2: Current time in Dubai')
    const dubaiResult = this.isWithinCallingHours('Asia/Dubai')
    console.log(`Result: canCall=${dubaiResult.canCall}, reason=${dubaiResult.reason}`)

    console.log('\n')
  }
}

module.exports = CallingHoursValidator

// Run tests if executed directly
if (require.main === module) {
  CallingHoursValidator.runTests()
}

