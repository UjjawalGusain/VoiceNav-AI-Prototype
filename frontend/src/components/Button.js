import { recordAudio } from "../utils/recordVoice.js";
import ChatWidget from "./ChatWidget.js";
import { getOrCreateSessionId } from "../utils/sessionId.js";
import { apis } from "../../api.js";

ChatWidget.init();
async function buttonClick() {
  try {
    ChatWidget.show();

    ChatWidget.appendMessage("System", "Recording...");
    const audioBase64 = await recordAudio(10, "temp.wav");
    ChatWidget.appendMessage("System", "Processing...");

    const response = await fetch(apis.transcribe, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: audioBase64, audio_mime_type: "audio/wav" }),
    });

    const data = await response.json();
    ChatWidget.appendMessage("You", data.transcription || "No transcription returned");

    const sessionId = getOrCreateSessionId();

    const executionPipelineResponse = await fetch(apis.navigate, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        dag_url: "https://storage.googleapis.com/voice_recording_bucket/dag2.json",
        query: data.transcription
      }),
    });

    const executionPipeline = await executionPipelineResponse.json();
    console.log(executionPipeline);
    

  } catch (err) {
    console.error(err);
    ChatWidget.appendMessage("System", "Error occurred. See console.");
  }
}



function getButton(config) {
  const button = document.createElement("button");
  
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.width = "50px";
  button.style.height = "50px";
  button.style.borderRadius = "50%"; 
  button.style.border = "3px solid #4A90E2"; 
  button.style.backgroundColor = "white";
  button.style.color = "#4A90E2"; 
  button.style.fontSize = "32px"; 
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  button.style.zIndex = 9999;
  button.style.padding = 0;

  const img = document.createElement("img");
  img.src = "public/icon.png";  
  img.alt = "VoiceNav Icon";
  img.style.width = "50px"; 
  img.style.height = "50px";
  img.style.objectFit = "fill";
  img.style.pointerEvents = "none"; 

  button.appendChild(img);

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    buttonClick()
  });

  console.log("VoiceNav initialized with config", config);
}

export default getButton;
