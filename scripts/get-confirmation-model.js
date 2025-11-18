require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function getConfirmationModel() {
  try {
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    console.log('\n📋 CURRENT MODEL CONFIGURATION:\n');
    console.log(JSON.stringify(response.data.model, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

getConfirmationModel();

