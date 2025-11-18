require('dotenv').config()
const axios = require('axios')

/**
 * Get ALL custom field definitions from GHL location
 */

async function getAllCustomFields() {
  console.log("\n🔍 Fetching custom field definitions from GHL location...")
  
  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${process.env.GHL_LOCATION_ID}/customFields`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          Version: "2021-07-28"
        }
      }
    )
    
    const customFields = response.data.customFields || response.data.fields || []
    
    if (!customFields || customFields.length === 0) {
      console.log("⚠️  No custom fields found in this location")
      console.log("   Make sure you've created the custom fields in GHL")
      console.log("   Go to: Settings → Custom Fields\n")
      return
    }
    
    console.log(`✅ Found ${customFields.length} custom fields!\n`)
    console.log("=" .repeat(70))
    console.log("📋 CUSTOM FIELD IDs")
    console.log("=".repeat(70))
    console.log("\nCopy this into src/services/ghl-client.js:\n")
    console.log("this.customFieldIds = {")
    
    // Filter and sort the fields we care about
    const targetFields = [
      'next_call_scheduled',
      'call_status',
      'call_result',
      'call_attempts',
      'last_call_time',
      'ended_reason',
      'call_duration',
      'sms_sent',
      'sms_sent_at',
      'vapi_call_id'
    ]
    
    const sortedFields = customFields
      .filter(f => f.name && f.id)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    
    let foundCount = 0
    
    sortedFields.forEach(field => {
      const key = (field.name || '').toLowerCase().replace(/\s+/g, '_')
      
      // Only show fields we need for smart retry
      if (targetFields.includes(key)) {
        console.log(`  ${key}: "${field.id}", // ${field.name}`)
        foundCount++
      }
    })
    
    console.log("}\n")
    console.log("=" .repeat(70))
    console.log(`\n✅ Found ${foundCount}/${targetFields.length} smart retry fields`)
    
    if (foundCount < targetFields.length) {
      console.log(`\n⚠️  Missing ${targetFields.length - foundCount} fields. You need to create:`)
      
      sortedFields.forEach(field => {
        const key = (field.name || '').toLowerCase().replace(/\s+/g, '_')
        if (!targetFields.includes(key)) {
          console.log(`   - ${field.name}`)
        }
      })
    }
    
    console.log("\n📋 All custom fields in your location:")
    sortedFields.forEach(field => {
      const key = (field.name || '').toLowerCase().replace(/\s+/g, '_')
      console.log(`   - ${field.name} (${key}) → ${field.id}`)
    })
    console.log("")
    
  } catch (error) {
    console.error("\n❌ ERROR fetching custom fields:")
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Message: ${error.response.data?.message || error.message}`)
      
      if (error.response.status === 401) {
        console.error("\n   💡 Authentication error.")
        console.error("   Make sure GHL_API_KEY is set correctly in .env\n")
      } else if (error.response.status === 404) {
        console.error("\n   💡 Location not found.")
        console.error("   Make sure GHL_LOCATION_ID is correct in .env\n")
      }
    } else {
      console.error(`   ${error.message}`)
    }
    
    console.error("")
  }
}

// Run if executed directly
if (require.main === module) {
  getAllCustomFields()
}

module.exports = getAllCustomFields

