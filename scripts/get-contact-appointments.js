const axios = require("axios");
require("dotenv").config();

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_BASE_URL = "https://services.leadconnectorhq.com";

// Contact ID from the URL you provided
const CONTACT_ID = "ZtrIOxo50WVcsLbWK961";

async function getContactAppointments() {
  if (!GHL_API_KEY) {
    console.error("❌ GHL_API_KEY not found in environment variables.");
    process.exit(1);
  }

  try {
    console.log("\n📅 Fetching appointments for contact...");
    console.log(`   Contact ID: ${CONTACT_ID}\n`);

    const response = await axios.get(
      `${GHL_BASE_URL}/contacts/${CONTACT_ID}/appointments`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
        },
      }
    );

    const appointments = response.data.events || response.data.appointments || response.data;
    
    if (!appointments || appointments.length === 0) {
      console.log("❌ No appointments found for this contact.");
      console.log("\n💡 Try creating a test appointment in GHL Calendar first.");
      return;
    }

    console.log(`✅ Found ${appointments.length} appointment(s):\n`);

    appointments.forEach((appt, index) => {
      console.log(`📋 Appointment #${index + 1}:`);
      console.log(`   ID: ${appt.id}`);
      console.log(`   Title: ${appt.title || "N/A"}`);
      console.log(`   Start Time: ${appt.startTime || appt.start_time || "N/A"}`);
      console.log(`   Status: ${appt.status || appt.appointmentStatus || "N/A"}`);
      console.log(`   Calendar: ${appt.calendarId || "N/A"}`);
      console.log("");
    });

    console.log("✅ Copy one of the appointment IDs above to use for testing!");
    
  } catch (error) {
    console.error("❌ Error fetching appointments:", error.message);
    
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log("\n💡 The endpoint might be different. Let me try the calendar events endpoint...");
        
        // Try alternative endpoint
        try {
          const altResponse = await axios.get(
            `${GHL_BASE_URL}/calendars/events`,
            {
              headers: {
                Authorization: `Bearer ${GHL_API_KEY}`,
                Version: "2021-07-28",
              },
              params: {
                contactId: CONTACT_ID
              }
            }
          );
          
          console.log("\n✅ Found via alternative endpoint:");
          console.log(JSON.stringify(altResponse.data, null, 2));
          
        } catch (altError) {
          console.error("❌ Alternative endpoint also failed:", altError.message);
        }
      }
    }
  }
}

getContactAppointments();

