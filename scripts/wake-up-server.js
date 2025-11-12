/**
 * Wake up the Render server before making real calls
 * Run this 30 seconds before triggering a call
 */

const axios = require('axios');

const SERVER_URL = process.env.RENDER_URL || 'https://vapi-keey-voice-assistant.onrender.com';

async function wakeUpServer() {
  console.log('\n🔥 Waking up Render server...\n');
  console.log(`Server: ${SERVER_URL}`);
  console.log('This may take 30+ seconds if the server is sleeping...\n');

  const startTime = Date.now();

  try {
    const response = await axios.get(`${SERVER_URL}/health`, {
      timeout: 60000, // 60 second timeout
    });

    const latency = Date.now() - startTime;

    console.log(`✅ Server is awake!`);
    console.log(`⏱️  Took ${(latency / 1000).toFixed(1)} seconds`);
    console.log(`📊 Status: ${response.data.status}`);
    
    if (latency > 10000) {
      console.log('\n🔥 Server was sleeping - it took', (latency / 1000).toFixed(1), 'seconds to wake up');
      console.log('Wait 10 more seconds, then make your call.');
    } else {
      console.log('\n✅ Server was already warm - you can make your call now!');
    }

  } catch (error) {
    console.log(`❌ Failed to wake server: ${error.message}`);
  }

  console.log('\n');
}

wakeUpServer();

