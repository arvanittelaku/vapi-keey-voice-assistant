require('dotenv').config()
const axios = require('axios')

/**
 * Helper script to get custom field IDs from GHL
 * 
 * Usage:
 * 1. Replace testContactId with a real contact ID from your GHL account
 * 2. Run: node scripts/get-field-ids.js
 * 3. Copy the output into src/services/ghl-client.js
 */

async function getFieldIds() {
  // ⚠️  IMPORTANT: Replace this with a real contact ID from your GHL account
  const testContactId = "ZtrIOxo50WVcsLbWK961"
  
  if (testContactId === "REPLACE_WITH_REAL_CONTACT_ID") {
    console.error("\n❌ ERROR: You need to replace 'REPLACE_WITH_REAL_CONTACT_ID' with an actual contact ID\n")
    console.log("📝 To get a contact ID:")
    console.log("   1. Go to GHL → Contacts")
    console.log("   2. Open any contact")
    console.log("   3. Copy the ID from the URL (the long string of characters)\n")
    process.exit(1)
  }
  
  console.log("\n🔍 Fetching custom fields from GHL...")
  console.log(`📋 Contact ID: ${testContactId}\n`)
  
  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/contacts/${testContactId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          Version: "2021-07-28"
        }
      }
    )
    
    const contact = response.data.contact || response.data
    
    if (!contact.customFields || contact.customFields.length === 0) {
      console.log("⚠️  No custom fields found for this contact")
      console.log("   Make sure you've created the custom fields in GHL first")
      console.log("   See: GHL_CUSTOM_FIELDS_SETUP.md for instructions\n")
      return
    }
    
    console.log("✅ Successfully fetched custom fields!\n")
    console.log("=" .repeat(70))
    console.log("📋 CUSTOM FIELD IDs")
    console.log("=".repeat(70))
    console.log("\nCopy this into src/services/ghl-client.js:\n")
    console.log("this.customFieldIds = {")
    
    // Sort fields alphabetically for easier reading
    const sortedFields = contact.customFields.filter(f => f.name && f.id).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    )
    
    sortedFields.forEach(field => {
      // Convert field name to snake_case key
      const key = (field.name || 'unknown').toLowerCase().replace(/\s+/g, '_')
      const value = field.value || field.field_value || '(empty)'
      
      console.log(`  ${key}: "${field.id}", // ${field.name} = ${value}`)
    })
    
    console.log("}\n")
    console.log("=" .repeat(70))
    console.log(`\n✅ Found ${sortedFields.length} custom fields\n`)
    
  } catch (error) {
    console.error("\n❌ ERROR fetching custom fields:")
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Message: ${error.response.data?.message || error.message}`)
      
      if (error.response.status === 401) {
        console.error("\n   💡 This looks like an authentication error.")
        console.error("   Make sure your GHL_API_KEY is set correctly in .env\n")
      } else if (error.response.status === 404) {
        console.error("\n   💡 Contact not found.")
        console.error("   Make sure the contact ID is correct\n")
      }
    } else {
      console.error(`   ${error.message}`)
    }
    
    console.error("")
  }
}

// Run if executed directly
if (require.main === module) {
  getFieldIds()
}

module.exports = getFieldIds

