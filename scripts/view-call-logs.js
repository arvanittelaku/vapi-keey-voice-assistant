require("dotenv").config()
const axios = require("axios")

async function viewCallLogs() {
  const apiKey = process.env.VAPI_API_KEY
  const squadId = process.env.VAPI_SQUAD_ID
  const mainAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
  const servicesAssistantId = process.env.VAPI_SERVICES_ASSISTANT_ID
  const pricingAssistantId = process.env.VAPI_PRICING_ASSISTANT_ID

  const baseURL = "https://api.vapi.ai"
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  console.log("\n📊 KEEY VOICE ASSISTANT - CALL LOGS")
  console.log("==================================================\n")

  try {
    // Fetch all calls
    console.log("🔍 Fetching all calls...\n")
    const response = await axios.get(`${baseURL}/call`, { headers })
    const allCalls = response.data

    if (!allCalls || allCalls.length === 0) {
      console.log("❌ No calls found.")
      return
    }

    console.log(`📞 Total Calls: ${allCalls.length}\n`)
    console.log("==================================================\n")

    // Separate calls by type
    const squadCalls = allCalls.filter(call => call.squadId === squadId)
    const mainAssistantCalls = allCalls.filter(call => call.assistantId === mainAssistantId)
    const servicesAssistantCalls = allCalls.filter(call => call.assistantId === servicesAssistantId)
    const pricingAssistantCalls = allCalls.filter(call => call.assistantId === pricingAssistantId)

    // Display Squad Calls
    console.log("🤖 SQUAD CALLS (Keey Property Management Squad)")
    console.log("--------------------------------------------------")
    if (squadCalls.length === 0) {
      console.log("   No squad calls found.\n")
    } else {
      console.log(`   Total: ${squadCalls.length} calls\n`)
      squadCalls.forEach((call, index) => {
        displayCallSummary(call, index + 1)
      })
    }

    // Display Main Assistant Calls
    console.log("\n👤 MAIN ASSISTANT CALLS")
    console.log("--------------------------------------------------")
    if (mainAssistantCalls.length === 0) {
      console.log("   No main assistant calls found.\n")
    } else {
      console.log(`   Total: ${mainAssistantCalls.length} calls\n`)
      mainAssistantCalls.forEach((call, index) => {
        displayCallSummary(call, index + 1)
      })
    }

    // Display Services Assistant Calls
    console.log("\n🛠️  SERVICES ASSISTANT CALLS")
    console.log("--------------------------------------------------")
    if (servicesAssistantCalls.length === 0) {
      console.log("   No services assistant calls found.\n")
    } else {
      console.log(`   Total: ${servicesAssistantCalls.length} calls\n`)
      servicesAssistantCalls.forEach((call, index) => {
        displayCallSummary(call, index + 1)
      })
    }

    // Display Pricing Assistant Calls
    console.log("\n💰 PRICING ASSISTANT CALLS")
    console.log("--------------------------------------------------")
    if (pricingAssistantCalls.length === 0) {
      console.log("   No pricing assistant calls found.\n")
    } else {
      console.log(`   Total: ${pricingAssistantCalls.length} calls\n`)
      pricingAssistantCalls.forEach((call, index) => {
        displayCallSummary(call, index + 1)
      })
    }

    // Call Statistics
    console.log("\n📈 CALL STATISTICS")
    console.log("==================================================")
    
    const statusCounts = {}
    allCalls.forEach(call => {
      statusCounts[call.status] = (statusCounts[call.status] || 0) + 1
    })

    console.log("\n📊 By Status:")
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })

    const typeCounts = {
      inbound: allCalls.filter(c => c.type === 'inboundPhoneCall').length,
      outbound: allCalls.filter(c => c.type === 'outboundPhoneCall').length,
      web: allCalls.filter(c => c.type === 'webCall').length
    }

    console.log("\n📞 By Type:")
    console.log(`   Inbound: ${typeCounts.inbound}`)
    console.log(`   Outbound: ${typeCounts.outbound}`)
    console.log(`   Web: ${typeCounts.web}`)

    const totalCost = allCalls.reduce((sum, call) => sum + (call.cost || 0), 0)
    console.log(`\n💵 Total Cost: $${totalCost.toFixed(4)}`)

    console.log("\n==================================================")
    console.log("\n💡 TIP: To view detailed call information, use:")
    console.log("   node scripts/check-call-status.js")
    console.log("\n📊 Or visit the Vapi Dashboard:")
    console.log("   https://dashboard.vapi.ai/calls\n")

  } catch (error) {
    console.error("❌ Error fetching call logs:")
    console.error(error.response?.data || error.message)
  }
}

function displayCallSummary(call, index) {
  const date = new Date(call.createdAt).toLocaleString()
  const duration = call.endedAt 
    ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) 
    : 0
  
  const customerName = call.customer?.name || 'Unknown'
  const customerNumber = call.customer?.number || 'N/A'
  
  console.log(`   ${index}. ${date}`)
  console.log(`      Customer: ${customerName} (${customerNumber})`)
  console.log(`      Status: ${call.status}`)
  console.log(`      Duration: ${duration}s`)
  console.log(`      Type: ${call.type}`)
  if (call.endedReason) {
    console.log(`      Ended: ${call.endedReason}`)
  }
  if (call.cost) {
    console.log(`      Cost: $${call.cost.toFixed(4)}`)
  }
  console.log(`      ID: ${call.id}`)
  console.log()
}

viewCallLogs()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error.message)
    process.exit(1)
  })

