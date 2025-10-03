export async function recordAudio(duration, filename = "record.wav") {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  let chunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/wav" });

      // Convert Blob → Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1]; // remove "data:audio/wav;base64,"
        resolve(base64data);
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    console.log("Recording...");

    setTimeout(() => {
      mediaRecorder.stop();
      console.log("Recording finished.");
    }, duration * 1000);
  });
}

