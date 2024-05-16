const { Resemble } = require("@resemble/node");

const API_KEY = "YjotrhFxU7R1Rx71D7fqggtt"; // Replace with your actual API token
const DATASET_URL =
  "https://myvoiceaudio.s3.us-west-1.amazonaws.com/data+copy.zip"; // Replace with your actual dataset URL

async function createVoice() {
  // Setting the API key
  Resemble.setApiKey(API_KEY);

  // Creating the voice using the dataset
  try {
    const response = await Resemble.v2.voices.create({
      name: "MyVoice", // Name your voice
      dataset_url: DATASET_URL,
    });
    console.log("Voice created successfully:", response);
  } catch (error) {
    console.error("Failed to create voice:", error);
  }
}

createVoice();
