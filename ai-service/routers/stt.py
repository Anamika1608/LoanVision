import asyncio

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from schemas.types import TranscribeResponse
from services import redis_client, whisper_stt
from utils.audio import ensure_wav

router = APIRouter()


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    wav_bytes = ensure_wav(audio_bytes)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, whisper_stt.transcribe, wav_bytes)

    await redis_client.publish(f"transcript:{session_id}", result)

    return TranscribeResponse(
        segments=[{"start": s["start"], "end": s["end"], "text": s["text"]} for s in result["segments"]],
        language=result["language"],
        full_text=result["full_text"],
    )
