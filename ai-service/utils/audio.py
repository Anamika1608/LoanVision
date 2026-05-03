import io
import struct
import wave

import numpy as np


def ensure_wav(file_bytes: bytes) -> bytes:
    if file_bytes[:4] == b"RIFF":
        return file_bytes
    sample_rate = 16000
    channels = 1
    sample_width = 2
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(file_bytes)
    return buf.getvalue()


def wav_to_numpy(wav_bytes: bytes) -> np.ndarray:
    buf = io.BytesIO(wav_bytes)
    with wave.open(buf, "rb") as wf:
        n_frames = wf.getnframes()
        sample_width = wf.getsampwidth()
        raw = wf.readframes(n_frames)

    if sample_width == 2:
        samples = np.frombuffer(raw, dtype=np.int16)
    elif sample_width == 4:
        samples = np.frombuffer(raw, dtype=np.int32)
    else:
        samples = np.frombuffer(raw, dtype=np.uint8).astype(np.int16) - 128

    return samples.astype(np.float32) / np.iinfo(np.int16).max
