import threading
import time

import numpy as np
from insightface.app import FaceAnalysis

_app = None
_lock = threading.Lock()
_id_embeddings: dict[str, np.ndarray] = {}


def _get_app():
    global _app
    if _app is None:
        with _lock:
            if _app is None:
                start = time.time()
                _app = FaceAnalysis(
                    name="buffalo_l",
                    providers=["CPUExecutionProvider"],
                )
                _app.prepare(ctx_id=-1, det_size=(640, 640))
                print(f"[insightface] RetinaFace + ArcFace loaded in {time.time() - start:.1f}s")
    return _app


def preload_model():
    _get_app()


def is_loaded() -> bool:
    return _app is not None


def is_retinaface_loaded() -> bool:
    return _app is not None


def is_facenet_loaded() -> bool:
    return _app is not None


def _get_largest_face(image_rgb: np.ndarray):
    app = _get_app()
    faces = app.get(image_rgb)
    if not faces:
        return None
    return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))


def register_id_face(session_id: str, image_rgb: np.ndarray) -> dict:
    face = _get_largest_face(image_rgb)
    if face is None:
        print(f"[face_matching] No face detected in ID photo for session {session_id}")
        return {"registered": False, "face_detected": False}

    _id_embeddings[session_id] = face.normed_embedding
    x1, y1, x2, y2 = [int(v) for v in face.bbox]
    print(f"[face_matching] ID face registered for session {session_id}, "
          f"bbox=({x1},{y1},{x2},{y2})")
    return {"registered": True, "face_detected": True}


def compare_faces(session_id: str, live_image_rgb: np.ndarray) -> dict:
    if session_id not in _id_embeddings:
        return {"matched": False, "score": 0.0, "reason": "no_id_registered"}

    face = _get_largest_face(live_image_rgb)
    if face is None:
        return {"matched": False, "score": 0.0, "reason": "no_face_in_frame"}

    live_embedding = face.normed_embedding
    id_embedding = _id_embeddings[session_id]

    cosine_sim = float(np.dot(id_embedding, live_embedding))
    matched = cosine_sim > 0.4

    print(f"[face_matching] Session {session_id}: cosine_sim={cosine_sim:.3f}, matched={matched}")
    return {"matched": matched, "score": round(cosine_sim, 3), "reason": ""}


def has_id_registered(session_id: str) -> bool:
    return session_id in _id_embeddings


def remove_session(session_id: str):
    _id_embeddings.pop(session_id, None)
