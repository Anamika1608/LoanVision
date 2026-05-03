import asyncio

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from schemas.types import AnalyzeFrameResponse, RegisterIdPhotoResponse, LivenessChallengeResponse, LivenessDetails
from services import redis_client, face_analysis, liveness
from utils.image import bytes_to_rgb

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

    face_match_score = None
    embedding = result.pop("embedding", None)
    if embedding is not None:
        face_match_score = await loop.run_in_executor(
            None, face_analysis.compare_faces, embedding, session_id
        )

    liveness_result = await loop.run_in_executor(None, liveness.check_blink, image_rgb)

    response = AnalyzeFrameResponse(
        face_detected=True,
        age=result["age"],
        gender=result["gender"],
        bbox=result["bbox"],
        liveness=LivenessDetails(
            ear_left=liveness_result.get("ear_left"),
            ear_right=liveness_result.get("ear_right"),
        ),
        face_match_score=face_match_score,
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

    image_rgb = bytes_to_rgb(image_bytes)

    loop = asyncio.get_event_loop()
    registered = await loop.run_in_executor(
        None, face_analysis.register_id_photo, session_id, image_rgb
    )

    return RegisterIdPhotoResponse(registered=registered, face_detected=registered)


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
