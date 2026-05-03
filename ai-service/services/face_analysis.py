import threading
import time
import sys

import mediapipe as mp
import numpy as np
import torch
from PIL import Image
from transformers import AutoConfig, AutoImageProcessor
from huggingface_hub import hf_hub_download

from services.mediapipe_shared import get_landmarker

_model = None
_processor = None
_lock = threading.Lock()
_load_time: float = 0

MODEL_ID = "abhilash88/age-gender-prediction"


def _get_model_class():
    model_py = hf_hub_download(MODEL_ID, "model.py")
    import importlib.util
    spec = importlib.util.spec_from_file_location("age_gender_model", model_py)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["age_gender_model"] = mod
    spec.loader.exec_module(mod)
    return mod.AgeGenderViTModel


def get_age_gender_model():
    global _model, _processor, _load_time
    if _model is None:
        with _lock:
            if _model is None:
                start = time.time()
                AgeGenderViTModel = _get_model_class()
                config = AutoConfig.from_pretrained(MODEL_ID, trust_remote_code=True)
                _model = AgeGenderViTModel.from_pretrained(
                    MODEL_ID, config=config, trust_remote_code=True
                )
                _model.eval()
                _processor = AutoImageProcessor.from_pretrained(MODEL_ID, do_center_crop=False)
                _load_time = time.time() - start
                print(f"[vit-age-gender] Model loaded in {_load_time:.1f}s")
    return _model, _processor


def is_loaded() -> bool:
    return _model is not None


def _landmarks_to_bbox(landmarks, img_h: int, img_w: int) -> dict:
    xs = [lm.x * img_w for lm in landmarks]
    ys = [lm.y * img_h for lm in landmarks]
    x_min, x_max = int(min(xs)), int(max(xs))
    y_min, y_max = int(min(ys)), int(max(ys))
    return {"x": x_min, "y": y_min, "width": x_max - x_min, "height": y_max - y_min}


def _crop_face(image_rgb: np.ndarray, bbox: dict, padding: float = 0.2) -> Image.Image:
    h, w = image_rgb.shape[:2]
    pad_w = int(bbox["width"] * padding)
    pad_h = int(bbox["height"] * padding)
    x1 = max(0, bbox["x"] - pad_w)
    y1 = max(0, bbox["y"] - pad_h)
    x2 = min(w, bbox["x"] + bbox["width"] + pad_w)
    y2 = min(h, bbox["y"] + bbox["height"] + pad_h)
    face_crop = image_rgb[y1:y2, x1:x2]
    return Image.fromarray(face_crop)


def _predict_age_gender(face_pil: Image.Image) -> dict:
    model, processor = get_age_gender_model()
    inputs = processor(images=face_pil, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0]

    age = int(round(logits[0].item()))
    age = max(0, min(100, age))

    gender_prob_female = logits[1].item()
    gender = "Female" if gender_prob_female >= 0.5 else "Male"

    return {"age": age, "gender": gender}


def analyze_frame(image_rgb: np.ndarray) -> dict:
    landmarker = get_landmarker()
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = landmarker.detect(mp_image)

    if not result.face_landmarks:
        return {"face_detected": False}

    landmarks = result.face_landmarks[0]
    h, w = image_rgb.shape[:2]
    bbox = _landmarks_to_bbox(landmarks, h, w)

    face_pil = _crop_face(image_rgb, bbox)
    ag_result = _predict_age_gender(face_pil)

    return {
        "face_detected": True,
        "bbox": bbox,
        "age": ag_result["age"],
        "gender": ag_result["gender"],
    }
