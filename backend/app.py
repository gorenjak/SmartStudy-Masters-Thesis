import os
import random
import json
import re
import uuid
import secrets
import logging
import math

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from pymongo import MongoClient, ReturnDocument
from dotenv import load_dotenv
from google import genai
from google.genai import types
from groq import Groq
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()
app = Flask(__name__)
logger = logging.getLogger(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
)

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-2.5-flash"
groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
    timeout=25.0,
    max_retries=0
)
GROQ_MODEL = "llama-3.3-70b-versatile"

MONGO_URI = os.getenv("MONGO_URI")
mongo_conn = MongoClient(MONGO_URI)
db = mongo_conn.SmartStudy
db.users.create_index("userId", unique=True)

db.quiz_results.create_index(
    [("userId", 1), ("lesson_id", 1)],
    unique=True
)

db.surveys.create_index(
    "userId",
    unique=True
)

db.lessons.create_index([
    ("generatedByUserId", 1),
    ("created_at", -1)
])

ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

def generate_access_code():
    parts = [
        "".join(secrets.choice(ACCESS_CODE_ALPHABET) for _ in range(4))
        for _ in range(3)
    ]

    return "SS-" + "-".join(parts)

def generate_randomization_sequence(num_blocks=250):
    rng = random.Random(20260825)
    sequence = []

    for _ in range(num_blocks):
        block = ["static", "static", "adaptive", "adaptive"]
        rng.shuffle(block)
        sequence.extend(block)

    return sequence

RANDOMIZATION_SEQUENCE = generate_randomization_sequence()

def assign_variant():
    state = db.randomization.find_one_and_update(
        {"_id": "main_study"},
        {"$inc": {"nextIndex": 1}},
        upsert=True,
        return_document=ReturnDocument.BEFORE
    )

    index = state.get("nextIndex", 0) if state else 0

    if index >= len(RANDOMIZATION_SEQUENCE):
        raise RuntimeError("Randomization sequence exhausted")

    return RANDOMIZATION_SEQUENCE[index]

def serialize_user(user):
    return {
        "userId": user.get("userId"),
        "language": user.get("language", "sl"),
        "variant": user.get("variant"),
        "cognitiveStyle": user.get("cognitiveStyle"),
        "activeStyle": user.get(
            "activeStyle",
            user.get("cognitiveStyle")
        ),
        "learningGoal": user.get("learningGoal"),
        "ageGroup": user.get("ageGroup"),
        "aiUsage": user.get("aiUsage"),
        "consentGiven": user.get("consentGiven", False),
        "instructionsSeen": user.get(
            "instructionsSeen",
            False
        ),
        "surveyCompleted": user.get(
            "surveyCompleted",
            False
        ),
        "recommendationsEnabled": user.get(
            "recommendationsEnabled",
            True
        )
    }

def require_user_id(data):
    user_id = data.get("userId")

    if not isinstance(user_id, str) or not user_id.strip():
        return None, (
            jsonify({"error": "userId required"}),
            400
        )

    return user_id.strip(), None

def ensure_lang_dict(value, default_sl="", default_en=""):
    if isinstance(value, dict):
        return {
            "sl": value.get("sl", default_sl),
            "en": value.get("en", default_en)
        }
    return {"sl": default_sl, "en": default_en}

def ensure_lang_list(value):
    if isinstance(value, dict):
        return {
            "sl": value.get("sl", []) if isinstance(value.get("sl", []), list) else [],
            "en": value.get("en", []) if isinstance(value.get("en", []), list) else []
        }
    return {"sl": [], "en": []}

def normalize_definitions(definitions):
    result = {"sl": [], "en": []}

    if not isinstance(definitions, dict):
        return result

    for lang in ["sl", "en"]:
        items = definitions.get(lang, [])
        normalized = []

        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    term = str(item.get("term", "")).strip()
                    definition = str(item.get("definition", "")).strip()
                    if term or definition:
                        normalized.append({
                            "term": term,
                            "definition": definition
                        })
                elif isinstance(item, str):
                    normalized.append({
                        "term": item[:40].strip(),
                        "definition": item.strip()
                    })

        result[lang] = normalized

    return result

def normalize_examples(examples):
    result = {"sl": [], "en": []}
    if not isinstance(examples, dict):
        return result

    for lang in ["sl", "en"]:
        items = examples.get(lang, [])
        if isinstance(items, list):
            result[lang] = [str(x).strip() for x in items if str(x).strip()]
    return result

def normalize_tags(tags):
    result = {"sl": [], "en": []}

    if not isinstance(tags, dict):
        return result

    for lang in ["sl", "en"]:
        items = tags.get(lang, [])
        if isinstance(items, list):
            cleaned = []
            for item in items:
                text = str(item).strip().lower()
                if text and text not in cleaned:
                    cleaned.append(text)
            result[lang] = cleaned[:5]

    return result

def normalize_lesson_data(lesson_data, topic_query):
    lesson_data = lesson_data or {}

    topic = ensure_lang_dict(lesson_data.get("topic"), topic_query, topic_query)
    category = ensure_lang_dict(lesson_data.get("category"), "", "")
    tags = normalize_tags(lesson_data.get("tags"))
    common_intro = ensure_lang_dict(lesson_data.get("common_intro"), "", "")

    verbal = lesson_data.get("verbal_elements", {}) or {}
    text_short = ensure_lang_dict(verbal.get("text_short"), "", "")
    text_detailed = ensure_lang_dict(verbal.get("text_detailed"), "", "")
    summary_bullets = ensure_lang_list(verbal.get("summary_bullets"))
    key_terms = ensure_lang_list(verbal.get("key_terms"))

    learning_aids = lesson_data.get("learning_aids", {}) or {}
    definitions = normalize_definitions(learning_aids.get("definitions"))
    examples = normalize_examples(learning_aids.get("examples"))

    return {
        "topic": topic,
        "category": category,
        "tags": tags,
        "common_intro": common_intro,
        "verbal_elements": {
            "text_short": text_short,
            "text_detailed": text_detailed,
            "summary_bullets": summary_bullets,
            "key_terms": key_terms
        },
        "learning_aids": {
            "definitions": definitions,
            "examples": examples
        }
    }

