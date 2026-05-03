import asyncio

from fastapi import APIRouter, HTTPException

from schemas.types import (
    ProcessRequest,
    ProcessResponse,
    LoanEntities,
    ExtractEntitiesRequest,
    RiskClassifyRequest,
    RiskClassificationResponse,
)
from services import redis_client, llm_agent

router = APIRouter()


@router.post("/process", response_model=ProcessResponse)
async def process_transcript(request: ProcessRequest):
    if not request.transcript_chunk.strip():
        raise HTTPException(status_code=400, detail="Empty transcript chunk")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        llm_agent.process_transcript,
        request.session_id,
        request.transcript_chunk,
        request.conversation_history,
        request.cv_results,
    )

    await redis_client.publish(f"agent_response:{request.session_id}", {
        "next_question": result["next_question"],
        "should_end_call": result["should_end_call"],
    })
    await redis_client.publish(f"entities:{request.session_id}", result["entities_extracted"])

    return ProcessResponse(
        next_question=result["next_question"],
        entities_extracted=LoanEntities(**result["entities_extracted"]),
        classification=result["classification"],
        should_end_call=result["should_end_call"],
    )


@router.post("/extract-entities", response_model=LoanEntities)
async def extract_entities(request: ExtractEntitiesRequest):
    if not request.full_transcript.strip():
        raise HTTPException(status_code=400, detail="Empty transcript")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, llm_agent.extract_entities, request.full_transcript
    )

    return LoanEntities(**result)


@router.post("/classify-risk", response_model=RiskClassificationResponse)
async def classify_risk(request: RiskClassifyRequest):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        llm_agent.classify_risk,
        request.entities,
        request.cv_results,
        request.geo_data,
    )

    session_id = request.entities.get("session_id", "unknown")
    await redis_client.publish(f"risk:{session_id}", result)

    return RiskClassificationResponse(**result)
