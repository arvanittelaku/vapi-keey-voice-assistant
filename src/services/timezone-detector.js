/**
 * Timezone Detector for UK and Dubai
 * Detects customer timezone based on phone number prefix
 */

class TimezoneDetector {
  /**
   * Detect timezone from phone number (UK or Dubai only)
   * @param {string} phoneNumber - Phone number with country code
   * @returns {string} - IANA timezone string
   */
  static detectFromPhone(phoneNumber) {
    if (!phoneNumber) {
      console.log('⚠️  No phone number provided, defaulting to Europe/London')
      return "Europe/London"
    }

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    console.log(`🔍 Detecting timezone for: ${phoneNumber} (cleaned: ${cleaned})`)

    // UK: +44
    if (cleaned.startsWith('44')) {
      console.log(`   ✅ Detected UK number → Europe/London`)
      return "Europe/London"
    }

    // Dubai/UAE: +971
    if (cleaned.startsWith('971')) {
      console.log(`   ✅ Detected Dubai/UAE number → Asia/Dubai`)
      return "Asia/Dubai"
    }

    // Default to UK if unknown
    console.log(`   ⚠️  Unknown country code, defaulting to Europe/London`)
    return "Europe/London"
  }

  /**
   * Get timezone name for display
   * @param {string} timezone - IANA timezone
   * @returns {string} - Human-readable name
   */
  static getTimezoneName(timezone) {
    const names = {
      "Europe/London": "UK (London)",
      "Asia/Dubai": "UAE (Dubai)"
    }
    return names[timezone] || timezone
  }

  /**
   * Test timezone detection
   */
  static runTests() {
    console.log('\n🧪 Testing Timezone Detection:\n')

    const testCases = [
      { phone: '+447700900123', expected: 'Europe/London' },
      { phone: '447700900123', expected: 'Europe/London' },
      { phone: '+44 7700 900 123', expected: 'Europe/London' },
      { phone: '+971501234567', expected: 'Asia/Dubai' },
      { phone: '971501234567', expected: 'Asia/Dubai' },
      { phone: '+971 50 123 4567', expected: 'Asia/Dubai' },
      { phone: '+12136064730', expected: 'Europe/London' }, // Unknown → default
      { phone: null, expected: 'Europe/London' } // Null → default
    ]

    testCases.forEach((test, index) => {
      const result = this.detectFromPhone(test.phone)
      const status = result === test.expected ? '✅' : '❌'
      console.log(`${status} Test ${index + 1}: ${test.phone} → ${result} (expected: ${test.expected})`)
    })

    console.log('\n')
  }
}

module.exports = TimezoneDetector

// Run tests if executed directly
if (require.main === module) {
  TimezoneDetector.runTests()
}