def extract_json_object(text: str) -> str:
    if not text:
        raise ValueError("Empty response")

    text = text.strip()

    if text.startswith("{") and text.endswith("}"):
        return text

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in response")

    return text[start:end + 1]

def try_repair_json(raw_text):
    if not raw_text:
        raise ValueError("Empty response")

    candidate = extract_json_object(raw_text)
    candidate = re.sub(r',(\s*[}\]])', r'\1', candidate)
    candidate = candidate.replace('“', '"').replace('”', '"').replace("’", "'")

    return json.loads(candidate)

def safe_json_loads(raw_text, provider_name="unknown"):
    if not raw_text or not str(raw_text).strip():
        raise ValueError(f"{provider_name} returned empty response")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        try:
            candidate = extract_json_object(raw_text)
            return json.loads(candidate)
        except Exception:
            return try_repair_json(raw_text)

# AI LOGIKA 
def generate_lesson_ai(topic_query):
    """Generates bilingual lesson content aligned with frontend structure."""
    prompt = f"""
    Create a COMPREHENSIVE and HIGH-QUALITY educational lesson about: {topic_query}.

    STRICT REQUIREMENTS:
    1) 'text_detailed' in BOTH languages MUST be detailed, informative, and at least 500 words long per language. Do not truncate or use placeholders.
    2) 'text_short' in BOTH languages MUST be 120-180 words.
    3) 'summary_bullets' in BOTH languages MUST contain exactly 6 high-quality bullet points summarizing the text.
    4) 'key_terms' in BOTH languages MUST contain 5-10 short technical terms.
    5) 'definitions' MUST contain 6 items per language.
       Each item must be an object with:
       - "term"
       - "definition"
    6) 'examples' MUST contain 6 concise practical real-world examples per language.
    7) Return ONLY valid JSON. No markdown (do not wrap in ```json). No explanations.
    8) All strings must use double quotes only.
    9) Escape internal quotation marks properly.

    REQUIRED JSON STRUCTURE:
    {{
      "topic": {{
        "sl": "Slovenski naslov",
        "en": "English title"
      }},
      "common_intro": {{
        "sl": "Kratek uvod",
        "en": "Short introduction"
      }},
      "verbal_elements": {{
        "text_short": {{
          "sl": "...",
          "en": "..."
        }},
        "text_detailed": {{
          "sl": "...",
          "en": "..."
        }},
        "summary_bullets": {{
          "sl": ["...", "...", "...", "...", "...", "..."],
          "en": ["...", "...", "...", "...", "...", "..."]
        }},
        "key_terms": {{
          "sl": ["...", "...", "..."],
          "en": ["...", "...", "..."]
        }}
      }},
      "learning_aids": {{
        "definitions": {{
          "sl": [
            {{"term": "Pojem 1", "definition": "Razlaga pojma 1."}},
            {{"term": "Pojem 2", "definition": "Razlaga pojma 2."}}
          ],
          "en": [
            {{"term": "Term 1", "definition": "Definition of term 1."}},
            {{"term": "Term 2", "definition": "Definition of term 2."}}
          ]
        }},
        "examples": {{
          "sl": ["...", "...", "..."],
          "en": ["...", "...", "..."]
        }}
      }}
    }}
    """

    try:
        print("🔵 Trying Gemini...")
        res = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return safe_json_loads(res.text, "Gemini")

    except Exception as e:
        print(f"⚠️ Gemini fallback to Groq: {e}")

        try:
            completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Return only valid JSON. "
                            "Do not use markdown. "
                            "Do not add explanations. "
                            "Use only double quotes. "
                            "Escape internal quotes correctly."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=GROQ_MODEL,
                temperature=0.0
            )

            raw_text = completion.choices[0].message.content

            return safe_json_loads(raw_text, "Groq")

        except Exception as groq_err:
            print(f"❌ Groq lesson generation failed: {groq_err}")
            raise

def generate_lesson_metadata_ai(topic_sl, topic_en, key_terms_sl, key_terms_en, summary_sl=None, summary_en=None):
    prompt = f"""
    Based on the lesson topic and key terms, return ONLY valid JSON with:
    - one broad semantic category
    - 3 to 5 topical tags

    IMPORTANT:
    - The category should be abstract enough to group related items together.
      Example:
      bee, horse, penguin, cat, red panda -> animals
      triangle, circle, algebra -> mathematics
      Spain, France, Germany -> geography
    - Tags should be more specific than category.
    - Return only valid JSON. No markdown. No explanation.

    REQUIRED JSON:
    {{
      "category": {{
        "sl": "živali",
        "en": "animals"
      }},
      "tags": {{
        "sl": ["čebela", "narava", "žuželke"],
        "en": ["bee", "nature", "insects"]
      }}
    }}

    TOPIC SL: {topic_sl}
    TOPIC EN: {topic_en}

    KEY TERMS SL: {json.dumps(key_terms_sl, ensure_ascii=False)}
    KEY TERMS EN: {json.dumps(key_terms_en, ensure_ascii=False)}

    SUMMARY SL: {json.dumps(summary_sl or [], ensure_ascii=False)}
    SUMMARY EN: {json.dumps(summary_en or [], ensure_ascii=False)}
    """

    try:
        print("🔵 Trying Gemini for metadata...")
        res = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        parsed = safe_json_loads(res.text, "Gemini metadata")

        return {
            "category": ensure_lang_dict(parsed.get("category"), "", ""),
            "tags": normalize_tags(parsed.get("tags"))
        }

    except Exception as e:
        print(f"⚠️ Gemini metadata fallback to Groq: {e}")

        try:
            completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a metadata extraction API. Return only valid JSON. "
                            "No markdown. No explanations. Use only double quotes. "
                            "ALWAYS return categories and tags in LOWERCASE. "
                            "Keep categories general and tags specific."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=GROQ_MODEL,
                temperature=0.0
            )

            raw_text = completion.choices[0].message.content
            parsed = safe_json_loads(raw_text, "Groq metadata")

            return {
                "category": ensure_lang_dict(parsed.get("category"), "", ""),
                "tags": normalize_tags(parsed.get("tags"))
            }

        except Exception as groq_err:
            print(f"⚠️ Metadata AI generation failed: {groq_err}")
            return {
                "category": {"sl": "", "en": ""},
                "tags": {"sl": [], "en": []}
            }

