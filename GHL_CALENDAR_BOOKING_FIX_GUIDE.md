# 🔧 GHL Calendar Booking Fix Guide

**For Your Other Project**

## 🎯 Problem Summary

Your other project can:
- ✅ Save contacts to GHL (`send_ghl_info` works)
- ✅ Check calendar availability (`check_calendar_availability` works)
- ✅ Validate specific time slots (`check_specific_time_slot` works)

But **FAILS** at:
- ❌ Booking appointments (all 3 GHL API endpoints return 404)
- ❌ Appointments don't appear in GHL dashboard
- ❌ Booking custom fields not updated

---

## 🔍 Root Cause Analysis

Based on our **working** Keey project, the 404 errors are likely caused by:

### 1. **Wrong API Base URL**
❌ Old API: `https://rest.gohighlevel.com`  
✅ New API: `https://services.leadconnectorhq.com`

### 2. **Missing API Version Header**
❌ No version header  
✅ **Required**: `"Version": "2021-07-28"`

### 3. **Wrong Endpoint Paths**
Your project tried these (all 404):
- ❌ `/calendars/{calendarId}/appointments`
- ❌ `/appointments`
- ❌ `/locations/{locationId}/appointments`

**Correct endpoints:**
- ✅ Check availability: `/calendars/{calendarId}/free-slots`
- ✅ Book appointment: `/calendars/events/appointments`
- ✅ Update appointment: `/calendars/events/appointments/{appointmentId}`

### 4. **Wrong API Key Type**
❌ **Agency API Key** (doesn't have calendar access)  
✅ **Location API Key** (has calendar permissions)

### 5. **Missing Calendar Permissions**
Even with a Location API Key, you need:
- ✅ Calendar **READ** permission
- ✅ Calendar **WRITE** permission

---

## ✅ What We Do in the Working Keey Project

### 1. **API Configuration** (`src/services/ghl-client.js`)

```javascript
class GHLClient {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY           // Location API Key
    this.locationId = process.env.GHL_LOCATION_ID   // Location ID
    this.baseURL = "https://services.leadconnectorhq.com"  // NEW API
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"  // ⚡ CRITICAL!
    }
  }
}
```

### 2. **Check Calendar Availability** (Works in Both Projects)

```javascript
async checkCalendarAvailability(calendarId, startTime, endTime, timezone = "Europe/London") {
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  
  const response = await axios.get(
    `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`,
    {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      params: {
        startDate: startDate.getTime(),  // Timestamp in milliseconds
        endDate: endDate.getTime(),      // Timestamp in milliseconds
        timezone: timezone
      }
    }
  )
  
  // Response format: { "2025-11-05": { "slots": ["2025-11-05T09:00:00Z", ...] } }
  return response.data
}
```

### 3. **Book Calendar Appointment** (THIS is what's failing in your other project)

```javascript
async createCalendarAppointment(calendarId, contactId, startTime, timezone = "Europe/London", appointmentTitle = "Property Consultation") {
  const headers = {
    Authorization: `Bearer ${this.apiKey}`,
    "Content-Type": "application/json",
    "Version": "2021-07-28"  // ⚡ CRITICAL!
  }

  const startTimeISO = new Date(startTime).toISOString()
  
  const appointmentData = {
    calendarId: calendarId,          // Required
    locationId: this.locationId,     // Required
    contactId: contactId,            // Required
    startTime: startTimeISO,         // ISO string: "2025-11-27T14:00:00.000Z"
    timezone: timezone,              // "Europe/London" or "Asia/Dubai"
    title: appointmentTitle,         // "Property Consultation"
    appointmentStatus: "confirmed"   // "confirmed" or "pending"
  }

  const response = await axios.post(
    `https://services.leadconnectorhq.com/calendars/events/appointments`,  // ⚡ CORRECT ENDPOINT
    appointmentData,
    { headers }
  )
  
  console.log("✅ Appointment created!")
  console.log("   Appointment ID:", response.data.id)
  return response.data
}
```

### 4. **Cancel Appointment**

```javascript
async cancelCalendarAppointment(appointmentId) {
  const response = await axios.put(
    `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
    { appointmentStatus: "cancelled" },
    { headers: {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }}
  )
  
  return response.data
}
```

### 5. **Confirm Appointment**

```javascript
async confirmCalendarAppointment(appointmentId) {
  const response = await axios.put(
    `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
    { appointmentStatus: "confirmed" },
    { headers: {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }}
  )
  
  return response.data
}
```

---

## 🚀 Step-by-Step Fix for Your Other Project

### **Step 1: Verify API Credentials**

Check your `.env` file:

```bash
GHL_API_KEY=eyJhbGc...  # Should be a Location API Key (NOT Agency)
GHL_LOCATION_ID=SMEvb6HVyyzvx0EekevW
GHL_CALENDAR_ID=fxuTx3pBbcUUBW2zMhSN
```

**How to verify:**

1. Go to **GHL → Settings → Integrations → API**
2. Look for "**Location API Key**" (not "Agency API Key")
3. Make sure it has these permissions:
   - ✅ Contacts (Read/Write)
   - ✅ **Calendar (Read/Write)** ← CRITICAL
   - ✅ Custom Fields (Read/Write)
4. If missing, **regenerate the key** with correct permissions

### **Step 2: Get the Correct Calendar ID**

```bash
# Test script to get your calendar ID
curl -X GET \
  "https://services.leadconnectorhq.com/calendars/" \
  -H "Authorization: Bearer YOUR_GHL_API_KEY" \
  -H "Version: 2021-07-28"
