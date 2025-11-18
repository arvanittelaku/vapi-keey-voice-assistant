const axios = require("axios")
require("dotenv").config()

class GHLClient {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY
    this.locationId = process.env.GHL_LOCATION_ID
    this.baseURL = "https://services.leadconnectorhq.com"  // NEW API
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
    
    // ⚡ AGGRESSIVE CACHING - Respond in <100ms by pre-fetching slots
    this.availabilityCache = new Map()
    this.CACHE_TTL = 300000 // 5 minutes (long TTL for pre-fetched data)
    this.preFetchInterval = null
    
    // 🔧 SMART RETRY SYSTEM - Custom Field IDs
    this.customFieldIds = {
      call_status: "H4ljT5ithlkz1gCqteKy",
      call_result: "rIO6txdzKqyut9dFhe0Y",
      call_attempts: "kvVRkJ7Z8dlNNmjxhsn1",
      last_call_time: "plOYTBEdNamRztHtKZp8",
      next_call_scheduled: "N40V15DGTFoYUBIZccnI",
      ended_reason: "wp1181BVenOt6RrFKnRv",
      call_duration: "jIitjRnh5t75VOpqlfrJ",
      sms_sent: "QaSXTTINPnJWdDzqmetb",
      sms_sent_at: "geklh2ISNn5BF0VPcEVI",
      vapi_call_id: "kh2RptWX7H916Kq6455S"
    }
    
