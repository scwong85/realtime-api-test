const backendUrl = "https://realtime-api-test.onrender.com";

const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send-btn");
const textInput = document.getElementById("text-input");
const status = document.getElementById("status");

let recognition;

// --- Mic Setup ---
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
    try {
      const res = await fetch(`${backendUrl}/process_text/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await res.json();
      status.textContent = "🧠 GPT: " + data.reply;
      playBase64Audio(data.audio_url);
    } catch (err) {
      console.error("❌ Error processing speech:", err);
      status.textContent = "❌ Failed to process speech.";
    }
  };

  recognition.onerror = (event) => {
    console.error("🎤 Speech error:", event.error);
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

// --- Mic Button Events ---
micBtn.addEventListener("mousedown", () => {
  console.log("👆 Mic button held");
  if (recognition) recognition.start();
});

micBtn.addEventListener("mouseup", () => {
  console.log("🖐️ Mic button released");
  if (recognition) recognition.stop();
});

// --- Text Button Events ---
sendBtn.addEventListener("click", async () => {
  const message = textInput.value.trim();
  if (!message) return;

  status.textContent = "⏳ Sending text...";
  try {
    const res = await fetch(`${backendUrl}/process_text/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    const data = await res.json();
    console.log("📝 GPT Response: ", data);
    status.textContent = "🧠 GPT: " + data.reply;
    playBase64Audio(data.audio_url);
    textInput.value = "";
  } catch (err) {
    console.error("❌ Error sending text:", err);
    status.textContent = "❌ Failed to send text.";
  }
});

// --- Play base64-encoded audio ---
function playBase64Audio(base64Audio) {
  const audio = new Audio("data:audio/mp3;base64," + base64Audio);
  audio.play().catch((e) => console.error("🔊 Playback error:", e));
}
