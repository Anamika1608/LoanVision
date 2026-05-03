import threading
import time

import numpy as np
from insightface.app import FaceAnalysis

_app: FaceAnalysis | None = None
_lock = threading.Lock()
_load_time: float = 0
_reference_embeddings: dict[str, np.ndarray] = {}


def get_app() -> FaceAnalysis:
    global _app, _load_time
    if _app is None:
        with _lock:
            if _app is None:
                start = time.time()
                _app = FaceAnalysis(
                    name="buffalo_l",
                    providers=["CPUExecutionProvider"],
                )
                _app.prepare(ctx_id=0, det_size=(640, 640))
                _load_time = time.time() - start
                print(f"[insightface] Model loaded in {_load_time:.1f}s")
    return _app


def is_loaded() -> bool:
    return _app is not None


def analyze_frame(image_rgb: np.ndarray) -> dict:
    app = get_app()
    faces = app.get(image_rgb)
    if not faces:
        return {"face_detected": False}
    face = faces[0]
    bbox = face.bbox.astype(int).tolist()
    return {
        "face_detected": True,
        "bbox": {"x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1]},
        "age": int(face.age),
        "gender": "M" if face.gender == 1 else "F",
        "embedding": face.embedding,
    }


def register_id_photo(session_id: str, image_rgb: np.ndarray) -> bool:
    result = analyze_frame(image_rgb)
    if not result["face_detected"]:
        return False
    _reference_embeddings[session_id] = result["embedding"]
    return True


def compare_faces(embedding: np.ndarray, session_id: str) -> float | None:
    ref = _reference_embeddings.get(session_id)
    if ref is None:
        return None
    sim = float(np.dot(embedding, ref) / (np.linalg.norm(embedding) * np.linalg.norm(ref)))
    return sim


def clear_session(session_id: str):
    _reference_embeddings.pop(session_id, None)
