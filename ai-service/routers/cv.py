import asyncio
import os
import threading
from pathlib import Path

from fastapi import APIRouter, File, Form, Query, UploadFile, HTTPException
from fastapi.responses import FileResponse
from geopy.geocoders import Nominatim

from schemas.types import AnalyzeFrameResponse, RegisterIdPhotoResponse, LivenessChallengeResponse, LivenessDetails
from services import redis_client, face_analysis, liveness, face_matching, id_ocr
from utils.image import bytes_to_rgb

UPLOADS_DIR = Path(__file__).parent.parent / "uploads" / "id-photos"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

SCREENSHOTS_DIR = Path(__file__).parent.parent / "uploads" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

_geocoder = Nominatim(user_agent="loanvision-ai", timeout=5)
_geo_cache: dict[str, str | None] = {}
_geo_lock = threading.Lock()

router = APIRouter()


@router.post("/analyze-frame", response_model=AnalyzeFrameResponse)
async def analyze_frame(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    image_rgb = bytes_to_rgb(image_bytes)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, face_analysis.analyze_frame, image_rgb)

    if not result["face_detected"]:
        response = AnalyzeFrameResponse(face_detected=False)
        await redis_client.publish(f"cv_result:{session_id}", {"face_detected": False})
        return response

    liveness_result = await loop.run_in_executor(None, liveness.check_blink, image_rgb)

    face_match_score = None
    if face_matching.has_id_registered(session_id):
        match_result = await loop.run_in_executor(None, face_matching.compare_faces, session_id, image_rgb)
        face_match_score = match_result.get("score")

    response = AnalyzeFrameResponse(
        face_detected=True,
        age=result["age"],
        gender=result["gender"],
        bbox=result["bbox"],
        face_match_score=face_match_score,
        liveness=LivenessDetails(
            ear_left=liveness_result.get("ear_left"),
            ear_right=liveness_result.get("ear_right"),
        ),
    )

    publish_data = {
        "face_detected": True,
        "age": result["age"],
        "gender": result["gender"],
        "face_match_score": face_match_score,
    }
    await redis_client.publish(f"cv_result:{session_id}", publish_data)

    return response


@router.post("/register-id-photo", response_model=RegisterIdPhotoResponse)
async def register_id_photo(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    id_photo_path = UPLOADS_DIR / f"{session_id}{ext}"
    id_photo_path.write_bytes(image_bytes)
    print(f"[cv/register-id-photo] Saved ID photo: {id_photo_path}")

    image_rgb = bytes_to_rgb(image_bytes)

    loop = asyncio.get_event_loop()

    face_result, ocr_result = await asyncio.gather(
        loop.run_in_executor(None, face_matching.register_id_face, session_id, image_rgb),
        loop.run_in_executor(None, id_ocr.extract_id_data, image_rgb),
    )

    print(f"[cv/register-id-photo] session={session_id}")
    print(f"  face_result: {face_result}")
    print(f"  ocr_result: name={ocr_result.get('full_name')}, dob={ocr_result.get('date_of_birth')}, "
          f"id={ocr_result.get('id_number')}, type={ocr_result.get('id_type')}")

    await redis_client.publish(f"id_verification:{session_id}", {
        "face_registered": face_result.get("registered", False),
        "id_data": ocr_result,
    })

    return RegisterIdPhotoResponse(
        registered=face_result.get("registered", False),
        face_detected=face_result.get("face_detected", False),
        id_data=ocr_result,
        id_photo_path=f"/cv/id-photo/{session_id}",
    )


@router.get("/id-photo/{session_id}")
async def get_id_photo(session_id: str):
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        path = UPLOADS_DIR / f"{session_id}{ext}"
        if path.exists():
            return FileResponse(path)
    raise HTTPException(status_code=404, detail="ID photo not found")


@router.post("/liveness-challenge", response_model=LivenessChallengeResponse)
async def liveness_challenge(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    challenge_type: str = Form(...),
):
    if challenge_type not in ("blink", "head_turn"):
        raise HTTPException(status_code=400, detail="challenge_type must be 'blink' or 'head_turn'")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    image_rgb = bytes_to_rgb(image_bytes)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, liveness.run_liveness_check, image_rgb, challenge_type
    )

    await redis_client.publish(f"liveness:{session_id}", result)

    details = result.get("details", {})
    return LivenessChallengeResponse(
        challenge_type=result["challenge_type"],
        passed=result["passed"],
        details=LivenessDetails(
            ear_left=details.get("ear_left"),
            ear_right=details.get("ear_right"),
            yaw=details.get("yaw"),
        ),
    )


@router.post("/save-screenshot")
async def save_screenshot(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    path = SCREENSHOTS_DIR / f"{session_id}.jpg"
    path.write_bytes(image_bytes)
    print(f"[cv/save-screenshot] Saved screenshot: {path}")
    return {"saved": True, "path": f"/cv/screenshot/{session_id}"}


@router.get("/screenshot/{session_id}")
async def get_screenshot(session_id: str):
    for ext in [".jpg", ".jpeg", ".png"]:
        path = SCREENSHOTS_DIR / f"{session_id}{ext}"
        if path.exists():
            return FileResponse(path)
    raise HTTPException(status_code=404, detail="Screenshot not found")


@router.get("/reverse-geocode")
async def reverse_geocode(lat: float = Query(...), lon: float = Query(...)):
    cache_key = f"{lat:.4f},{lon:.4f}"

    with _geo_lock:
        if cache_key in _geo_cache:
            return {"location": _geo_cache[cache_key]}

    loop = asyncio.get_event_loop()
    try:
        location = await loop.run_in_executor(None, _geocoder.reverse, f"{lat}, {lon}")
        if location and location.raw.get("address"):
            addr = location.raw["address"]
            parts = []
            for key in ["suburb", "city", "town", "village", "state_district", "state"]:
                if key in addr and addr[key] not in parts:
                    parts.append(addr[key])
                if len(parts) >= 3:
                    break
            resolved = ", ".join(parts) if parts else str(location.address)
        elif location:
            resolved = str(location.address)
        else:
            resolved = None
    except Exception as e:
        print(f"[cv/reverse-geocode] Error: {e}")
        resolved = None

    with _geo_lock:
        _geo_cache[cache_key] = resolved

    return {"location": resolved}
