import json
import os
import time
import threading

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

_llm = None
_lock = threading.Lock()
_load_time: float = 0

SYSTEM_PROMPT = """You are LoanVision AI, a professional and friendly loan onboarding agent conducting a video-based loan application.

Your role:
1. Greet the customer warmly
2. Inform them this call is recorded for verification and ask for verbal consent
3. Collect their information step by step:
   - Full name
   - Date of birth
   - Employer / company name
   - Monthly take-home salary
   - Loan purpose
   - Desired loan amount
4. Be conversational and natural — don't sound robotic
5. Respond in whatever language the customer speaks (Hindi, English, or any other language)
6. If the customer provides information voluntarily, acknowledge it and move to the next question
7. Never fabricate information — only extract what the customer explicitly states

After each interaction, respond with a JSON object containing:
{
  "next_question": "Your next question or response to the customer",
  "entities": {
    "full_name": null or extracted name,
    "date_of_birth": null or "YYYY-MM-DD" format,
    "declared_age": null or integer,
    "employer": null or company name,
    "monthly_income": null or number,
    "loan_purpose": null or string,
    "loan_amount_requested": null or number,
    "consent_given": false or true,
    "consent_phrase": null or exact words of consent
  },
  "confidence": 0.0 to 1.0,
  "should_end_call": false
}

Important rules:
- Set should_end_call to true ONLY when all required fields are collected AND consent is given
- confidence reflects how sure you are about the extracted entities
- Always be polite and professional
- If the customer seems confused, explain clearly what you need
- Keep responses concise for a voice conversation"""


def get_llm():
    global _llm, _load_time
    if _llm is None:
        with _lock:
            if _llm is None:
                start = time.time()
                _llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    api_key=os.getenv("GROQ_API_KEY"),
                    temperature=0.3,
                )
                _load_time = time.time() - start
                print(f"[groq] LLM initialized in {_load_time:.1f}s")
    return _llm


def is_loaded() -> bool:
    return _llm is not None


def _parse_response(content: str) -> dict:
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        pass

    start = content.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(content)):
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(content[start:i + 1])
                    except json.JSONDecodeError:
                        break

    return {
        "next_question": content.split("{")[0].strip() if "{" in content else content,
        "entities": {},
        "confidence": 0.0,
        "should_end_call": False,
    }


def process_transcript(session_id: str, transcript_chunk: str, conversation_history: list, cv_results: dict) -> dict:
    llm = get_llm()

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in conversation_history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    context_parts = []
    if cv_results:
        context_parts.append(f"[CV Analysis: {json.dumps(cv_results)}]")
    context_parts.append(transcript_chunk)

    messages.append(HumanMessage(content="\n".join(context_parts)))
    response = llm.invoke(messages)
    parsed = _parse_response(response.content)

    entities = parsed.get("entities", {})
    return {
        "next_question": parsed.get("next_question", ""),
        "entities_extracted": {
            "full_name": entities.get("full_name"),
            "date_of_birth": entities.get("date_of_birth"),
            "declared_age": entities.get("declared_age"),
            "employer": entities.get("employer"),
            "monthly_income": entities.get("monthly_income"),
            "loan_purpose": entities.get("loan_purpose"),
            "loan_amount_requested": entities.get("loan_amount_requested"),
            "consent_given": entities.get("consent_given", False),
            "consent_phrase": entities.get("consent_phrase"),
            "confidence": parsed.get("confidence", 0.0),
        },
        "classification": None,
        "should_end_call": parsed.get("should_end_call", False),
    }


def extract_entities(full_transcript: str) -> dict:
    llm = get_llm()

    prompt = f"""Extract loan application entities from this transcript. Return ONLY a JSON object with these fields:
{{
  "full_name": string or null,
  "date_of_birth": "YYYY-MM-DD" or null,
  "declared_age": integer or null,
  "employer": string or null,
  "monthly_income": number or null,
  "loan_purpose": string or null,
  "loan_amount_requested": number or null,
  "consent_given": boolean,
  "consent_phrase": string or null,
  "confidence": 0.0 to 1.0
}}

Transcript:
{full_transcript}"""

    messages = [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    parsed = _parse_response(response.content)

    if "entities" in parsed:
        return parsed["entities"]
    return parsed


def classify_risk(entities: dict, cv_results: dict, geo_data: dict) -> dict:
    llm = get_llm()

    prompt = f"""You are a risk assessment engine. Based on the following data, classify the loan application risk.

Applicant Data: {json.dumps(entities)}
Face Verification: {json.dumps(cv_results)}
Geolocation: {json.dumps(geo_data)}

Risk Bands: A1 (excellent, 0.85-1.0), A2 (good, 0.70-0.84), B1 (fair, 0.55-0.69), B2 (moderate, 0.40-0.54), C1 (poor, 0.25-0.39), C2 (very poor, 0.10-0.24), REJECT (0-0.09)

Consider:
- Face match score (higher = less fraud risk)
- Age consistency (estimated vs declared)
- Income to loan amount ratio (reasonable < 20x monthly income)
- Geographic risk factors

Return ONLY a JSON object:
{{
  "risk_band": "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"REJECT",
  "confidence": 0.0 to 1.0,
  "fraud_flags": ["list of any concerns"],
  "rationale": "brief explanation"
}}"""

    messages = [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    parsed = _parse_response(response.content)

    return {
        "risk_band": parsed.get("risk_band", "B1"),
        "confidence": parsed.get("confidence", 0.5),
        "fraud_flags": parsed.get("fraud_flags", []),
        "rationale": parsed.get("rationale", "Unable to assess"),
    }
