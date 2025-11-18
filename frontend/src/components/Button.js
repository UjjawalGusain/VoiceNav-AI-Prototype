import { recordAudio } from "../utils/recordVoice.js";
import ChatWidget from "./ChatWidget.js";
import { getOrCreateSessionId } from "../utils/sessionId.js";
import { apis } from "../../api.js";
import VoiceNavAgent from "../VoiceNavAgent/VoiceNavAgent.js";

ChatWidget.init();
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
        ChatWidget.appendMessage("System", `Returning in ${i}...`);
        await delay(1000);
    }
}
async function buttonClick() {
    try {
        ChatWidget.show();
        ChatWidget.appendMessage("System", "Recording...");

        const audioBase64 = await recordAudio(10, "temp.wav");
        ChatWidget.appendMessage("System", "Processing...");

        const response = await fetch(apis.transcribe, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                audio_base64: audioBase64,
                audio_mime_type: "audio/wav",
            }),
        });

        const data = await response.json();
        const transcription = data.transcription || "No transcription returned";
        console.log("Transcription: ", data.transcription);
        let i = 0;

        ChatWidget.appendMessage("You", transcription);

        const sessionId = getOrCreateSessionId();
        const agent = new VoiceNavAgent(sessionId, document.body);

        ChatWidget.appendMessage("System", "Planning navigation...");

        const currentPath = window.location.pathname;

        // Plan execution
        await agent.planExecution(transcription, currentPath);

        if (!agent.executionPipeline.length) {
            ChatWidget.appendMessage(
                "System",
                "No navigation steps returned by Foreman."
            );
            localStorage.removeItem(`voicenav_state_${sessionId}`);
            return;
        }

        // Execute steps one by one
        localStorage.removeItem(`voicenav_state_${sessionId}`);
        const stepIndex = 0;
        const step = agent.executionPipeline[stepIndex];

        ChatWidget.appendMessage(
            "System",
            `Executing step ${step.step_number}: ${step.action} from ${step.from_page} → ${step.to_page}`
        );

        const result = await agent.executeStep(step);

        if (result.error) {
            ChatWidget.appendMessage(
                "System",
                `Worker failed at step ${step.step_number}: ${result.error}. Asking Foreman to replan...`
            );
            console.log("Yeah this pipeline failed");
            return;
            ///////////////////////////////////////////////////////////////////
            /// Needs to be worked on **********************////////////////////
            ////////////////////////////////////////////////////////////////////
            await agent.planExecution(transcription);
            stepIndex = -1; // restart execution from new pipeline
        }

        ChatWidget.appendMessage(
            "System",
            `Step ${step.step_number} executing...`
        );

        localStorage.setItem(
            `voicenav_state_${sessionId}`,
            JSON.stringify({
                executionPipeline: agent.executionPipeline,
                currentStepIndex: stepIndex + 1,
                transcription,
            })
        );

        agent.applyExecution(result.execution);

        if(step.action === 'input' || step.action == 'submit') {
          restoreAndRun();
        }

        // ChatWidget.appendMessage("System", "Navigation completed.");
        console.log("[AGENT] Full execution log:", agent.executionLog);
    } catch (err) {
        console.error(err);
        ChatWidget.appendMessage("System", "Error occurred. See console.");
    }
}

export async function restoreAndRun() {
    const sessionId = getOrCreateSessionId();
    const savedStateRaw = localStorage.getItem(`voicenav_state_${sessionId}`);
    const agent = new VoiceNavAgent(sessionId, document.body);
    console.log(`With session id: ${sessionId} and saved raw state: ${savedStateRaw}`);
    
    if (savedStateRaw) {
        try {
            const savedState = JSON.parse(savedStateRaw);
            agent.executionPipeline = savedState.executionPipeline || [];
            let stepIndex = savedState.currentStepIndex || 0;
            console.log(`step index: ${stepIndex}`);
            
            if (
                agent.executionPipeline.length &&
                stepIndex < agent.executionPipeline.length
            ) {
                console.log("Yes we also reached here");
                
                const step = agent.executionPipeline[stepIndex];
                console.log("And this is the new step we have to execute now: ", step);
                
                ChatWidget.appendMessage(
                    "System",
                    `Executing step ${step.step_number}: ${step.action} from ${step.from_page} → ${step.to_page}`
                );

                const result = await agent.executeStep(step);
                if (result.error) {
                    ChatWidget.appendMessage(
                        "System",
                        `Worker failed at step ${step.step_number}: ${result.error}. Asking Foreman to replan...`
                    );
                    await agent.planExecution(savedState.transcription);
                    localStorage.removeItem(`voicenav_state_${sessionId}`);
                    return;
                }

                // Save state *before* applying execution to avoid losing progress if page reload happens
                localStorage.setItem(
                    `voicenav_state_${sessionId}`,
                    JSON.stringify({
                        executionPipeline: agent.executionPipeline,
                        currentStepIndex: stepIndex + 1,
                        transcription: savedState.transcription,
                    })
                );

                agent.applyExecution(result.execution);
                
                if(step.action === 'input' || step.action == 'submit') {
                  restoreAndRun();
                }

            }
        } catch (e) {
            console.error("Error restoring saved voice nav state:", e);
            localStorage.removeItem(`voicenav_state_${sessionId}`);
        }
    }
}

function getButton(config) {
    const button = document.createElement("button");
    button.type = "button";

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
    button.classList.add("voicenav-vnode-ignore")

    const img = document.createElement("img");
    img.src = "https://storage.googleapis.com/voice_recording_bucket/icon.png";
    img.alt = "VoiceNav Icon";
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";

    button.appendChild(img);

    document.body.appendChild(button);

    button.addEventListener("click", () => {
        buttonClick();
    });

    console.log("VoiceNav initialized with config", config);
}

export default getButton;
