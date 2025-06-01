const recordBtn = document.getElementById("recordBtn");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const status = document.getElementById("status");
const replyAudio = document.getElementById("replyAudio");

const backendUrl = "https://realtime-api-test.onrender.com";
// const backendUrl = "http:127.0.0.1:8000";

let mediaRecorder, chunks = [];

recordBtn.addEventListener("mousedown", async () => {
  status.textContent = "🎙️ Listening...";
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  chunks = [];

  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    sendAudio(blob);
  };

  mediaRecorder.start();
});

recordBtn.addEventListener("mouseup", () => {
  status.textContent = "⏳ Processing audio...";
  mediaRecorder.stop();
});

sendBtn.addEventListener("click", async () => {
  const message = textInput.value.trim();
  if (!message) return;

  status.textContent = "⏳ Sending text...";
  const res = await fetch(`${backendUrl}/process_text/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message })
  });

  const data = await res.json();
  status.textContent = "🧠 GPT: " + data.reply;
  playBase64Audio(data.audio_url);
  textInput.value = "";
});

async function sendAudio(blob) {
  const formData = new FormData();
  formData.append("file", blob, "speech.webm");

  const res = await fetch(`${backendUrl}/process_audio/`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  status.textContent = "🧠 GPT: " + data.reply;
  playBase64Audio(data.audio_url);
}

function playBase64Audio(base64DataUrl) {
  replyAudio.src = base64DataUrl;
  replyAudio.play();
}
