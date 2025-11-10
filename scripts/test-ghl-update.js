require("dotenv").config();
const axios = require("axios");

async function testCustomFieldUpdate() {
  try {
    const contactId = "ZtrIOxo50WVcsLbWK961";
    const apiKey = process.env.GHL_API_KEY;

    console.log("🧪 Testing different custom field update formats...\n");

    // Test 1: Using field key (without "contact." prefix)
    console.log("Test 1: Using field key 'confirmation'");
    try {
      const response1 = await axios.put(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          customField: {
            confirmation: "confirmed"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );
      console.log("✅ Test 1 SUCCESS - field key works!");
      console.log("Response:", response1.data);
      return;
    } catch (error) {
      console.log("❌ Test 1 FAILED:", error.response?.data?.message || error.message);
    }

    // Test 2: Using full field key with prefix
    console.log("\nTest 2: Using field key 'contact.confirmation'");
    try {
      const response2 = await axios.put(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          customField: {
            "contact.confirmation": "confirmed"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );
      console.log("✅ Test 2 SUCCESS - full field key works!");
      console.log("Response:", response2.data);
      return;
    } catch (error) {
      console.log("❌ Test 2 FAILED:", error.response?.data?.message || error.message);
    }

    // Test 3: Using customFields array
    console.log("\nTest 3: Using customFields array with ID");
    try {
      const response3 = await axios.put(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          customFields: [
            {
              id: "YLvP62hGzQMhfl2YMxTj",
              value: "confirmed"
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );
      console.log("✅ Test 3 SUCCESS - customFields array works!");
      console.log("Response:", response3.data);
      return;
    } catch (error) {
      console.log("❌ Test 3 FAILED:", error.response?.data?.message || error.message);
    }

    // Test 4: Direct field ID property
    console.log("\nTest 4: Direct field ID as property");
    try {
      const response4 = await axios.put(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          "YLvP62hGzQMhfl2YMxTj": "confirmed"
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );
      console.log("✅ Test 4 SUCCESS - direct field ID works!");
      console.log("Response:", response4.data);
      return;
    } catch (error) {
      console.log("❌ Test 4 FAILED:", error.response?.data?.message || error.message);
    }

    console.log("\n❌ All tests failed. Custom field update format is different.");

  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

testCustomFieldUpdate();