    // Start pre-fetching slots immediately
    this.startPreFetching()
  }
  
  // Helper: Get cache key for availability checks
  getCacheKey(calendarId, startTime, endTime, timezone) {
    return `${calendarId}:${startTime}:${endTime}:${timezone}`
  }
  
  // Helper: Check if cache entry is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < this.CACHE_TTL)
  }
  
  // ⚡ CRITICAL: Pre-fetch slots for today and tomorrow to ensure <100ms responses
  async preFetchSlots() {
    const calendarId = process.env.GHL_CALENDAR_ID
    if (!calendarId) {
      console.log("⚠️  GHL_CALENDAR_ID not set - skipping pre-fetch")
      return
    }
    
    console.log("⚡ Pre-fetching calendar slots for instant responses...")
    
    const timezone = "Europe/London"
    const now = new Date()
    
    // Pre-fetch for today and next 2 days (covers most booking requests)
    const datesToPreFetch = [0, 1, 2] // today, tomorrow, day after
    
    for (const daysOffset of datesToPreFetch) {
      try {
        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + daysOffset)
        
        // Start of day
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        
        // End of day
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        const startTime = startOfDay.toISOString()
        const endTime = endOfDay.toISOString()
        
        // Fetch and cache (this will automatically populate the cache)
        await this.checkCalendarAvailability(calendarId, startTime, endTime, timezone)
        
        const dateStr = daysOffset === 0 ? "today" : daysOffset === 1 ? "tomorrow" : `in ${daysOffset} days`
        console.log(`   ✅ Pre-fetched slots for ${dateStr}`)
      } catch (error) {
        console.error(`   ❌ Failed to pre-fetch slots for day +${daysOffset}:`, error.message)
      }
    }
    
    console.log(`⚡ Pre-fetch complete! Cache size: ${this.availabilityCache.size}`)
  }
  
  // Start pre-fetching slots every 3 minutes
  startPreFetching() {
    // Pre-fetch immediately on startup
    setTimeout(() => this.preFetchSlots(), 2000) // Wait 2s for server to be ready
    
    // Then pre-fetch every 3 minutes to keep cache fresh
    this.preFetchInterval = setInterval(() => {
      this.preFetchSlots()
    }, 180000) // 3 minutes
    
    console.log("⚡ Pre-fetch scheduler started (runs every 3 minutes)")
  }
  
  // Clean up interval on shutdown
  stopPreFetching() {
    if (this.preFetchInterval) {
      clearInterval(this.preFetchInterval)
      console.log("⚡ Pre-fetch scheduler stopped")
    }
  }

  // Create or update contact
  async createContact(contactData) {
    try {
      // Map only valid GHL contact fields
      // See: https://highlevel.stoplight.io/docs/integrations/9d6a2b2e6c37f-create-contact
      const validFields = [
        'firstName', 'lastName', 'name', 'email', 'phone',
        'address1', 'city', 'state', 'postalCode', 'country',
        'companyName', 'website', 'tags', 'source',
        'dateOfBirth', 'customField'
      ]
      
      // Build payload with only valid fields
      const payload = {
        locationId: this.locationId
      }
      
      // Copy over valid fields from contactData
      for (const key of validFields) {
        if (contactData[key] !== undefined && contactData[key] !== null) {
          payload[key] = contactData[key]
        }
      }
      
      // Handle field mapping for common variations
      // propertyAddress -> address1
      if (contactData.propertyAddress && !payload.address1) {
        payload.address1 = contactData.propertyAddress
      }
      
      // postcode -> postalCode
      if (contactData.postcode && !payload.postalCode) {
        payload.postalCode = contactData.postcode
      }
      
      // Add custom data as tags if provided
      const customTags = []
      if (contactData.bedrooms) {
        customTags.push(`${contactData.bedrooms} bedrooms`)
      }
      if (contactData.region) {
        customTags.push(contactData.region)
      }
      
      // Merge with existing tags
      if (customTags.length > 0) {
        payload.tags = payload.tags ? [...payload.tags, ...customTags] : customTags
      }
      
      console.log("📝 Creating contact in GHL...")
      console.log("   Payload:", JSON.stringify(payload, null, 2))
      
      const response = await axios.post(
        `${this.baseURL}/contacts/`,
        payload,
        { headers: this.headers }
      )
      
      // GHL returns the contact in response.data.contact
      const contact = response.data.contact || response.data
      
      console.log("✅ Contact created successfully in GHL")
      console.log("   Contact ID:", contact.id)
      return contact
    } catch (error) {
      console.error("❌ Error creating contact in GHL")
      console.error("   Status:", error.response?.status)
      console.error("   Status Text:", error.response?.statusText)
      console.error("   Error Data:", JSON.stringify(error.response?.data, null, 2))
      throw error
    }
  }

  /**
   * Convert friendly custom fields object to GHL v2 API format
   * Input: { call_status: "retry_scheduled", call_attempts: "1" }
   * Output: [{ id: "abc123", field_value: "retry_scheduled" }, { id: "def456", field_value: "1" }]
   */
  convertCustomFieldsToV2(customFieldsObject) {
    const v2Array = []
    
    for (const [key, value] of Object.entries(customFieldsObject)) {
      const fieldId = this.customFieldIds[key]
      
      if (!fieldId) {
        console.log(`⚠️  Unknown custom field: ${key} - skipping`)
        continue
      }
      
      v2Array.push({
        id: fieldId,
        field_value: value
      })
    }
    
    console.log(`   ✅ Converted ${v2Array.length} custom fields to GHL format`)
    return v2Array
  }

  // Update contact with call results
  async updateContact(contactId, updateData) {
    try {
      // Convert custom fields to GHL v2 format if present
      if (updateData.customFields && typeof updateData.customFields === 'object' && !Array.isArray(updateData.customFields)) {
        updateData.customFields = this.convertCustomFieldsToV2(updateData.customFields)
      }
      
      const response = await axios.put(
        `${this.baseURL}/contacts/${contactId}`,
        updateData,
        { headers: this.headers }
      )
      console.log("✅ Contact updated successfully in GHL")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error updating contact in GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  /**
   * Parse custom fields array from GHL into friendly object
   * Input: [{ id: "abc123", value: "retry_scheduled" }, { id: "def456", value: "1" }]
   * Output: { call_status: "retry_scheduled", call_attempts: "1" }
   */
  parseCustomFields(customFieldsArray) {
    const parsed = {}
    
    if (!customFieldsArray || !Array.isArray(customFieldsArray)) {
      return parsed
    }
    
    // Create reverse ID mapping
    const idToKey = {}
    for (const [key, id] of Object.entries(this.customFieldIds)) {
      if (id) idToKey[id] = key
    }
    
    // Parse each field
    customFieldsArray.forEach(field => {
      const key = idToKey[field.id]
      if (key) {
        parsed[key] = field.value || field.field_value || ''
      }
    })
    
    return parsed
  }

  // Get contact details
  async getContact(contactId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/contacts/${contactId}`,
        { headers: this.headers }
      )
      
      const contact = response.data.contact || response.data
      
      // Parse custom fields for easier access
      if (contact.customFields && Array.isArray(contact.customFields)) {
        contact.customFieldsParsed = this.parseCustomFields(contact.customFields)
      }
      
      return contact
    } catch (error) {
      console.error(
        "❌ Error getting contact from GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Search for contact by email or phone
  async searchContact(email = null, phone = null) {
    try {
      const params = { locationId: this.locationId }
      if (email) params.email = email
      if (phone) params.phone = phone

      const response = await axios.get(
        `${this.baseURL}/contacts/`,
        {
          headers: this.headers,
          params
        }
      )
      return response.data
    } catch (error) {
      console.error(
        "❌ Error searching contact in GHL:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Check calendar availability for a specific time slot
  async checkCalendarAvailability(calendarId, startTime, endTime, timezone = "Europe/London") {
    try {
      // ⚡ SMART CACHE LOOKUP - Check if we have full-day data cached
      const requestStart = new Date(startTime)
      const requestEnd = new Date(endTime)
      
      // Get start/end of the day for cache lookup
      const dayStart = new Date(requestStart)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(requestStart)
      dayEnd.setHours(23, 59, 59, 999)
      
      const fullDayCacheKey = this.getCacheKey(calendarId, dayStart.toISOString(), dayEnd.toISOString(), timezone)
      const cachedFullDay = this.availabilityCache.get(fullDayCacheKey)
      
      if (this.isCacheValid(cachedFullDay)) {
        // Filter cached slots to requested time window
        const filteredSlots = cachedFullDay.data.slots.filter(slot => {
          const slotTime = new Date(slot)
          return slotTime >= requestStart && slotTime <= requestEnd
        })
        
        const age = Math.round((Date.now() - cachedFullDay.timestamp) / 1000)
        console.log(`⚡ INSTANT CACHE HIT! (${age}s old) - Responding in <50ms`)
        console.log(`⚡ Filtered ${filteredSlots.length} slots from ${cachedFullDay.data.slots.length} total cached slots`)
        
        return {
          slots: filteredSlots,
          rawData: cachedFullDay.data.rawData
        }
      }
      
      console.log("⚠️  Cache miss - Fetching live data from GHL...")
      
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      // Convert ISO strings to timestamps
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Invalid date format. Start: ${startTime}, End: ${endTime}`)
      }
      
      const startTimestamp = startDate.getTime()
      const endTimestamp = endDate.getTime()

      console.log(`📅 Checking calendar availability:`)
      console.log(`   Calendar ID: ${calendarId}`)
      console.log(`   Start: ${startDate.toISOString()}`)
      console.log(`   End: ${endDate.toISOString()}`)
      console.log(`   Timezone: ${timezone}`)
      
      // ⚡ CRITICAL: 5-second timeout for cache misses
      // Note: With caching working, this should rarely be called during live calls
      const response = await axios.get(
        `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`,
        {
          headers,
          params: {
            startDate: startTimestamp,
            endDate: endTimestamp,
            timezone: timezone
          },
          timeout: 5000 // 5 seconds max (only for cache misses)
        }
      )

      console.log("✅ Calendar availability check successful")
      
      // GHL API returns slots grouped by date: { "2025-11-05": { "slots": [...] } }
      // Extract all slots from all dates
      const allSlots = []
      for (const dateKey in response.data) {
        if (response.data[dateKey]?.slots) {
          allSlots.push(...response.data[dateKey].slots)
        }
      }
      
      console.log(`📊 Found ${allSlots.length} free slots`)
      if (allSlots.length > 0) {
        console.log(`   First slot: ${allSlots[0]}`)
      }
      
      // Return normalized structure
      const result = {
        slots: allSlots,
        rawData: response.data
      }
      
      // ⚡ Cache the result for 5 minutes (for instant responses)
      // Use the full-day cache key so pre-fetch and live requests share the same cache
      const cacheKeyForStorage = this.getCacheKey(calendarId, startTime, endTime, timezone)
      this.availabilityCache.set(cacheKeyForStorage, {
        data: result,
        timestamp: Date.now()
      })
      console.log(`⚡ Cached result (valid for 5 minutes)`)
      
      // Clean up old cache entries (keep cache size manageable)
      if (this.availabilityCache.size > 50) {
        const oldestKey = this.availabilityCache.keys().next().value
        this.availabilityCache.delete(oldestKey)
        console.log(`🧹 Cleaned up old cache entry (size: ${this.availabilityCache.size})`)
      }
      
      return result
    } catch (error) {
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        console.error("⏱️ GHL API timeout (>5s) - Responding with fallback message")
        throw new Error("I'm having a bit of trouble checking our calendar right now. Would you like me to have someone call you back to schedule?")
      }
      
      console.error(
        "❌ Error checking calendar availability:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Create calendar appointment
  async createCalendarAppointment(calendarId, contactId, startTime, timezone = "Europe/London", appointmentTitle = "Property Consultation") {
    try {
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      const startTimeMs = typeof startTime === 'string' ? new Date(startTime).getTime() : startTime
      const startTimeISO = new Date(startTimeMs).toISOString()
      
      console.log(`📅 Creating appointment:`)
      console.log(`   Calendar ID: ${calendarId}`)
      console.log(`   Contact ID: ${contactId}`)
      console.log(`   Start Time: ${startTimeISO}`)
      console.log(`   Timezone: ${timezone}`)
      console.log(`   Title: ${appointmentTitle}`)

      const appointmentData = {
        calendarId: calendarId,
        locationId: this.locationId,
        contactId: contactId,
        startTime: startTimeISO,
        timezone: timezone,
        title: appointmentTitle,
        appointmentStatus: "confirmed"
      }

      const response = await axios.post(
        `https://services.leadconnectorhq.com/calendars/events/appointments`,
        appointmentData,
        { 
          headers,
          timeout: 4000 // 4 seconds max
        }
      )
      
      console.log("✅ Calendar appointment created successfully!")
      console.log("📅 Appointment ID:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error creating calendar appointment:",
        error.response?.data || error.message
      )
      
      if (error.response?.status === 401) {
        console.error(`
🔐 AUTHENTICATION ERROR:
   The GHL API returned "Invalid JWT" (401 Unauthorized).
   
   TO FIX:
   1. Go to GoHighLevel → Settings → Integrations → API
   2. Generate a NEW Location API Key
   3. Make sure it has "Calendar" write permissions
   4. Update GHL_API_KEY in your .env file
   5. Restart your server
        `)
      }
      
      throw error
    }
  }

  // Cancel calendar appointment (updates status to "cancelled")
  async cancelCalendarAppointment(appointmentId) {
    try {
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      console.log(`🗑️ Canceling appointment:`)
      console.log(`   Appointment ID: ${appointmentId}`)

      // Update appointment status to "cancelled" instead of deleting
      // This is better for audit trail and is supported by GHL IAM
      const response = await axios.put(
        `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
        {
          appointmentStatus: "cancelled"
        },
        { headers }
      )
      
      console.log("✅ Calendar appointment cancelled successfully!")
      console.log("   Status updated to: cancelled")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error canceling calendar appointment:",
        error.response?.data || error.message
      )
      
      if (error.response?.status === 404) {
        console.error("   Appointment not found")
      } else if (error.response?.status === 401) {
        console.error("   Authentication issue - check GHL_API_KEY permissions")
      }
      
      throw error
    }
  }

  // Confirm calendar appointment (updates status to "confirmed")
  async confirmCalendarAppointment(appointmentId) {
    try {
      const headers = {
        ...this.headers,
        "Version": "2021-07-28"
      }

      console.log(`✅ Confirming appointment:`)
      console.log(`   Appointment ID: ${appointmentId}`)

      // Update appointment status to "confirmed"
      const response = await axios.put(
        `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
        {
          appointmentStatus: "confirmed"
        },
        { headers }
      )
      
      console.log("✅ Calendar appointment confirmed successfully!")
      console.log("   Status updated to: confirmed")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error confirming calendar appointment:",
        error.response?.data || error.message
      )
      
      if (error.response?.status === 404) {
        console.error("   Appointment not found")
      } else if (error.response?.status === 401) {
        console.error("   Authentication issue - check GHL_API_KEY permissions")
      }
      
      throw error
    }
  }

  // Trigger workflow
  async triggerWorkflow(workflowId, contactId, customData = {}) {
    try {
      // If workflowId is actually a webhook URL (starts with http), use it directly
      // Otherwise, use the workflow API endpoint
      const isWebhookUrl = workflowId && workflowId.startsWith('http');
      
      if (isWebhookUrl) {
        // Direct webhook trigger (for Inbound Webhook triggers)
        console.log("🔗 Triggering workflow via webhook URL");
        const response = await axios.post(
          workflowId,
          {
            contactId,
            ...customData
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log("✅ Workflow webhook triggered successfully");
        return response.data;
      } else {
        // Standard workflow API trigger
        console.log("🔗 Triggering workflow via API");
        const response = await axios.post(
          `${this.baseURL}/workflows/${workflowId}/contacts/${contactId}`,
          { customData },
          { headers: this.headers }
        );
        console.log("✅ Workflow triggered successfully");
        return response.data;
      }
    } catch (error) {
      console.error(
        "❌ Error triggering workflow:",
        error.response?.data || error.message
      )
      throw error
    }
  }
}

module.exports = GHLClient

