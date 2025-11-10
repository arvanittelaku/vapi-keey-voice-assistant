require("dotenv").config();
const axios = require("axios");

async function getCustomFields() {
  try {
    const locationId = process.env.GHL_LOCATION_ID;
    const apiKey = process.env.GHL_API_KEY;

    console.log("🔍 Fetching custom fields from GHL...\n");

    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
        },
      }
    );

    console.log("✅ Custom Fields Found:\n");
    
    if (response.data.customFields && response.data.customFields.length > 0) {
      response.data.customFields.forEach((field) => {
        console.log(`📋 Field Name: ${field.name}`);
        console.log(`   ID: ${field.id}`);
        console.log(`   Key: ${field.fieldKey || "N/A"}`);
        console.log(`   Type: ${field.dataType}`);
        console.log("");
      });

      // Find the confirmation field
      const confirmationField = response.data.customFields.find(
        (f) => f.fieldKey === "confirmation" || f.name.toLowerCase().includes("confirmation")
      );

      if (confirmationField) {
        console.log("✅ CONFIRMATION FIELD FOUND:");
        console.log(`   ID: ${confirmationField.id}`);
        console.log(`   Field Key: ${confirmationField.fieldKey}`);
        console.log("\n📝 Use this ID to update the custom field:");
        console.log(`   updateData = { "${confirmationField.id}": "confirmed" }`);
      } else {
        console.log("⚠️  Confirmation field not found.");
        console.log("   Please create it in GHL Settings → Custom Fields");
      }
    } else {
      console.log("⚠️  No custom fields found for this location.");
    }
  } catch (error) {
    console.error("❌ Error fetching custom fields:");
    console.error("   Status:", error.response?.status);
    console.error("   Message:", error.response?.data?.message || error.message);
  }
}

getCustomFields();

