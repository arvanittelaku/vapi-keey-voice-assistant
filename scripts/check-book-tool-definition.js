const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'd8cde4628cf511b5cf14c7c106154e226ee7721ba5235319faeac5c2562988aa';
const TOOL_ID = 'd25e90cd-e6dc-423f-9719-96ca8c6541cb'; // book_calendar_appointment_keey

async function checkTool() {
  try {
    const response = await axios.get(`https://api.vapi.ai/tool/${TOOL_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });
    
    console.log("Ì≥ã Current book_calendar_appointment_keey definition:\n");
    console.log(JSON.stringify(response.data.function.parameters, null, 2));
    
    console.log("\n\nÌ¥ç Required fields:", response.data.function.parameters.required);
    
  } catch (error) {
    console.error("‚ùå Error:", error.response?.data || error.message);
  }
}

checkTool();