```

Response will show all calendars:
```json
{
  "calendars": [
    {
      "id": "fxuTx3pBbcUUBW2zMhSN",  ← Use this ID
      "name": "Keey Consultations",
      "locationId": "SMEvb6HVyyzvx0EekevW"
    }
  ]
}
```

### **Step 3: Update Your GHL Client Code**

Find your GHL client file (probably `ghl-client.js` or similar) and update:

#### **BEFORE (Likely what you have):**
```javascript
this.baseURL = "https://rest.gohighlevel.com"  // ❌ OLD API
this.headers = {
  Authorization: `Bearer ${this.apiKey}`,
  "Content-Type": "application/json"
  // Missing Version header!
}
```

#### **AFTER (Correct):**
```javascript
this.baseURL = "https://services.leadconnectorhq.com"  // ✅ NEW API
this.headers = {
  Authorization: `Bearer ${this.apiKey}`,
  "Content-Type": "application/json",
  "Version": "2021-07-28"  // ✅ CRITICAL!
}
```

### **Step 4: Update Booking Function**

Find your `book_calendar_appointment` function and replace it with:

```javascript
async bookCalendarAppointment(calendarId, contactId, startTime, timezone = "Europe/London") {
  try {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"  // ⚡ DON'T FORGET THIS!
    }

    // Ensure startTime is ISO string
    const startTimeISO = typeof startTime === 'string' 
      ? new Date(startTime).toISOString() 
      : new Date(startTime).toISOString()

    const appointmentData = {
      calendarId: calendarId,
      locationId: this.locationId,  // From process.env.GHL_LOCATION_ID
      contactId: contactId,
      startTime: startTimeISO,
      timezone: timezone,
      title: "Property Consultation",
      appointmentStatus: "confirmed"
    }

    console.log("📅 Creating appointment...")
    console.log("   Endpoint:", `https://services.leadconnectorhq.com/calendars/events/appointments`)
    console.log("   Payload:", JSON.stringify(appointmentData, null, 2))

    const response = await axios.post(
      `https://services.leadconnectorhq.com/calendars/events/appointments`,
      appointmentData,
      { headers }
    )

    console.log("✅ Appointment created successfully!")
    console.log("   Appointment ID:", response.data.id)
    return response.data
  } catch (error) {
    console.error("❌ Error creating appointment:")
    console.error("   Status:", error.response?.status)
    console.error("   Error:", error.response?.data)
    throw error
  }
}
```

### **Step 5: Test the Fix**

Create a test script (`test-booking.js`):

```javascript
require('dotenv').config()
const axios = require('axios')

