const axios = require("axios")
require("dotenv").config()

class VapiClient {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY
    this.baseURL = "https://api.vapi.ai"
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  // Create a new assistant
  async createAssistant(config) {
    try {
      const response = await axios.post(`${this.baseURL}/assistant`, config, {
        headers: this.headers,
      })
      console.log("✅ Assistant created successfully:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error creating assistant:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Update an existing assistant
  async updateAssistant(assistantId, config) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/assistant/${assistantId}`,
        config,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Assistant updated successfully")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error updating assistant:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get assistant details
  async getAssistant(assistantId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/assistant/${assistantId}`,
        {
          headers: this.headers,
        }
      )
      return response.data
    } catch (error) {
      console.error(
        "❌ Error getting assistant:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Delete an assistant
  async deleteAssistant(assistantId) {
    try {
      const response = await axios.delete(
        `${this.baseURL}/assistant/${assistantId}`,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Assistant deleted successfully")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error deleting assistant:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Make a call
  async makeCall(callData) {
    try {
      console.log("🔍 VAPI CLIENT - Call data being sent to Vapi API:")
      console.log(JSON.stringify(callData, null, 2))
      
      const response = await axios.post(`${this.baseURL}/call`, callData, {
        headers: this.headers,
      })
      console.log("✅ Call initiated successfully:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error making call:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get call details
  async getCall(callId) {
    try {
      const response = await axios.get(`${this.baseURL}/call/${callId}`, {
        headers: this.headers,
      })
      return response.data
    } catch (error) {
      console.error(
        "❌ Error getting call:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get phone numbers
  async getPhoneNumbers() {
    try {
      const response = await axios.get(`${this.baseURL}/phone-number`, {
        headers: this.headers,
      })
      return response.data
    } catch (error) {
      console.error(
        "❌ Error getting phone numbers:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Create a phone number
  async createPhoneNumber(phoneNumberData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/phone-number`,
        phoneNumberData,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Phone number created successfully:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error creating phone number:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Create a squad (group of assistants)
  async createSquad(squadConfig) {
    try {
      const response = await axios.post(
        `${this.baseURL}/squad`,
        squadConfig,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Squad created successfully:", response.data.id)
      return response.data
    } catch (error) {
      console.error(
        "❌ Error creating squad:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Update an existing squad
  async updateSquad(squadId, squadConfig) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/squad/${squadId}`,
        squadConfig,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Squad updated successfully")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error updating squad:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get squad details
  async getSquad(squadId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/squad/${squadId}`,
        {
          headers: this.headers,
        }
      )
      return response.data
    } catch (error) {
      console.error(
        "❌ Error getting squad:",
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Delete a squad
  async deleteSquad(squadId) {
    try {
      const response = await axios.delete(
        `${this.baseURL}/squad/${squadId}`,
        {
          headers: this.headers,
        }
      )
      console.log("✅ Squad deleted successfully")
      return response.data
    } catch (error) {
      console.error(
        "❌ Error deleting squad:",
        error.response?.data || error.message
      )
      throw error
    }
  }
}

module.exports = VapiClient

