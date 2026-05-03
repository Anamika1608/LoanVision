import cv2
import numpy as np


def bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image")
    return img


def bytes_to_rgb(image_bytes: bytes) -> np.ndarray:
    bgr = bytes_to_cv2(image_bytes)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
