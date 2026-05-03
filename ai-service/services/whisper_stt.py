import threading
import time

from faster_whisper import WhisperModel

_model: WhisperModel | None = None
_lock = threading.Lock()
_load_time: float = 0


def get_model() -> WhisperModel:
    global _model, _load_time
    if _model is None:
        with _lock:
            if _model is None:
                start = time.time()
                _model = WhisperModel(
                    "large-v3-turbo",
                    device="cpu",
                    compute_type="int8",
                )
                _load_time = time.time() - start
                print(f"[whisper] Model loaded in {_load_time:.1f}s")
    return _model


def is_loaded() -> bool:
    return _model is not None


def transcribe(audio_numpy) -> dict:
    model = get_model()
    segments_gen, info = model.transcribe(
        audio_numpy,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )
    segments = []
    full_text_parts = []
    for seg in segments_gen:
        segments.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
        full_text_parts.append(seg.text.strip())

    return {
        "segments": segments,
        "language": info.language,
        "full_text": " ".join(full_text_parts),
    }
