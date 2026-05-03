import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()


def preload_models():
    print("\n=== Loading AI models ===\n")
    total_start = time.time()

    print("[1/5] Loading MediaPipe (face detection + liveness)...")
    t = time.time()
    from services.mediapipe_shared import get_landmarker
    get_landmarker()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[2/5] Loading ViT Age/Gender model...")
    t = time.time()
    from services.face_analysis import get_age_gender_model
    get_age_gender_model()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[3/5] Loading InsightFace RetinaFace + ArcFace (face detection & matching)...")
    t = time.time()
    from services.face_matching import preload_model as preload_facenet
    preload_facenet()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[4/5] Loading PaddleOCR (ID extraction)...")
    t = time.time()
    from services.id_ocr import preload_model as preload_ocr
    preload_ocr()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[5/5] Initializing Groq LLM...")
    t = time.time()
    from services.llm_agent import get_llm
    get_llm()
    print(f"       Done in {time.time() - t:.1f}s")

    print(f"\n=== All models ready in {time.time() - total_start:.1f}s ===\n")


if __name__ == "__main__":
    preload_models()

    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