async function testBooking() {
  const GHL_API_KEY = process.env.GHL_API_KEY
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID
  const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID
  
  console.log("🧪 Testing GHL Calendar Booking...")
  console.log(`   Location ID: ${GHL_LOCATION_ID}`)
  console.log(`   Calendar ID: ${GHL_CALENDAR_ID}`)
  
  // Step 1: Create a test contact
  console.log("\n📝 Step 1: Creating test contact...")
  const contactResponse = await axios.post(
    'https://services.leadconnectorhq.com/contacts/',
    {
      locationId: GHL_LOCATION_ID,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+447700900111'
    },
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    }
  )
  
  const contactId = contactResponse.data.contact?.id || contactResponse.data.id
  console.log(`✅ Contact created: ${contactId}`)
  
  // Step 2: Check availability
  console.log("\n📅 Step 2: Checking calendar availability...")
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(tomorrow)
  endOfDay.setHours(23, 59, 59, 999)
  
  const slotsResponse = await axios.get(
    `https://services.leadconnectorhq.com/calendars/${GHL_CALENDAR_ID}/free-slots`,
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      params: {
        startDate: tomorrow.getTime(),
        endDate: endOfDay.getTime(),
        timezone: 'Europe/London'
      }
    }
  )
  
  // Extract first available slot
  let firstSlot = null
  for (const dateKey in slotsResponse.data) {
    if (slotsResponse.data[dateKey]?.slots?.length > 0) {
      firstSlot = slotsResponse.data[dateKey].slots[0]
      break
    }
  }
  
  if (!firstSlot) {
    console.log("⚠️  No available slots found for tomorrow")
    return
  }
  
  console.log(`✅ Found ${Object.keys(slotsResponse.data).length} days with slots`)
  console.log(`   First slot: ${firstSlot}`)
  
  // Step 3: Book appointment
  console.log("\n📅 Step 3: Booking appointment...")
  const appointmentResponse = await axios.post(
    'https://services.leadconnectorhq.com/calendars/events/appointments',
    {
      calendarId: GHL_CALENDAR_ID,
      locationId: GHL_LOCATION_ID,
      contactId: contactId,
      startTime: firstSlot,
      timezone: 'Europe/London',
      title: 'Test Consultation',
      appointmentStatus: 'confirmed'
    },
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    }
  )
  
  const appointmentId = appointmentResponse.data.id
  console.log(`✅ Appointment booked successfully!`)
  console.log(`   Appointment ID: ${appointmentId}`)
  console.log(`   Contact ID: ${contactId}`)
  console.log(`   Start Time: ${firstSlot}`)
  console.log(`\n✅ ALL TESTS PASSED! Booking is working!`)
  console.log(`\n📱 Check GHL dashboard:`)
  console.log(`   https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/appointments`)
}

testBooking().catch(error => {
  console.error("\n❌ TEST FAILED:")
  console.error("   Status:", error.response?.status)
  console.error("   Error:", JSON.stringify(error.response?.data, null, 2))
})
```

Run it:
```bash
node test-booking.js
```

### **Step 6: Verify in GHL Dashboard**

1. Go to GHL Dashboard
2. Navigate to **Calendar** or **Appointments**
3. You should see your test appointment!
4. If you see it → **SUCCESS!** 🎉

---

## 🔑 Key Differences Between Working vs Broken Setup

| Aspect | ❌ Your Other Project (Broken) | ✅ Keey Project (Working) |
|--------|-------------------------------|---------------------------|
| **Base URL** | `https://rest.gohighlevel.com` | `https://services.leadconnectorhq.com` |
| **Version Header** | Missing or wrong | `"Version": "2021-07-28"` |
| **Booking Endpoint** | `/calendars/{id}/appointments` | `/calendars/events/appointments` |
| **API Key Type** | Possibly Agency API | Location API Key |
| **Calendar Permission** | Maybe missing | ✅ Enabled (Read/Write) |
| **Payload Format** | Unknown | See above (includes locationId, calendarId, contactId, etc.) |

