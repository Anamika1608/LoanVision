import os
import threading
import time

import mediapipe as mp

_landmarker = None
_lock = threading.Lock()
_load_time: float = 0


def get_landmarker():
    global _landmarker, _load_time
    if _landmarker is None:
        with _lock:
            if _landmarker is None:
                start = time.time()
                model_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "models",
                    "face_landmarker.task",
                )
                base_options = mp.tasks.BaseOptions(model_asset_path=model_path)
                options = mp.tasks.vision.FaceLandmarkerOptions(
                    base_options=base_options,
                    num_faces=1,
                    output_face_blendshapes=True,
                    output_facial_transformation_matrixes=True,
                )
                _landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
                _load_time = time.time() - start
                print(f"[mediapipe] FaceLandmarker loaded in {_load_time:.1f}s")
    return _landmarker


def is_loaded() -> bool:
    return _landmarker is not None
