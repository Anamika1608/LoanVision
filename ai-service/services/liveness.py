import mediapipe as mp
import numpy as np

from services.mediapipe_shared import get_landmarker, is_loaded  # noqa: F401

LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

BLINK_THRESHOLD = 0.21
HEAD_TURN_THRESHOLD = 20.0


def _compute_ear(landmarks, eye_indices: list[int]) -> float:
    pts = [np.array([landmarks[i].x, landmarks[i].y, landmarks[i].z]) for i in eye_indices]
    vertical1 = np.linalg.norm(pts[1] - pts[5])
    vertical2 = np.linalg.norm(pts[2] - pts[4])
    horizontal = np.linalg.norm(pts[0] - pts[3])
    if horizontal == 0:
        return 1.0
    return (vertical1 + vertical2) / (2.0 * horizontal)


def _estimate_yaw(landmarks) -> float:
    nose_tip = np.array([landmarks[1].x, landmarks[1].y, landmarks[1].z])
    left_ear = np.array([landmarks[234].x, landmarks[234].y, landmarks[234].z])
    right_ear = np.array([landmarks[454].x, landmarks[454].y, landmarks[454].z])
    mid_ears = (left_ear + right_ear) / 2.0
    face_width = np.linalg.norm(right_ear - left_ear)
    if face_width == 0:
        return 0.0
    offset = (nose_tip[0] - mid_ears[0]) / face_width
    yaw_degrees = offset * 90.0
    return float(yaw_degrees)


def check_blink(image_rgb: np.ndarray) -> dict:
    landmarker = get_landmarker()
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = landmarker.detect(mp_image)

    if not result.face_landmarks:
        return {"blink_detected": False, "ear_left": None, "ear_right": None}

    landmarks = result.face_landmarks[0]
    ear_left = _compute_ear(landmarks, LEFT_EYE)
    ear_right = _compute_ear(landmarks, RIGHT_EYE)
    blink_detected = bool(ear_left < BLINK_THRESHOLD or ear_right < BLINK_THRESHOLD)

    return {
        "blink_detected": blink_detected,
        "ear_left": float(round(ear_left, 4)),
        "ear_right": float(round(ear_right, 4)),
    }


def check_head_pose(image_rgb: np.ndarray) -> dict:
    landmarker = get_landmarker()
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = landmarker.detect(mp_image)

    if not result.face_landmarks:
        return {"head_turn_detected": False, "yaw": None}

    landmarks = result.face_landmarks[0]
    yaw = _estimate_yaw(landmarks)
    head_turn_detected = bool(abs(yaw) > HEAD_TURN_THRESHOLD)

    return {
        "head_turn_detected": head_turn_detected,
        "yaw": float(round(yaw, 2)),
    }


def run_liveness_check(image_rgb: np.ndarray, challenge_type: str) -> dict:
    if challenge_type == "blink":
        result = check_blink(image_rgb)
        return {
            "challenge_type": "blink",
            "passed": result["blink_detected"],
            "details": {
                "ear_left": result["ear_left"],
                "ear_right": result["ear_right"],
            },
        }
    elif challenge_type == "head_turn":
        result = check_head_pose(image_rgb)
        return {
            "challenge_type": "head_turn",
            "passed": result["head_turn_detected"],
            "details": {
                "yaw": result["yaw"],
            },
        }
    else:
        raise ValueError(f"Unknown challenge type: {challenge_type}")
