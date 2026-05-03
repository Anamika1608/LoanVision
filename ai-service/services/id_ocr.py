import json
import os
import threading
import time

import numpy as np
from groq import Groq
from paddleocr import PaddleOCR

_ocr = None
_groq = None
_lock = threading.Lock()

EXTRACT_PROMPT = """You are an ID document parser. Given raw OCR text from an Indian government ID (Aadhaar card, PAN card, passport, or driving license), extract the following fields.

The OCR text may contain garbled Hindi transliterations, random characters, and noise — ignore those and focus on extracting the correct English text.

Return ONLY a JSON object with these fields:
{
  "full_name": string or null,
  "date_of_birth": "YYYY-MM-DD" or null,
  "id_number": string or null (Aadhaar: 12 digits, PAN: XXXXX0000X format),
  "id_type": "aadhaar" | "pan" | "passport" | "driving_license" | null,
  "gender": "Male" | "Female" | null
}

Rules:
- For name, pick the clearly readable English full name (first + last), ignore garbled text
- For DOB, convert to YYYY-MM-DD format regardless of input format
- For Aadhaar, the 12-digit number formatted as XXXX XXXX XXXX
- For PAN, the 10-character alphanumeric code
- Ignore VID numbers, issue dates, and other metadata
- If a field cannot be determined, set it to null"""


def _get_ocr():
    global _ocr
    if _ocr is None:
        with _lock:
            if _ocr is None:
                start = time.time()
                _ocr = PaddleOCR(lang="en")
                print(f"[paddleocr] Loaded in {time.time() - start:.1f}s")
    return _ocr


def _get_groq():
    global _groq
    if _groq is None:
        _groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq


def preload_model():
    _get_ocr()


def is_loaded() -> bool:
    return _ocr is not None


def _extract_with_llm(raw_text: str) -> dict:
    client = _get_groq()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": EXTRACT_PROMPT},
            {"role": "user", "content": f"OCR Text:\n{raw_text}"},
        ],
        temperature=0.0,
    )
    content = response.choices[0].message.content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]

    return json.loads(content.strip())


def extract_id_data(image_rgb: np.ndarray) -> dict:
    ocr = _get_ocr()
    print(f"[id_ocr] Processing image of shape {image_rgb.shape}")

    lines = []
    for result in ocr.predict(image_rgb):
        texts = result.get("rec_texts", [])
        scores = result.get("rec_scores", [])
        for text, score in zip(texts, scores):
            text = text.strip()
            if text and score > 0.3:
                lines.append(f"[{score:.2f}] {text}")

    raw_text = "\n".join(lines)
    print(f"[id_ocr] Raw OCR output:\n{raw_text}")

    try:
        parsed = _extract_with_llm(raw_text)
        print(f"[id_ocr] LLM extracted: {parsed}")
    except Exception as e:
        print(f"[id_ocr] LLM extraction failed: {e}, returning empty")
        parsed = {}

    id_data = {
        "full_name": parsed.get("full_name"),
        "date_of_birth": parsed.get("date_of_birth"),
        "id_number": parsed.get("id_number"),
        "id_type": parsed.get("id_type"),
        "gender": parsed.get("gender"),
        "raw_text": raw_text,
    }

    print(f"[id_ocr] Result: name={id_data['full_name']}, dob={id_data['date_of_birth']}, "
          f"id_number={id_data['id_number']}, id_type={id_data['id_type']}, gender={id_data['gender']}")
    return id_data