---

## 🎯 Quick Checklist

Use this to verify your fix:

```bash
# 1. Check API credentials
✅ Using Location API Key (not Agency)
✅ API Key has Calendar Read/Write permissions
✅ GHL_LOCATION_ID is correct
✅ GHL_CALENDAR_ID exists and is accessible

# 2. Check code configuration
✅ Base URL: https://services.leadconnectorhq.com
✅ Version header: "2021-07-28"
✅ Booking endpoint: /calendars/events/appointments
✅ Update endpoint: /calendars/events/appointments/{id}

# 3. Check payload structure
✅ Includes calendarId
✅ Includes locationId
✅ Includes contactId
✅ startTime is ISO string
✅ timezone is set
✅ appointmentStatus is "confirmed" or "pending"

# 4. Test it
✅ Run test script
✅ Check GHL dashboard for appointment
✅ Verify appointment has correct details
```

---

## 🆘 If It Still Doesn't Work

### **Test 1: Verify API Key Permissions**

```bash
# Get all calendars (tests read permission)
curl -X GET \
  "https://services.leadconnectorhq.com/calendars/" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Version: 2021-07-28"
```

**Expected:** List of calendars  
**If 401:** API key is invalid  
**If 403:** API key lacks permissions  
**If 404:** Wrong endpoint or API version

### **Test 2: Create Contact First**

Your booking might be failing because:
- Contact doesn't exist in GHL
- Contact ID is wrong
- Contact is not in the same location

**Solution:** Always create the contact first (which you already do with `send_ghl_info`), then use the returned `contact.id` for booking.

### **Test 3: Check API Response**

Add detailed logging:

```javascript
try {
  const response = await axios.post(url, data, { headers })
  console.log("✅ Success:", response.data)
} catch (error) {
  console.error("❌ Failed:")
  console.error("   Status:", error.response?.status)
  console.error("   Status Text:", error.response?.statusText)
  console.error("   Headers:", error.response?.headers)
  console.error("   Data:", JSON.stringify(error.response?.data, null, 2))
  console.error("   Request URL:", error.config?.url)
  console.error("   Request Data:", JSON.stringify(error.config?.data, null, 2))
}
```

---

## 📚 Additional Resources

### **GHL API Documentation**
- **Calendar API**: https://highlevel.stoplight.io/docs/integrations/calendar
- **Appointments**: https://highlevel.stoplight.io/docs/integrations/appointments

### **Common Error Codes**
- **401 Unauthorized**: Invalid API key or missing permissions
- **403 Forbidden**: API key doesn't have calendar permissions
- **404 Not Found**: Wrong endpoint or calendar doesn't exist
- **422 Unprocessable**: Invalid payload (missing required fields)
- **500 Server Error**: GHL API issue (retry later)

---

## ✅ Summary

**The main issues causing 404 errors:**

1. ❌ Using old API base URL → ✅ Use `https://services.leadconnectorhq.com`
2. ❌ Missing Version header → ✅ Add `"Version": "2021-07-28"`
3. ❌ Wrong endpoint path → ✅ Use `/calendars/events/appointments`
4. ❌ Wrong API key type → ✅ Use Location API Key with Calendar permissions
5. ❌ Missing required fields → ✅ Include `locationId`, `calendarId`, `contactId`

**Follow the steps above, run the test script, and you should see appointments appearing in GHL!** 🎉

---

**Good luck! Let me know if you need any clarification.** 🚀

