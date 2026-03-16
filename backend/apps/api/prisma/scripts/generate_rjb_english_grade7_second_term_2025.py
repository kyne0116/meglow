from __future__ import annotations

import json
import os
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[4]
OUTPUT_PATH = ROOT / "apps" / "api" / "prisma" / "seed-data" / "textbooks" / "english-rjb-grade7-second-term-2025.json"
DEFAULT_PDF = Path.home() / "Desktop" / "【人教版】七年级下册(2025春版)英语电子课本.pdf"

UNIT_DEFINITIONS = [
    {"number": 1, "title": "Animal Friends", "bigQuestion": "Why are animals important?", "docStart": 10, "docEnd": 17},
    {"number": 2, "title": "No Rules, No Order", "bigQuestion": "Why do we need rules?", "docStart": 18, "docEnd": 25},
    {"number": 3, "title": "Keep Fit", "bigQuestion": "How do we keep fit?", "docStart": 26, "docEnd": 33},
    {"number": 4, "title": "Eat Well", "bigQuestion": "How do we make healthy eating choices?", "docStart": 34, "docEnd": 41},
    {"number": 5, "title": "Here and Now", "bigQuestion": "What brings people together?", "docStart": 42, "docEnd": 49},
    {"number": 6, "title": "Rain or Shine", "bigQuestion": "How do we feel about the weather?", "docStart": 50, "docEnd": 57},
    {"number": 7, "title": "A Day to Remember", "bigQuestion": "What makes a day special?", "docStart": 58, "docEnd": 65},
    {"number": 8, "title": "Once upon a Time", "bigQuestion": "What can stories teach us?", "docStart": 66, "docEnd": 73},
]

POS_PATTERN = re.compile(
    r"(modal v\.|n\. ?& v\.|v\. ?& n\.|adj\. ?& adv\.|adv\. ?& adj\.|n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.)"
)
TOPIC_PATTERN = re.compile(r"^[一二三四五六七八九十]+、")
SUBTOPIC_PATTERN = re.compile(r"^\d+\.\s*")


