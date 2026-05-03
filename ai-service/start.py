import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()


def preload_models():
    print("\n=== Loading AI models ===\n")
    total_start = time.time()

    print("[1/4] Loading Whisper (STT)...")
    t = time.time()
    from services.whisper_stt import get_model
    get_model()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[2/4] Loading InsightFace (face analysis)...")
    t = time.time()
    from services.face_analysis import get_app
    get_app()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[3/4] Loading MediaPipe (liveness)...")
    t = time.time()
    from services.liveness import get_landmarker
    get_landmarker()
    print(f"       Done in {time.time() - t:.1f}s")

    print("[4/4] Initializing Gemini LLM...")
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
