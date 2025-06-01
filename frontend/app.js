const backendUrl = "https://realtime-api-test.onrender.com"; // Replace with your actual backend

const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send-btn");
const textInput = document.getElementById("text-input");
const status = document.getElementById("status");
const replayBtn = document.getElementById("replay-btn");
const historyList = document.getElementById("history-list");

let recognition;
let lastAudioData = null;
let currentAudio = null;
let history = []; // { user, reply, timestamp, audio }

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    status.textContent = "🎤 Listening...";
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    status.textContent = "⏳ Processing...";
    await processText(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
    status.textContent = "❌ Mic error: " + event.error;
  };
} else {
  micBtn.disabled = true;
  status.textContent = "❌ Browser does not support speech recognition.";
}

micBtn.addEventListener("mousedown", () => {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  recognition?.start();
});

micBtn.addEventListener("mouseup", () => {
  recognition?.stop();
});

sendBtn.addEventListener("click", async () => {
  const message = textInput.value.trim();
  if (!message) return;
  textInput.value = "";
  status.textContent = "⏳ Sending text...";
  await processText(message);
});

replayBtn.addEventListener("click", () => {
  if (lastAudioData) playBase64Audio(lastAudioData);
});

async function processText(text) {
  try {
    const res = await fetch(`${backendUrl}/process_text/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      user: text,
      reply: data.reply,
      timestamp,
      audio: data.audio_url,
    };

    history.push(entry);
    saveHistory();
    renderHistory();

    lastAudioData = data.audio_url;
    replayBtn.classList.remove("hidden");
    status.textContent = "🧠 GPT: " + data.reply;
    playBase64Audio(lastAudioData);
  } catch (err) {
    console.error("Error processing:", err);
    status.textContent = "❌ Failed to process input.";
  }
}

function playBase64Audio(dataUri) {
  try {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(dataUri);
    currentAudio.play().catch((e) => {
      console.error("Playback error:", e);
      status.textContent = "⚠️ Failed to play audio.";
    });
  } catch (e) {
    console.error("Audio play failed:", e);
    status.textContent = "❌ Playback issue.";
  }
}

function renderHistory() {
  historyList.innerHTML = "";

  history.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "bg-gray-100 rounded p-2";

    li.innerHTML = `
      <div><strong>You:</strong> ${entry.user}</div>
      <div><strong>GPT:</strong> ${entry.reply}</div>
      <div class="text-xs text-gray-500">🕒 ${entry.timestamp}</div>
      <button class="mt-1 text-sm text-blue-600 hover:underline replay-btn" data-idx="${index}">▶️ Replay</button>
    `;

    historyList.appendChild(li);
  });

  // Add replay handlers
  document.querySelectorAll(".replay-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-idx");
      const entry = history[idx];
      if (entry?.audio) {
        playBase64Audio(entry.audio);
      }
    });
  });

  historyList.scrollTop = historyList.scrollHeight;
}

function saveHistory() {
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadHistory() {
  const data = localStorage.getItem("chatHistory");
  if (data) {
    history = JSON.parse(data);
    renderHistory();
  }
}

// Load on startup
loadHistory();