def normalize_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = text.replace("\u2003", " ")
    text = text.replace("\u2002", " ")
    text = text.replace("\u2009", " ")
    text = text.replace("\u200b", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def book_page_number(doc_page: int) -> int | None:
    if 10 <= doc_page <= 126:
        return doc_page - 9
    return None


def read_pages(doc: fitz.Document, doc_pages: list[int]) -> dict:
    page_texts = []
    combined = []
    for doc_page in doc_pages:
        text = normalize_text(doc.load_page(doc_page - 1).get_text("text"))
        page_texts.append({"docPage": doc_page, "bookPage": book_page_number(doc_page), "text": text})
        combined.append(text)
    return {
        "docPages": doc_pages,
        "bookPages": [page["bookPage"] for page in page_texts if page["bookPage"] is not None],
        "pageTexts": page_texts,
        "text": "\n\n".join(text for text in combined if text),
    }


def split_appendix_by_unit(doc: fitz.Document, doc_pages: list[int]) -> dict[int, dict]:
    unit_chunks: dict[int, list[dict]] = {}
    current_unit: int | None = None
    marker_pattern = re.compile(r"Unit\s+(\d+)")

    for doc_page in doc_pages:
        text = normalize_text(doc.load_page(doc_page - 1).get_text("text"))
        matches = list(marker_pattern.finditer(text))

        if not matches:
            if current_unit is not None and text:
                unit_chunks.setdefault(current_unit, []).append(
                    {"docPage": doc_page, "bookPage": book_page_number(doc_page), "text": text}
                )
            continue

        prefix = text[: matches[0].start()].strip()
        if prefix and current_unit is not None:
            unit_chunks.setdefault(current_unit, []).append(
                {"docPage": doc_page, "bookPage": book_page_number(doc_page), "text": prefix}
            )

        for index, match in enumerate(matches):
            current_unit = int(match.group(1))
            start = match.start()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            segment = text[start:end].strip()
            if not segment:
                continue
            unit_chunks.setdefault(current_unit, []).append(
                {"docPage": doc_page, "bookPage": book_page_number(doc_page), "text": segment}
            )

    result: dict[int, dict] = {}
    for unit_number, chunks in unit_chunks.items():
        result[unit_number] = {
            "docPages": sorted({chunk["docPage"] for chunk in chunks}),
            "bookPages": [chunk["bookPage"] for chunk in chunks if chunk["bookPage"] is not None],
            "pageTexts": chunks,
            "text": "\n\n".join(chunk["text"] for chunk in chunks if chunk["text"]),
        }
    return result


def parse_vocabulary_entries(text: str) -> list[dict]:
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped in {"Vocabulary in Each Unit", "Vocabulary from Primary School"}:
            continue
        if re.fullmatch(r"\d+", stripped):
            continue
        if stripped.startswith("注："):
            continue
        if re.fullmatch(r"Unit\s+\d+", stripped):
            continue
        cleaned_lines.append(stripped)

    cleaned = "\n".join(cleaned_lines)
    matches = list(re.finditer(r"(.+?)\s*p\.(\d+)", cleaned, flags=re.S))
    entries = []
    for match in matches:
        body = re.sub(r"\s+", " ", match.group(1)).strip(" -\t\r\n")
        page_ref = int(match.group(2))
        if not body:
            continue
        entries.append(parse_vocabulary_entry(body, page_ref))

    return entries


def parse_vocabulary_entry(body: str, page_ref: int) -> dict:
    phonetic = None
    head = body
    tail = ""

    phonetic_match = re.search(r"/[^/]+/", body)
    if phonetic_match:
        head = body[: phonetic_match.start()].strip()
        phonetic = phonetic_match.group(0)
        tail = body[phonetic_match.end() :].strip()
    else:
        pos_match = POS_PATTERN.search(body)
        zh_match = re.search(r"[\u4e00-\u9fff（]", body)
        split_index = None
        if pos_match:
            split_index = pos_match.start()
        elif zh_match:
            split_index = zh_match.start()

        if split_index is not None:
            head = body[:split_index].strip()
            tail = body[split_index:].strip()

    senses = []
    if tail:
        pos_matches = list(POS_PATTERN.finditer(tail))
        if pos_matches:
            for index, pos_match in enumerate(pos_matches):
                end = pos_matches[index + 1].start() if index + 1 < len(pos_matches) else len(tail)
                meaning = tail[pos_match.end() : end].strip(" ;")
                senses.append(
                    {
                        "partOfSpeech": pos_match.group(1).strip(),
                        "meaningZh": meaning,
                    }
                )

    meaning_zh = "；".join(
        sense["meaningZh"] for sense in senses if sense["meaningZh"]
    ) if senses else tail

    return {
        "term": head,
        "phonetic": phonetic,
        "meaningZh": meaning_zh or None,
        "senses": senses,
        "bookPage": page_ref,
        "isPhrase": " " in head or "…" in head,
        "raw": body,
    }


def parse_listening_scripts(text: str) -> list[dict]:
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.replace("\u200b", "").replace("\u2006", " ").strip()
        if not line:
            continue
        if line == "Listening Scripts":
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if re.match(r"^Unit\s+\d+", line):
            continue
        lines.append(line)

    sections: list[dict] = []
    current_section: dict | None = None
    current_block: dict | None = None
    last_segment: dict | None = None

    speaker_pattern = re.compile(r"^([A-Z][A-Za-z .'\-]+):\s*(.*)$")

    def ensure_section(label: str) -> dict:
        nonlocal current_section, current_block, last_segment
        current_section = {
            "label": label,
            "blocks": [],
        }
        sections.append(current_section)
        current_block = None
        last_segment = None
        return current_section

    def ensure_block(label: str | None) -> dict:
        nonlocal current_block, last_segment
        if current_section is None:
            ensure_section("Unspecified")
        current_block = {
            "label": label,
            "segments": [],
        }
        current_section["blocks"].append(current_block)
        last_segment = None
        return current_block

    for line in lines:
        if line.startswith("Section "):
            ensure_section(line)
            continue

        if re.match(r"^(Part|Conversation)\s+\d+", line):
            ensure_block(line)
            continue

        speaker_match = speaker_pattern.match(line)
        if speaker_match:
            if current_block is None:
                ensure_block(None)
            segment = {
                "type": "speech",
                "speaker": speaker_match.group(1).strip(),
                "text": speaker_match.group(2).strip(),
            }
            current_block["segments"].append(segment)
            last_segment = segment
            continue

        if current_block is None:
            ensure_block(None)

        if last_segment and last_segment["type"] == "speech":
            last_segment["text"] = f"{last_segment['text']} {line}".strip()
        else:
            segment = {
                "type": "narration",
                "text": line,
            }
            current_block["segments"].append(segment)
            last_segment = segment

    return sections


def parse_appendix_outline(text: str) -> list[dict]:
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.replace("\u200b", "").strip()
        if not line:
            continue
        if line in {"Pronunciation", "Grammar"}:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if line.startswith("表"):
            continue
        lines.append(line)

    topics: list[dict] = []
    current_topic: dict | None = None
    current_subtopic: dict | None = None

    for line in lines:
        if TOPIC_PATTERN.match(line):
            current_topic = {
                "title": line,
                "subtopics": [],
                "content": [],
            }
            topics.append(current_topic)
            current_subtopic = None
            continue

        if SUBTOPIC_PATTERN.match(line):
            if current_topic is None:
                current_topic = {
                    "title": "未分组",
                    "subtopics": [],
                    "content": [],
                }
                topics.append(current_topic)
            current_subtopic = {
                "title": line,
                "content": [],
            }
            current_topic["subtopics"].append(current_subtopic)
            continue

        if current_subtopic is not None:
            current_subtopic["content"].append(line)
        elif current_topic is not None:
            current_topic["content"].append(line)
        else:
            current_topic = {
                "title": "未分组",
                "subtopics": [],
                "content": [line],
            }
            topics.append(current_topic)

    return topics


def extract_numbered_prompts(text: str) -> list[dict]:
    prompts = []
    lines = text.splitlines()
    index = 0

    def is_question_candidate(prompt_text: str) -> bool:
        if re.search(r"\b[A-E]\.\s", prompt_text):
            return False
        if prompt_text.endswith("?"):
            return True
        return len(prompt_text.split()) >= 4 and prompt_text[:1].isupper()

    def is_prompt_continuation(line: str) -> bool:
        if not line:
            return False
        if re.match(r"^\d+\.\s+", line):
            return False
        if re.match(r"^[A-E]\.\s+", line):
            return False
        if line in {"Reading Plus", "Listening Scripts", "Project"}:
            return False
        if re.match(r"^Unit\s+\d+\b", line):
            return False
        if re.match(r"^(Read|Think|Imagine|Match|Scene)\b", line):
            return False
        return len(line.split()) >= 2

    while index < len(lines):
        stripped = lines[index].strip()
        match = re.match(r"^(\d+)\.\s*(.+)$", stripped)
        if not match:
            index += 1
            continue

        prompt_number = int(match.group(1))
        prompt_parts = [match.group(2).strip()]
        index += 1

        while index < len(lines):
            next_line = lines[index].strip()
            if prompt_parts[-1].endswith("?"):
                break
            if not next_line:
                index += 1
                continue
            if not is_prompt_continuation(next_line):
                break
            prompt_parts.append(next_line)
            index += 1

        prompt_text = " ".join(prompt_parts).strip()
        if not is_question_candidate(prompt_text):
            continue

        prompts.append(
            {
                "number": prompt_number,
                "text": prompt_text,
            }
        )
    return prompts


def extract_bullet_prompts(text: str) -> list[str]:
    prompts = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("●"):
            prompts.append(stripped.lstrip("●").strip())
    return prompts


def build_dataset(doc: fitz.Document, pdf_name: str) -> dict:
    nodes: list[dict] = [
        {
            "code": "VOL_ROOT",
            "parentCode": None,
            "nodeType": "VOLUME",
            "title": "七年级下册",
            "description": "人教版英语七年级下册（2025春版）教材根节点",
            "sortOrder": 1,
            "isLeaf": False,
            "metadata": {"sourcePdf": pdf_name, "curriculumYear": 2025, "season": "SPRING"},
        },
        {
            "code": "CONTENTS",
            "parentCode": "VOL_ROOT",
            "nodeType": "SPECIAL",
            "title": "目录",
            "description": "教材目录与单元导览",
            "sortOrder": 5,
            "isLeaf": True,
        },
        {
            "code": "PRONUNCIATION_APPENDIX",
            "parentCode": "VOL_ROOT",
            "nodeType": "SPECIAL",
            "title": "语音附录",
            "description": "教材附录中的语音规则与朗读知识",
            "sortOrder": 900,
            "isLeaf": True,
        },
        {
            "code": "GRAMMAR_APPENDIX",
            "parentCode": "VOL_ROOT",
            "nodeType": "SPECIAL",
            "title": "语法附录",
            "description": "教材附录中的语法规则总结",
            "sortOrder": 910,
            "isLeaf": True,
        },
    ]
    content_items: list[dict] = []

    contents = read_pages(doc, [5, 6, 7, 8])
    content_items.append(
        {
            "nodeCode": "CONTENTS",
            "canonicalKey": "english-rjb-g7-st-2025-contents",
            "itemType": "TEXT",
            "title": "七年级下册目录",
            "summary": "教材目录、单元主题、听说读写任务与语法索引",
            "difficultyLevel": 1,
            "k12Stage": "JUNIOR_HIGH",
            "sortOrder": 1,
            "isPrimary": True,
            "payload": {"kind": "contents", "source": contents},
        }
    )

    pronunciation = read_pages(doc, [92, 93, 94, 95, 96])
    content_items.append(
        {
            "nodeCode": "PRONUNCIATION_APPENDIX",
            "canonicalKey": "english-rjb-g7-st-2025-pronunciation-appendix",
            "itemType": "CONCEPT",
            "title": "语音附录",
            "summary": "元音、辅音、弱读、同化与节奏说明",
            "difficultyLevel": 3,
            "k12Stage": "JUNIOR_HIGH",
            "sortOrder": 1,
            "isPrimary": True,
            "payload": {
                "kind": "pronunciation_appendix",
                "topicCount": len(parse_appendix_outline(pronunciation["text"])),
                "topics": parse_appendix_outline(pronunciation["text"]),
                "source": pronunciation,
            },
        }
    )

    grammar = read_pages(doc, [97, 98, 99, 100, 101, 102, 103, 104, 105])
    content_items.append(
        {
            "nodeCode": "GRAMMAR_APPENDIX",
            "canonicalKey": "english-rjb-g7-st-2025-grammar-appendix",
            "itemType": "CONCEPT",
            "title": "语法附录",
            "summary": "名词、形容词、副词、情态动词、物主代词、时态与句型总结",
            "difficultyLevel": 3,
            "k12Stage": "JUNIOR_HIGH",
            "sortOrder": 1,
            "isPrimary": True,
            "payload": {
                "kind": "grammar_appendix",
                "topicCount": len(parse_appendix_outline(grammar["text"])),
                "topics": parse_appendix_outline(grammar["text"]),
                "source": grammar,
            },
        }
    )

    reading_plus_by_unit = split_appendix_by_unit(doc, list(range(74, 83)))
    listening_by_unit = split_appendix_by_unit(doc, list(range(83, 92)))
    vocabulary_by_unit = split_appendix_by_unit(doc, list(range(106, 115)))
    primary_vocabulary_by_unit = split_appendix_by_unit(doc, list(range(124, 127)))

    for unit in UNIT_DEFINITIONS:
        unit_code = f"UNIT_{unit['number']}"
        section_a_code = f"{unit_code}_SECTION_A"
        section_b_code = f"{unit_code}_SECTION_B"
        project_code = f"{unit_code}_PROJECT"
        reading_code = f"{unit_code}_READING_PLUS"
        listening_code = f"{unit_code}_LISTENING_SCRIPTS"
        vocabulary_code = f"{unit_code}_VOCABULARY"
        primary_vocabulary_code = f"{unit_code}_PRIMARY_VOCABULARY"

        nodes.extend(
            [
                {
                    "code": unit_code,
                    "parentCode": "VOL_ROOT",
                    "nodeType": "UNIT",
                    "title": f"Unit {unit['number']} {unit['title']}",
                    "description": unit["bigQuestion"],
                    "sortOrder": unit["number"] * 10,
                    "isLeaf": False,
                    "metadata": {
                        "bigQuestion": unit["bigQuestion"],
                        "docPageStart": unit["docStart"],
                        "docPageEnd": unit["docEnd"],
                        "bookPageStart": book_page_number(unit["docStart"]),
                        "bookPageEnd": book_page_number(unit["docEnd"]),
                    },
                },
                {
                    "code": section_a_code,
                    "parentCode": unit_code,
                    "nodeType": "SECTION",
                    "title": "Section A",
                    "description": "单元 Section A 主体内容",
                    "sortOrder": 1,
                    "isLeaf": True,
                },
                {
                    "code": section_b_code,
                    "parentCode": unit_code,
                    "nodeType": "SECTION",
                    "title": "Section B",
                    "description": "单元 Section B 阅读与写作内容",
                    "sortOrder": 2,
                    "isLeaf": True,
                },
                {
                    "code": project_code,
                    "parentCode": unit_code,
                    "nodeType": "SPECIAL",
                    "title": "Project",
                    "description": "单元项目与反思",
                    "sortOrder": 3,
                    "isLeaf": True,
                },
                {
                    "code": reading_code,
                    "parentCode": unit_code,
                    "nodeType": "SPECIAL",
                    "title": "Reading Plus",
                    "description": "单元拓展阅读",
                    "sortOrder": 4,
                    "isLeaf": True,
                },
                {
                    "code": listening_code,
                    "parentCode": unit_code,
                    "nodeType": "SPECIAL",
                    "title": "Listening Scripts",
                    "description": "单元听力原文",
                    "sortOrder": 5,
                    "isLeaf": True,
                },
                {
                    "code": vocabulary_code,
                    "parentCode": unit_code,
                    "nodeType": "SPECIAL",
                    "title": "Vocabulary in Each Unit",
                    "description": "单元重点词汇",
                    "sortOrder": 6,
                    "isLeaf": True,
                },
            ]
        )

        base_pages = list(range(unit["docStart"], unit["docEnd"] + 1))
        overview = read_pages(doc, [base_pages[0]])
        section_a = read_pages(doc, base_pages[1:5])
        section_b = read_pages(doc, base_pages[5:7])
        project = read_pages(doc, [base_pages[7]])

        content_items.extend(
            [
                {
                    "nodeCode": unit_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-overview",
                    "itemType": "TEXT",
                    "title": f"Unit {unit['number']} Overview",
                    "summary": f"{unit['title']} 单元导入与学习目标",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {
                        "kind": "unit_overview",
                        "unitNumber": unit["number"],
                        "unitTitle": unit["title"],
                        "bigQuestion": unit["bigQuestion"],
                        "source": overview,
                    },
                },
                {
                    "nodeCode": section_a_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-section-a",
                    "itemType": "TEXT",
                    "title": f"Unit {unit['number']} Section A",
                    "summary": f"{unit['title']} Section A 听说与语法活动",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {"kind": "section_a", "unitNumber": unit["number"], "unitTitle": unit["title"], "source": section_a},
                },
                {
                    "nodeCode": section_b_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-section-b",
                    "itemType": "TEXT",
                    "title": f"Unit {unit['number']} Section B",
                    "summary": f"{unit['title']} Section B 阅读与写作活动",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {"kind": "section_b", "unitNumber": unit["number"], "unitTitle": unit["title"], "source": section_b},
                },
                {
                    "nodeCode": project_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-project",
                    "itemType": "EXERCISE",
                    "title": f"Unit {unit['number']} Project",
                    "summary": f"{unit['title']} 项目任务与反思",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {"kind": "project", "unitNumber": unit["number"], "unitTitle": unit["title"], "source": project},
                },
            ]
        )

        reading_payload = reading_plus_by_unit.get(unit["number"])
        if reading_payload:
            reading_questions = extract_numbered_prompts(reading_payload["text"])
            reading_bullets = extract_bullet_prompts(reading_payload["text"])
            content_items.append(
                {
                    "nodeCode": reading_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-reading-plus",
                    "itemType": "TEXT",
                    "title": f"Unit {unit['number']} Reading Plus",
                    "summary": f"{unit['title']} 拓展阅读",
                    "difficultyLevel": 3,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {
                        "kind": "reading_plus",
                        "unitNumber": unit["number"],
                        "unitTitle": unit["title"],
                        "questionCount": len(reading_questions),
                        "questions": reading_questions,
                        "bulletPrompts": reading_bullets,
                        "source": reading_payload,
                    },
                }
            )

        listening_payload = listening_by_unit.get(unit["number"])
        if listening_payload:
            listening_sections = parse_listening_scripts(listening_payload["text"])
            content_items.append(
                {
                    "nodeCode": listening_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-listening-scripts",
                    "itemType": "TEXT",
                    "title": f"Unit {unit['number']} Listening Scripts",
                    "summary": f"{unit['title']} 听力原文",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {
                        "kind": "listening_scripts",
                        "unitNumber": unit["number"],
                        "unitTitle": unit["title"],
                        "sectionCount": len(listening_sections),
                        "sections": listening_sections,
                        "source": listening_payload,
                    },
                }
            )

        vocabulary_payload = vocabulary_by_unit.get(unit["number"])
        if vocabulary_payload:
            vocabulary_entries = parse_vocabulary_entries(vocabulary_payload["text"])
            content_items.append(
                {
                    "nodeCode": vocabulary_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-vocabulary",
                    "itemType": "WORD_GROUP",
                    "title": f"Unit {unit['number']} Vocabulary in Each Unit",
                    "summary": f"{unit['title']} 单元重点词汇",
                    "difficultyLevel": 2,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {
                        "kind": "unit_vocabulary",
                        "unitNumber": unit["number"],
                        "unitTitle": unit["title"],
                        "entryCount": len(vocabulary_entries),
                        "entries": vocabulary_entries,
                        "source": vocabulary_payload,
                    },
                }
            )

        primary_payload = primary_vocabulary_by_unit.get(unit["number"])
        if primary_payload:
            primary_entries = parse_vocabulary_entries(primary_payload["text"])
            nodes.append(
                {
                    "code": primary_vocabulary_code,
                    "parentCode": unit_code,
                    "nodeType": "SPECIAL",
                    "title": "Vocabulary from Primary School",
                    "description": "与本单元相关的小学词汇回顾",
                    "sortOrder": 7,
                    "isLeaf": True,
                }
            )
            content_items.append(
                {
                    "nodeCode": primary_vocabulary_code,
                    "canonicalKey": f"english-rjb-g7-st-2025-unit-{unit['number']}-primary-vocabulary",
                    "itemType": "WORD_GROUP",
                    "title": f"Unit {unit['number']} Vocabulary from Primary School",
                    "summary": f"{unit['title']} 相关小学词汇回顾",
                    "difficultyLevel": 1,
                    "k12Stage": "JUNIOR_HIGH",
                    "sortOrder": 1,
                    "isPrimary": True,
                    "payload": {
                        "kind": "primary_vocabulary_review",
                        "unitNumber": unit["number"],
                        "unitTitle": unit["title"],
                        "entryCount": len(primary_entries),
                        "entries": primary_entries,
                        "source": primary_payload,
                    },
                }
            )

    return {
        "metadata": {"sourcePdf": pdf_name, "generator": "generate_rjb_english_grade7_second_term_2025.py"},
        "publisher": {"code": "RJB", "name": "人民教育出版社", "shortName": "人教版", "region": "CN"},
        "edition": {
            "subjectCode": "ENGLISH",
            "publisherCode": "RJB",
            "code": "ENGLISH_RJB_2025",
            "displayName": "英语 人教版 2025春版",
            "curriculumYear": 2025,
            "regionScope": "全国",
        },
        "volume": {
            "editionCode": "ENGLISH_RJB_2025",
            "grade": 7,
            "semester": "SECOND_TERM",
            "volumeLabel": "七年级下册",
            "k12Stage": "JUNIOR_HIGH",
            "sortOrder": 2,
            "version": 1,
        },
        "nodes": nodes,
        "contentItems": content_items,
    }


def main() -> None:
    pdf_path = Path(os.environ.get("SOURCE_PDF", str(DEFAULT_PDF)))
    if not pdf_path.exists():
        raise FileNotFoundError(f"source pdf not found: {pdf_path}")

    doc = fitz.open(str(pdf_path))
    dataset = build_dataset(doc, pdf_path.name)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"generated {OUTPUT_PATH}")
    print(f"nodes={len(dataset['nodes'])} contentItems={len(dataset['contentItems'])}")


if __name__ == "__main__":
    main()