def generate_quiz_ai(lesson_text_en, lesson_text_sl):
    """Generates 5 MCQ questions based on text."""
    prompt = f"""
    Generate 5 MCQ questions based on the content.
    Return ONLY a JSON object with a key 'quiz' containing an array.
    Each question: {{"q": {{"sl": "", "en": ""}}, "options": {{"sl": [], "en": []}}, "a_index": int}}

    Content SL: {lesson_text_sl[:1000]}
    Content EN: {lesson_text_en[:1000]}
    """

    try:
        print("🔵 Trying Gemini for quiz...")
        res = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        raw = safe_json_loads(res.text, "Gemini quiz")
        return raw.get("quiz", [])

    except Exception as e:
        print(f"⚠️ Gemini quiz fallback to Groq: {e}")

        try:
            completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Return only valid JSON. No markdown. No explanations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=GROQ_MODEL,
                temperature=0.2
            )

            raw = safe_json_loads(completion.choices[0].message.content, "Groq quiz")
            return raw.get("quiz", [])

        except Exception as groq_err:
            print(f"❌ Quiz generation failed: {groq_err}")
            return []

def generate_mermaid_ai(topic_sl, topic_en, summary_sl, summary_en):
    """
    Generate JSON mindmap structure first, then convert to Mermaid mindmap code.
    This avoids Mermaid syntax errors.
    """
    def generate_tree_for_lang(topic, lang_label, bullets):
        bullets = bullets or []

        prompt = f"""
        Create a mind map STRUCTURE for the topic: {topic}.
        Return ONLY JSON, no markdown.

        LANGUAGE RULE:
        - All category names and items MUST be in {lang_label}.

        STRICT STRUCTURE:
        {{
        "categories": [
            {{"name": "Category", "items": ["Item1", "Item2"]}},
            {{"name": "Category", "items": ["Item1", "Item2"]}},
            {{"name": "Category", "items": ["Item1", "Item2"]}},
            {{"name": "Category", "items": ["Item1", "Item2"]}}
        ]
        }}

        RULES:
        - Exactly 4 categories.
        - Each category: 2–4 items.
        - Items must be short (1–4 words), no full sentences.
        - Use ONLY ideas from these bullet points.

        BULLETS:
        {json.dumps(bullets, ensure_ascii=False)}
        """

        try:
            print(f"🔵 Trying Gemini for Mermaid ({lang_label})...")
            res = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            tree = safe_json_loads(res.text, "Gemini")
        except Exception as e:
            print(f"⚠️ Gemini Mermaid fallback to Groq: {e}")
            completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Return only valid JSON. No markdown. No explanations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=GROQ_MODEL,
                temperature=0.2
            )
            tree = safe_json_loads(completion.choices[0].message.content, "Groq")

        return build_mermaid_mindmap(topic, tree)

    return {
        "sl": generate_tree_for_lang(topic_sl, "Slovenian", summary_sl),
        "en": generate_tree_for_lang(topic_en, "English", summary_en),
    }

def build_mermaid_mindmap(topic: str, tree: dict) -> str:
    def clean_label(s: str) -> str:
        s = (s or "").strip()
        s = re.sub(r'[()\[\]{}?_"`<>]', '', s)
        s = re.sub(r'\s+', ' ', s)
        return s[:40].strip()

    topic = clean_label(topic) or "Topic"

    lines = ["mindmap", f"  root(({topic}))"]

    categories = (tree or {}).get("categories", [])
    for cat in categories[:4]:
        cat_name = clean_label(cat.get("name", "Category")) or "Category"
        lines.append(f"    {cat_name}")
        items = cat.get("items", []) or []
        for it in items[:4]:
            item = clean_label(it)
            if item:
                lines.append(f"      {item}")

    return "\n".join(lines)

