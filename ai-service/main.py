from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from services import redis_client
    try:
        await redis_client.connect()
        print("[redis] Connected")
    except Exception as e:
        print(f"[redis] Connection failed: {e} — continuing without pub/sub")
    yield
    from services import redis_client as rc
    await rc.close()


app = FastAPI(title="LoanVision AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import stt, cv, llm  # noqa: E402

app.include_router(stt.router, prefix="/stt", tags=["STT"])
app.include_router(cv.router, prefix="/cv", tags=["CV"])
app.include_router(llm.router, prefix="/llm", tags=["LLM"])


@app.get("/health")
async def health():
    from services.whisper_stt import is_loaded as whisper_loaded
    from services.face_analysis import is_loaded as face_loaded
    from services.liveness import is_loaded as liveness_loaded
    from services.llm_agent import is_loaded as llm_loaded

    return {
        "status": "ok",
        "models_loaded": {
            "whisper": whisper_loaded(),
            "insightface": face_loaded(),
            "mediapipe": liveness_loaded(),
            "gemini": llm_loaded(),
        },
    }
