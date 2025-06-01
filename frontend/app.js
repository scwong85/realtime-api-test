const backendUrl = "https://your-backend-url.onrender.com"; // Replace with your actual backend

const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send-btn");
const textInput = document.getElementById("text-input");
const status = document.getElementById("status");
const replayBtn = document.getElementById("replay-btn");

let recognition;
let lastAudioData = null;

// --- Speech Recognition Setup ---
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    console.log("🎤 Mic listening...");
    status.textContent = "🎤 Listening...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("🎙️ Transcript: ", transcript);
    status.textContent = "⏳ Processing...";
    await processText(transcript);
  };

  recognition.onerror = (event) => {
    console.error("❌ Speech error:", event.error);
    status.textContent = "❌ Mic error: " + event.error;
  };

  recognition.onend = () => {
    console.log("🎤 Mic ended");
    if (status.textContent === "🎤 Listening...") {
      status.textContent = "⚠️ No speech detected.";
    }
  };
} else {
  micBtn.disabled = true;
  status.textContent = "❌ Your browser does not support speech recognition.";
}

// --- Microphone Events ---
micBtn.addEventListener("mousedown", () => {
  console.log("👆 Mic button held");
  if (recognition) recognition.start();
});
micBtn.addEventListener("mouseup", () => {
  console.log("🖐️ Mic button released");
  if (recognition) recognition.stop();
});

// --- Text Input Events ---
sendBtn.addEventListener("click", async () => {
  const message = textInput.value.trim();
  if (!message) return;
  textInput.value = "";
  status.textContent = "⏳ Sending text...";
  await processText(message);
});

// --- Process Text and Get Response ---
async function processText(text) {
  try {
    const res = await fetch(`${backendUrl}/process_text/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    console.log("🤖 GPT Response: ", data);
    status.textContent = "🧠 GPT: " + data.reply;

    lastAudioData = data.audio_url; // Save for replay
    replayBtn.classList.remove("hidden");
    playBase64Audio(lastAudioData);
  } catch (err) {
    console.error("❌ Error processing:", err);
    status.textContent = "❌ Failed to process input.";
  }
}

// --- Play base64-encoded audio ---
function playBase64Audio(base64Audio) {
  const audio = new Audio("data:audio/mp3;base64," + base64Audio);
  audio.play().catch((e) => {
    console.error("🔊 Playback error:", e);
    status.textContent = "⚠️ Failed to play audio.";
  });
}

// --- Replay Last Audio ---
replayBtn.addEventListener("click", () => {
  if (lastAudioData) {
    console.log("🔁 Replaying last audio...");
    playBase64Audio(lastAudioData);
  } else {
    status.textContent = "⚠️ No previous audio to replay.";
  }
});