def normalize_text(text):
    if not text:
        return ""

    text = text.strip().lower()

    replacements = {
        "č": "c",
        "š": "s",
        "ž": "z",
        "ć": "c",
        "đ": "d"
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    words = []

    for word in text.split():
        if len(word) >= 4:
            english_plural_changed = False

            if re.match(r'^[a-z]+$', word):
                if word.endswith("ies") and len(word) > 4:
                    word = word[:-3] + "y"
                    english_plural_changed = True
                elif word.endswith("sses") and len(word) > 5:
                    word = word[:-2]
                    english_plural_changed = True
                elif word.endswith(("ches", "shes", "xes", "zes")) and len(word) > 5:
                    word = word[:-2]
                    english_plural_changed = True
                elif word.endswith("s") and not word.endswith("ss") and len(word) > 3:
                    word = word[:-1]
                    english_plural_changed = True

            if not english_plural_changed:
                for suffix in [
                    "ami", "ega", "emu", "imi",
                    "ih", "im", "ov", "ev",
                    "je", "ji",
                    "e", "a", "i"
                ]:
                    if word.endswith(suffix) and len(word) - len(suffix) >= 3:
                        word = word[:-len(suffix)]
                        break

                if word.endswith("j") and len(word) >= 4:
                    word = word[:-1]

        words.append(word)

    return " ".join(words)

def token_similarity(a, b):
    a_tokens = set(normalize_text(a).split())
    b_tokens = set(normalize_text(b).split())

    if not a_tokens or not b_tokens:
        return 0

    return len(a_tokens.intersection(b_tokens)) / len(a_tokens.union(b_tokens))

def find_existing_lesson_by_query(topic_query):
    normalized_query = normalize_text(topic_query)

    if not normalized_query:
        return None

    all_lessons = list(db.lessons.find())

    for lesson in all_lessons:
        candidates = [
            lesson.get("lesson_id", ""),
            lesson.get("topic", {}).get("sl", ""),
            lesson.get("topic", {}).get("en", ""),
            *lesson.get("aliases", [])
        ]

        normalized_candidates = [
            normalize_text(candidate)
            for candidate in candidates
            if candidate
        ]

        for candidate in normalized_candidates:
            if normalized_query == candidate:
                return lesson

            if token_similarity(normalized_query, candidate) >= 0.8:
                return lesson

    return None

def find_existing_lesson(lesson_data):
    generated_sl = normalize_text(lesson_data.get("topic", {}).get("sl", ""))
    generated_en = normalize_text(lesson_data.get("topic", {}).get("en", ""))

    generated_candidates = [
        generated_sl,
        generated_en
    ]

    all_lessons = list(db.lessons.find())

    for lesson in all_lessons:
        lesson_sl = normalize_text(lesson.get("topic", {}).get("sl", ""))
        lesson_en = normalize_text(lesson.get("topic", {}).get("en", ""))

        lesson_aliases = [
            normalize_text(a)
            for a in lesson.get("aliases", [])
            if a
        ]

        existing_candidates = [
            lesson_sl,
            lesson_en,
            *lesson_aliases
        ]

        # 1. Direct matching
        if generated_sl and generated_sl == lesson_sl:
            return lesson

        if generated_en and generated_en == lesson_en:
            return lesson

        # 2. Direct matching with aliases
        if generated_sl in lesson_aliases or generated_en in lesson_aliases:
            return lesson

        #3. Partial match/similarity
        for new_item in generated_candidates:
            for old_item in existing_candidates:
                if token_similarity(new_item, old_item) >= 0.8:
                    return lesson

    return None

# API POTI
@app.route('/api/generate-lesson', methods=['POST', 'OPTIONS'])
def generate_lesson():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        payload = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(payload)
        if error_response:
            return error_response

        topic_query = (payload.get("topic") or "").strip()

        if not topic_query:
            return jsonify({
                "error": "Missing topic"
            }), 400

        # Quick check before ai generator
        existing_pre = find_existing_lesson_by_query(topic_query)

        if existing_pre:
            print(f"Lesson for '{topic_query}' already found in the database (pre-search).")
            existing_pre["_id"] = str(existing_pre["_id"])
            existing_pre.pop("generatedByUserId", None)
            existing_pre.pop("generated_by", None)
            return jsonify(existing_pre), 200

        today_start = utc_now().replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

        generated_today = db.lessons.count_documents({
            "generatedByUserId": user_id,
            "created_at": {
                "$gte": today_start
            }
        })

        if generated_today >= 1:
            return jsonify({
                "error": "daily_generation_limit"
            }), 429

        raw_lesson_data = generate_lesson_ai(topic_query)
        lesson_data = normalize_lesson_data(raw_lesson_data, topic_query)
    
        lesson_id = normalize_text(
            lesson_data.get("topic", {}).get("en", topic_query)
        ).replace(" ", "_")

        topic_sl = lesson_data.get("topic", {}).get("sl") or topic_query
        topic_en = lesson_data.get("topic", {}).get("en") or topic_query

        key_terms_obj = lesson_data.get("verbal_elements", {}).get("key_terms", {}) or {}
        key_terms_sl = key_terms_obj.get("sl", []) if isinstance(key_terms_obj.get("sl", []), list) else []
        key_terms_en = key_terms_obj.get("en", []) if isinstance(key_terms_obj.get("en", []), list) else []

        summary_obj = lesson_data.get("verbal_elements", {}).get("summary_bullets", {}) or {}
        summary_sl = summary_obj.get("sl", []) if isinstance(summary_obj.get("sl", []), list) else []
        summary_en = summary_obj.get("en", []) if isinstance(summary_obj.get("en", []), list) else []

        ai_meta = generate_lesson_metadata_ai(
            topic_sl=topic_sl,
            topic_en=topic_en,
            key_terms_sl=key_terms_sl,
            key_terms_en=key_terms_en,
            summary_sl=summary_sl,
            summary_en=summary_en
        )

        lesson_data["category"] = ai_meta["category"]
        lesson_data["tags"] = ai_meta["tags"]

        existing = find_existing_lesson(lesson_data)

        if existing:
            existing["_id"] = str(existing["_id"])
            existing.pop("generatedByUserId", None)
            existing.pop("generated_by", None)

            return jsonify(existing), 200

        verbal = lesson_data.get('verbal_elements', {})
        text_detailed = verbal.get('text_detailed', {})
        text_en = (text_detailed.get('en') or '').strip()
        text_sl = (text_detailed.get('sl') or '').strip()

        if not text_en or not text_sl:
            return jsonify({
                "error": "Lesson generation failed: missing detailed text",
                "debug": {
                    "len_en": len(text_en),
                    "len_sl": len(text_sl)
                }
            }), 500

        quiz = generate_quiz_ai(text_en, text_sl)
        lesson_data['quiz'] = quiz

        topic_sl = lesson_data.get("topic", {}).get("sl") or topic_query
        topic_en = lesson_data.get("topic", {}).get("en") or topic_query

        summary_obj = lesson_data.get('verbal_elements', {}).get('summary_bullets', {})
        summary_sl = summary_obj.get('sl', []) or []
        summary_en = summary_obj.get('en', []) or []

        lesson_data['visual_elements'] = {
            "mind_map_mermaid": generate_mermaid_ai(
                topic_sl,
                topic_en,
                summary_sl,
                summary_en
            )
        }

        lesson_data["lesson_id"] = lesson_id
        lesson_data["created_at"] = utc_now()
        lesson_data["generatedByUserId"] = user_id

        lesson_data["aliases"] = list(set([
            normalize_text(topic_query),
            normalize_text(topic_sl),
            normalize_text(topic_en),
            normalize_text(lesson_id),
            normalize_text(lesson_id.replace("_", " "))
        ]))

        db.lessons.update_one(
            {"lesson_id": lesson_id},
            {"$set": lesson_data},
            upsert=True
        )

        response_data = {
            key: value
            for key, value in lesson_data.items()
            if key != "generatedByUserId"
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ /api/generate-lesson failed: {repr(e)}")
        return jsonify({
            "error": str(e),
            "message": "Lesson generation failed. Check AI fallback response."
        }), 500

WEIGHT_CONTENT = 0.75
WEIGHT_COLLABORATIVE = 0.25

MAX_POSSIBLE_CONTENT_SCORE = 9.0

def parse_category(category_dict):
    cat = category_dict or {}
    if isinstance(cat, dict):
        return (
            str(cat.get("sl", "")).strip().lower(),
            str(cat.get("en", "")).strip().lower()
        )
    cat_str = str(cat).strip().lower()
    return cat_str, cat_str

def get_lesson_interest_terms(lesson):
    terms = {"sl": [], "en": []}

    tags = lesson.get("tags", {})
    if isinstance(tags, dict):
        terms["sl"].extend(tags.get("sl", []))
        terms["en"].extend(tags.get("en", []))
    elif isinstance(tags, list):
        terms["sl"].extend(tags)
        terms["en"].extend(tags)

    terms["sl"] = list(set(str(t).strip().lower() for t in terms["sl"] if t))
    terms["en"] = list(set(str(t).strip().lower() for t in terms["en"] if t))

    return terms

def calculate_content_similarity(current_lesson, current_terms, candidate_lesson):
    cand_terms = get_lesson_interest_terms(candidate_lesson)
    cand_tags_sl = set(cand_terms.get("sl", []))
    cand_tags_en = set(cand_terms.get("en", []))

    curr_tags_sl = set(current_terms.get("sl", []))
    curr_tags_en = set(current_terms.get("en", []))

    matched_sl = sorted(curr_tags_sl.intersection(cand_tags_sl))
    matched_en = sorted(curr_tags_en.intersection(cand_tags_en))
    tag_overlap_count = min(max(len(matched_sl), len(matched_en)), 3)

    curr_sl, curr_en = parse_category(current_lesson.get("category"))
    cand_sl, cand_en = parse_category(candidate_lesson.get("category"))

    same_category = bool((curr_sl and cand_sl and curr_sl == cand_sl) or 
                         (curr_en and cand_en and curr_en == cand_en))

    cat_score = 3.0 if same_category else 0.0
    tag_score = float(tag_overlap_count * 2.0)
    raw_content_score = cat_score + tag_score

    norm_content = raw_content_score / MAX_POSSIBLE_CONTENT_SCORE

    return {
        "raw_score": raw_content_score,
        "normalized_score": norm_content,
        "same_category": same_category,
        "matched_sl": matched_sl,
        "matched_en": matched_en,
        "candidate_terms": cand_terms
    }

def get_collaborative_score(
    current_lesson_id,
    candidate_lesson_id
):
    transition = db.pilot_recommendation_transitions.find_one({
        "previous_lesson_id": current_lesson_id,
        "lesson_id": candidate_lesson_id
    })

    co_occurrence_count = (
        transition.get("count", 0)
        if transition
        else 0
    )

    raw_collab_score = float(co_occurrence_count)

    normalized_collab_score = (
        raw_collab_score / (raw_collab_score + 5.0)
        if raw_collab_score > 0
        else 0.0
    )

    return {
        "raw_score": raw_collab_score,
        "normalized_score": normalized_collab_score
    }

def generate_explanation(candidate_data, current_lesson):
    content = candidate_data["content_info"]
    collab = candidate_data["collab_info"]
    matched_sl = content["matched_sl"]
    matched_en = content["matched_en"]

    if matched_sl:
        return {
            "sl": f"To vsebino ti priporočamo, ker se povezuje s pojmi, ki si jih pravkar obravnaval/a: {', '.join(matched_sl[:2])}.",
            "en": f"This content is recommended because it relates to concepts you have just studied: {', '.join(matched_en[:2])}." if matched_en else "This content is recommended because it relates to concepts you have just studied."
        }
    if matched_en:
        return {
            "sl": "To vsebino ti priporočamo, ker je povezana s trenutno obravnavano temo.",
            "en": f"This content is recommended because it relates to concepts you have just studied: {', '.join(matched_en[:2])}."
        }
    if content["same_category"]:
        return {
            "sl": "To vsebino ti priporočamo, ker nadaljuje podobno področje kot tvoja trenutna lekcija.",
            "en": "This content is recommended because it continues a similar subject area to your current lesson."
        }
    if collab["raw_score"] > 0:
        return {
            "sl": "To vsebino ti priporočamo, ker so jo po tej temi obravnavali tudi drugi uporabniki.",
            "en": "This content is recommended because other users studied it after this topic."
        }
    return {
        "sl": "To vsebino ti priporočamo kot možnost za nadaljevanje učenja.",
        "en": "This content is recommended as an option for continuing your learning."
    }

def utc_now():
    return datetime.now(timezone.utc)

@app.route('/api/recommend-next', methods=['POST', 'OPTIONS'])
def recommend_next():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        current_lesson_id = data.get("current_lesson_id")

        if (
            not isinstance(current_lesson_id, str)
            or not current_lesson_id.strip()
        ):
            return jsonify({
                "error": "current_lesson_id required"
            }), 400

        current_lesson_id = current_lesson_id.strip()

        user = db.users.find_one(
            {"userId": user_id},
            {
                "_id": 0,
                "recommendationsEnabled": 1,
                "recommendationsReEnabledAt": 1
            }
        )

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        recommendations_enabled = user.get(
            "recommendationsEnabled",
            True
        )

        recommendations_re_enabled_at = user.get(
            "recommendationsReEnabledAt"
        )

        rejection_filter = {
            "userId": user_id,
            "recommendation_rejected": True
        }

        if recommendations_re_enabled_at:
            rejection_filter["session_updated_at"] = {
                "$gt": recommendations_re_enabled_at
            }

        recent_rejections = db.learning_sessions.count_documents(
            rejection_filter
        )

        if (
            not recommendations_enabled
            or recent_rejections >= 1
        ):
            db.users.update_one(
                {"userId": user_id},
                {
                    "$set": {
                        "recommendationsEnabled": False
                    }
                }
            )

            return jsonify({
                "recommendations": [],
                "recommendationsEnabled": False
            }), 200

        completed_lessons = set(
            db.quiz_results.distinct(
                "lesson_id",
                {
                    "userId": user_id,
                    "completed_lesson": True
                }
            )
        )

        current_lesson = db.lessons.find_one(
            {"lesson_id": current_lesson_id},
            {
                "_id": 0,
                "lesson_id": 1,
                "topic": 1,
                "category": 1,
                "tags": 1
            }
        )

        if not current_lesson:
            return jsonify({
                "error": "Current lesson not found"
            }), 404

        all_lessons = list(
            db.lessons.find(
                {
                    "lesson_id": {
                        "$ne": current_lesson_id
                    }
                },
                {
                    "_id": 0,
                    "lesson_id": 1,
                    "topic": 1,
                    "category": 1,
                    "tags": 1
                }
            )
        )

        current_terms = get_lesson_interest_terms(
            current_lesson
        )

        scored_candidates = []

        for candidate in all_lessons:
            candidate_lesson_id = candidate.get("lesson_id")

            if not candidate_lesson_id:
                continue

            if candidate_lesson_id in completed_lessons:
                continue

            content_info = calculate_content_similarity(
                current_lesson,
                current_terms,
                candidate
            )

            collab_info = get_collaborative_score(
                current_lesson_id,
                candidate_lesson_id
            )

            final_score = (
                content_info["normalized_score"]
                * WEIGHT_CONTENT
                +
                collab_info["normalized_score"]
                * WEIGHT_COLLABORATIVE
            )

            scored_candidates.append({
                "lesson": candidate,
                "final_score": final_score,
                "content_info": content_info,
                "collab_info": collab_info
            })

        scored_candidates.sort(
            key=lambda candidate: candidate["final_score"],
            reverse=True
        )
        
        recommendations = []

        for candidate_data in scored_candidates[:1]:
            lesson = candidate_data["lesson"]

            recommendations.append({
                "lesson_id": lesson.get("lesson_id"),
                "topic": lesson.get("topic", {}),
                "category": lesson.get("category", {}),
                "tags": lesson.get("tags", {}),
                "reason": generate_explanation(
                    candidate_data,
                    current_lesson
                )
            })

        return jsonify({
            "recommendations": recommendations,
            "recommendationsEnabled": True,
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/recommend-next: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/update-learning-session', methods=['POST', 'OPTIONS'])
def update_learning_session():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        lesson_id = data.get("lesson_id")
        session_id = data.get("session_id")

        if not lesson_id or not session_id:
            return jsonify({
                "error": "lesson_id and session_id required"
            }), 400

        update_data = {
            "userId": user_id,
            "variant": data.get("variant"),
            "cognitiveStyle": data.get("cognitiveStyle"),
            "session_updated_at": utc_now()
        }

        for key in [
            "session_started",
            "duration_seconds",
            "opened_summary",
            "opened_visualization",
            "reached_end",
            "max_scroll_depth",
            "quiz_started",
            "quiz_completed",
            "quiz_score",
            "quiz_total",
            "recommendation_accepted",
            "recommendation_rejected",
            "recommended_lesson_id",
            "previous_lesson_id",
            "adaptive_review_suggested",
            "adaptive_review_summary_clicked",
            "adaptive_review_visual_clicked",
            "adaptive_review_skipped",
            "privacy_info_clicked",
            "adaptation_explanation_opened",
            "manual_style_change",
            "activeStyle",
            "manual_style_override",
            "assigned_style",
            "previous_style",
            "new_style",
            "session_id",
            "adaptive_intervention_triggered",
            "adaptive_intervention_reason",
            "adaptive_intervention_type",
            "learningGoal",
            "style_switch_suggested",
            "style_switch_accepted",
            "style_switch_rejected",
            "style_switch_reason"
        ]:
            if key in data:
                update_data[key] = data[key]

        meaningful_keys = [
            "session_started",
            "opened_summary",
            "opened_visualization",
            "reached_end",
            "quiz_started",
            "quiz_completed",
            "recommendation_accepted",
            "recommendation_rejected",
            "adaptive_review_suggested",
            "adaptive_review_summary_clicked",
            "adaptive_review_visual_clicked",
            "adaptive_review_skipped",
            "privacy_info_clicked",
            "adaptation_explanation_opened",
            "manual_style_override",
            "adaptive_intervention_triggered",
            "style_switch_suggested",
            "style_switch_accepted",
            "style_switch_rejected"
        ]

        has_meaningful_event = any(
            key in data and data.get(key) not in [None, False, 0, ""]
            for key in meaningful_keys
        )

        has_meaningful_duration = (
            data.get("duration_seconds", 0) > 2 or
            data.get("max_scroll_depth", 0) > 5
        )

        if not has_meaningful_event and not has_meaningful_duration:
            return jsonify({"status": "ignored_empty_session"}), 200

        db.learning_sessions.update_one(
            {
                "userId": user_id,
                "lesson_id": lesson_id,
                "session_id": session_id
            },
            {
                "$set": update_data,
                "$setOnInsert": {
                    "session_started_at": utc_now()
                }
            },
            upsert=True
        )

        return jsonify({"status": "updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-init', methods=['POST', 'OPTIONS'])
def init_user():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id = data.get("userId")
        access_code = data.get("accessCode")
        language = data.get("language", "sl")

        if language not in ["sl", "en"]:
            language = "sl"

        # Obstoječa psevdonimna seja:
        if user_id or access_code:
            if not user_id or not access_code:
                return jsonify({
                    "error": "userId and accessCode are required"
                }), 400

            user = db.users.find_one({"userId": user_id})

            if not user:
                return jsonify({
                    "error": "Invalid access data"
                }), 401

            access_code_hash = user.get("accessCodeHash")

            if (
                not access_code_hash
                or not check_password_hash(
                    access_code_hash,
                    access_code
                )
            ):
                return jsonify({
                    "error": "Invalid access data"
                }), 401

            updates = {
                "lastAccessAt": utc_now()
            }

            if user.get("language") != language:
                updates["language"] = language

            db.users.update_one(
                {"userId": user_id},
                {"$set": updates}
            )

            user.update(updates)

            return jsonify({
                **serialize_user(user),
                "isNewUser": False
            }), 200

        # Nova psevdonimna seja:
        new_user_id = str(uuid.uuid4())
        new_access_code = generate_access_code()
        now = utc_now()

        user = {
            "userId": new_user_id,
            "accessCodeHash": generate_password_hash(
                new_access_code
            ),
            "language": language,
            "variant": assign_variant(),
            "cognitiveStyle": None,
            "consentGiven": False,
            "instructionsSeen": False,
            "surveyCompleted": False,
            "recommendationsEnabled": True,
            "created_at": now,
            "lastAccessAt": now
        }

        db.users.insert_one(user)

        return jsonify({
            **serialize_user(user),
            "accessCode": new_access_code,
            "isNewUser": True
        }), 201

    except Exception as e:
        logger.error(
            f"Error in /api/user-init: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/set-consent', methods=['POST', 'OPTIONS'])
def set_consent():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        result = db.users.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "consentGiven": True,
                    "consentAt": utc_now()
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"status": "consent_saved"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/set-instructions-seen', methods=['POST', 'OPTIONS'])
def set_instructions_seen():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        result = db.users.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "instructionsSeen": True,
                    "instructionsSeenAt": utc_now()
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"status": "instructions_seen_saved"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/set-user-style', methods=['POST', 'OPTIONS'])
def set_user_style():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        style = data.get("cognitiveStyle")
        language = data.get('language')
        style_quiz_responses = data.get('styleQuizResponses')
        visual_score = data.get('visualScore')
        verbal_score = data.get('verbalScore')
        tie_choice_used = data.get('tieChoiceUsed')

        age_group = data.get('ageGroup')
        ai_usage = data.get('aiUsage')
        learning_goal = data.get('learningGoal')

        if not style:
            return jsonify({
                "error": "cognitiveStyle required"
            }), 400

        if style not in ['visual', 'verbal']:
            return jsonify({"error": "Invalid cognitiveStyle"}), 400

        valid_age_groups = ['18-19', '20-24', '25-29', '30+']
        valid_ai_usage = ['never', 'rarely', 'sometimes', 'often', 'very_often']
        valid_learning_goals = [
            'quick_understanding',
            'deep_understanding',
            'exam_preparation',
            'revision'
        ]

        if age_group and age_group not in valid_age_groups:
            return jsonify({"error": "Invalid ageGroup"}), 400

        if ai_usage and ai_usage not in valid_ai_usage:
            return jsonify({"error": "Invalid aiUsage"}), 400

        if learning_goal and learning_goal not in valid_learning_goals:
            return jsonify({"error": "Invalid learningGoal"}), 400

        existing_user = db.users.find_one({"userId": user_id})

        update_doc = {
            "cognitiveStyle": style,
            "activeStyle": style,
            "styleSetAt": utc_now()
        }

        if data.get("styleSwitchUsed") is True:
            update_doc["style_switch_used"] = True
            update_doc["style_switch_used_at"] = utc_now()

        if (
            existing_user
            and "initialCognitiveStyle" not in existing_user
        ):
            initial_style = (
                existing_user.get("cognitiveStyle")
                or style
            )

            update_doc["initialCognitiveStyle"] = initial_style

        if language:
            update_doc["language"] = language

        if age_group:
            update_doc["ageGroup"] = age_group

        if ai_usage:
            update_doc["aiUsage"] = ai_usage

        if learning_goal:
            update_doc["learningGoal"] = learning_goal

        if isinstance(style_quiz_responses, dict):
            update_doc["styleQuizResponses"] = style_quiz_responses

        if isinstance(visual_score, (int, float)):
            update_doc["visualScore"] = visual_score

        if isinstance(verbal_score, (int, float)):
            update_doc["verbalScore"] = verbal_score

        if isinstance(tie_choice_used, bool):
            update_doc["tieChoiceUsed"] = tie_choice_used
        
        if tie_choice_used is True:
            update_doc["tieChoice"] = style

        result = db.users.update_one(
            {"userId": user_id},
            {"$set": update_doc}
        )
        
        if result.matched_count > 0:
            return jsonify({
                "message": "Style updated successfully",
                "style": style,
                "visualScore": visual_score,
                "verbalScore": verbal_score,
                "tieChoiceUsed": tie_choice_used,
                "ageGroup": age_group,
                "aiUsage": ai_usage,
                "learningGoal": learning_goal
            }), 200

        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/submit-quiz', methods=['POST', 'OPTIONS'])
def submit_quiz():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        lesson_id = data.get("lesson_id")

        if not isinstance(lesson_id, str) or not lesson_id.strip():
            return jsonify({
                "error": "lesson_id required"
            }), 400

        lesson_id = lesson_id.strip()

        quiz_document = {
            key: value
            for key, value in data.items()
            if key not in {"email", "userId"}
        }

        quiz_document.update({
            "userId": user_id,
            "lesson_id": lesson_id,
            "completed_lesson": True,
            "timestamp": utc_now()
        })

        db.quiz_results.update_one(
            {
                "userId": user_id,
                "lesson_id": lesson_id
            },
            {
                "$set": quiz_document
            },
            upsert=True
        )

        return jsonify({
            "status": "saved"
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/submit-quiz: {e}",
            exc_info=True
        )
        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/lessons', methods=['GET'])
def get_lessons_list():
    lessons = list(db.lessons.find({}, {
        "lesson_id": 1,
        "topic": 1,
        "category": 1,
        "tags": 1,
        "created_at": 1,
        "_id": 0
    }))
    return jsonify(lessons), 200

@app.route('/api/get-content/<lesson_id>', methods=['GET'])
def get_lesson_content(lesson_id):
    try:
        lesson = db.lessons.find_one(
            {"lesson_id": lesson_id},
            {
                "generatedByUserId": 0,
                "generated_by": 0
            }
        )

        if not lesson:
            return jsonify({
                "error": "Not found"
            }), 404

        lesson["_id"] = str(lesson["_id"])

        return jsonify(lesson), 200

    except Exception as e:
        logger.error(
            f"Error in /api/get-content/{lesson_id}: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/completed-lessons-count', methods=['POST', 'OPTIONS'])
def completed_lessons_count():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        lessons = db.quiz_results.distinct(
            "lesson_id",
            {
                "userId": user_id,
                "completed_lesson": True
            }
        )

        return jsonify({
            "count": len(lessons)
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/completed-lessons-count: {e}",
            exc_info=True
        )
        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/submit-survey', methods=['POST', 'OPTIONS'])
def submit_survey():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        responses = data.get("responses")

        if not isinstance(responses, dict) or not responses:
            return jsonify({
                "error": "Missing or invalid responses"
            }), 400

        normalized_responses = {}

        for key, value in responses.items():
            try:
                numeric_value = int(value)
            except (TypeError, ValueError):
                return jsonify({
                    "error": f"Invalid response value for {key}"
                }), 400

            uses_seven_point_scale = (
                key.startswith("trust")
                or key.startswith("privacy")
                or key.startswith("acceptance")
                or key.startswith("perceivedPersonalization")
                or key.startswith("adaptation_notice")
            )

            max_value = 7 if uses_seven_point_scale else 5

            if numeric_value < 1 or numeric_value > max_value:
                return jsonify({
                    "error": (
                        f"Response out of range for {key} "
                        f"(must be 1-{max_value})"
                    )
                }), 400

            normalized_responses[key] = numeric_value

        user = db.users.find_one(
            {"userId": user_id},
            {
                "_id": 0,
                "variant": 1,
                "cognitiveStyle": 1,
                "initialCognitiveStyle": 1,
                "activeStyle": 1,
                "language": 1,
                "learningGoal": 1,
                "ageGroup": 1,
                "aiUsage": 1
            }
        )

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        existing_survey = db.surveys.find_one({
            "userId": user_id
        })

        if existing_survey:
            return jsonify({
                "error": "Survey already submitted",
                "message": "Research already completed."
            }), 409

        now = utc_now()

        survey_document = {
            "userId": user_id,
            "variant": user.get("variant"),
            "cognitiveStyle": user.get("cognitiveStyle"),
            "initialCognitiveStyle": user.get(
                "initialCognitiveStyle"
            ),
            "activeStyle": user.get("activeStyle"),
            "learningGoal": user.get("learningGoal"),
            "ageGroup": user.get("ageGroup"),
            "aiUsage": user.get("aiUsage"),
            "language": user.get("language", "sl"),
            "responses": normalized_responses,
            "timestamp": now
        }

        db.surveys.insert_one(survey_document)

        db.users.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "surveyCompleted": True,
                    "surveyCompletedAt": now
                }
            }
        )

        return jsonify({
            "status": "saved"
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/submit-survey: {e}",
            exc_info=True
        )
        return jsonify({
            "error": "Internal server error"
        }), 500
    
@app.route('/api/enable-recommendations', methods=['POST', 'OPTIONS'])
def enable_recommendations():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        result = db.users.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "recommendationsEnabled": True,
                    "recommendationsReEnabledAt": utc_now()
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({
                "error": "User not found"
            }), 404

        return jsonify({
            "status": "recommendations_enabled",
            "recommendationsEnabled": True
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/enable-recommendations: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500
    
@app.route('/api/check-style-switch-suggestion', methods=['POST', 'OPTIONS'])
def check_style_switch_suggestion():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        active_style = data.get("activeStyle")

        if active_style not in ["visual", "verbal"]:
            return jsonify({
                "shouldSuggest": False
            }), 200

        user = db.users.find_one(
            {"userId": user_id},
            {
                "_id": 0,
                "style_switch_used": 1,
                "style_switch_declined": 1,
                "styleSetAt": 1
            }
        )

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        if user.get("style_switch_used"):
            return jsonify({
                "shouldSuggest": False
            }), 200

        if user.get("style_switch_declined"):
            return jsonify({
                "shouldSuggest": False
            }), 200

        style_changed_at = user.get("styleSetAt")

        session_filter = {
            "userId": user_id
        }

        if style_changed_at:
            session_filter["session_updated_at"] = {
                "$gt": style_changed_at
            }

        if active_style == "verbal":
            visual_lessons = db.learning_sessions.distinct(
                "lesson_id",
                {
                    **session_filter,
                    "opened_visualization": True
                }
            )

            if len(visual_lessons) >= 2:
                return jsonify({
                    "shouldSuggest": True,
                    "suggestedStyle": "visual",
                    "trigger": "opened_visualization",
                    "count": len(visual_lessons)
                }), 200

        if active_style == "visual":
            summary_lessons = db.learning_sessions.distinct(
                "lesson_id",
                {
                    **session_filter,
                    "opened_summary": True
                }
            )

            if len(summary_lessons) >= 2:
                return jsonify({
                    "shouldSuggest": True,
                    "suggestedStyle": "verbal",
                    "trigger": "opened_summary",
                    "count": len(summary_lessons)
                }), 200

        return jsonify({
            "shouldSuggest": False
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/check-style-switch-suggestion: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route('/api/decline-style-switch', methods=['POST', 'OPTIONS'])
def decline_style_switch():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)
        if error_response:
            return error_response

        result = db.users.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "style_switch_declined": True,
                    "style_switch_declined_at": utc_now()
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({
                "error": "User not found"
            }), 404

        return jsonify({
            "status": "style_switch_declined"
        }), 200

    except Exception as e:
        logger.error(
            f"Error in /api/decline-style-switch: {e}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

@app.route(
    '/api/delete-user-data',
    methods=['DELETE', 'OPTIONS']
)
def delete_user_data():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(silent=True) or {}

        user_id, error_response = require_user_id(data)

        if error_response:
            return error_response

        user = db.users.find_one({
            "userId": user_id
        })

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        deleted_learning_sessions = (
            db.learning_sessions.delete_many({
                "userId": user_id
            }).deleted_count
        )

        deleted_quiz_results = (
            db.quiz_results.delete_many({
                "userId": user_id
            }).deleted_count
        )

        deleted_surveys = (
            db.surveys.delete_many({
                "userId": user_id
            }).deleted_count
        )

        updated_lessons = db.lessons.update_many(
            {
                "generatedByUserId": user_id
            },
            {
                "$unset": {
                    "generatedByUserId": ""
                }
            }
        ).modified_count

        deleted_users = db.users.delete_one({
            "userId": user_id
        }).deleted_count

        logger.info(
            "Research participation withdrawn for "
            f"users={deleted_users}, "
            f"learning_sessions="
            f"{deleted_learning_sessions}, "
            f"quiz_results={deleted_quiz_results}, "
            f"surveys={deleted_surveys}, "
            f"anonymized_lessons={updated_lessons}"
        )

        return jsonify({
            "status": "deleted",
            "deleted": {
                "users": deleted_users,
                "learningSessions":
                    deleted_learning_sessions,
                "quizResults":
                    deleted_quiz_results,
                "surveys": deleted_surveys,
                "anonymizedLessons":
                    updated_lessons
            }
        }), 200

    except Exception as error:
        logger.error(
            "Deleting user data failed: "
            f"{error}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)