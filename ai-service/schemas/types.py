from pydantic import BaseModel


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscribeResponse(BaseModel):
    segments: list[TranscriptSegment]
    language: str
    full_text: str


class BBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class LivenessDetails(BaseModel):
    ear_left: float | None = None
    ear_right: float | None = None
    yaw: float | None = None
    pitch: float | None = None
    roll: float | None = None


class AnalyzeFrameResponse(BaseModel):
    face_detected: bool
    age: int | None = None
    gender: str | None = None
    bbox: BBox | None = None
    liveness: LivenessDetails | None = None
    face_match_score: float | None = None


class RegisterIdPhotoResponse(BaseModel):
    registered: bool
    face_detected: bool


class LivenessChallengeResponse(BaseModel):
    challenge_type: str
    passed: bool
    details: LivenessDetails


class LoanEntities(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    declared_age: int | None = None
    employer: str | None = None
    monthly_income: float | None = None
    loan_purpose: str | None = None
    loan_amount_requested: float | None = None
    consent_given: bool = False
    consent_phrase: str | None = None
    confidence: float = 0.0


class ProcessRequest(BaseModel):
    session_id: str
    transcript_chunk: str
    conversation_history: list[dict] = []
    cv_results: dict = {}


class ProcessResponse(BaseModel):
    next_question: str
    entities_extracted: LoanEntities
    classification: str | None = None
    should_end_call: bool = False


class ExtractEntitiesRequest(BaseModel):
    full_transcript: str


class RiskClassifyRequest(BaseModel):
    entities: dict
    cv_results: dict = {}
    geo_data: dict = {}


class RiskClassificationResponse(BaseModel):
    risk_band: str
    confidence: float
    fraud_flags: list[str] = []
    rationale: str
