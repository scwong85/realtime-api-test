# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import tempfile
import uvicorn
import base64
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class TextInput(BaseModel):
    text: str

@app.post("/process_audio/")
async def process_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(await file.read())
        temp_audio.flush()

        transcript = openai.audio.transcriptions.create(
            file=open(temp_audio.name, "rb"),
            model="whisper-1"
        )

    return await get_response(transcript.text)

@app.post("/process_text/")
async def process_text(input: TextInput):
    return await get_response(input.text)

async def get_response(prompt: str):
    completion = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    reply = completion.choices[0].message.content

    tts_response = openai.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=reply
    )

    # Convert bytes to base64
    audio_base64 = base64.b64encode(tts_response.content).decode("utf-8")

    return {
        "input": prompt,
        "reply": reply,
        "audio_url": f"{audio_base64}"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)
