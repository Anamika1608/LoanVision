import io
import os
import time

from groq import Groq, RateLimitError

_client: Groq | None = None

_HALLUCINATION_PATTERNS = {
    "okay.", "okay", "thank you.", "thank you", "thanks.", "thanks",
    "gracias.", "gracias", "yes.", "yes", "no.", "no",
    "bye.", "bye", "goodbye.", "goodbye",
    "you", "the end.", "the end",
    ".", "..", "...", "um.", "uh.", "hmm.",
    "subtitles by the amara.org community",
    "thanks for watching!", "thanks for watching",
    "subscribe", "like and subscribe",
    "thank you for watching.", "please subscribe.",
    "i'm sorry.", "i'm sorry", "sorry.",
    "oh.", "oh", "ah.", "ah", "eh.", "huh.",
    "music", "applause", "laughter",
}


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def is_loaded() -> bool:
    return True


def transcribe(audio_bytes: bytes) -> dict:
    client = _get_client()
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "chunk.wav"

    for attempt in range(3):
        try:
            result = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_file,
                response_format="verbose_json",
                language="en",
                temperature=0.0,
            )
            break
        except RateLimitError:
            if attempt < 2:
                time.sleep(3)
                audio_file.seek(0)
                continue
            return {"segments": [], "language": "en", "full_text": ""}

    segments = []
    full_text_parts = []

    if hasattr(result, "segments") and result.segments:
        for seg in result.segments:
            no_speech = seg.get("no_speech_prob", 0)
            if no_speech > 0.7:
                continue
            segments.append({"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()})
            full_text_parts.append(seg["text"].strip())

    full_text = " ".join(full_text_parts) if full_text_parts else (result.text or "").strip()

    if _is_hallucination(full_text):
        return {"segments": [], "language": getattr(result, "language", "en"), "full_text": ""}

    return {
        "segments": segments,
        "language": getattr(result, "language", "en"),
        "full_text": full_text,
    }


def _is_hallucination(text: str) -> bool:
    cleaned = text.strip().lower()
    if not cleaned:
        return True
    if cleaned in _HALLUCINATION_PATTERNS:
        return True
    if len(cleaned) < 3 and not cleaned.isalpha():
        return True
    words = cleaned.split()
    if len(words) <= 2 and all(w.rstrip(".!?,") in _HALLUCINATION_PATTERNS for w in words):
        return True
    return False
