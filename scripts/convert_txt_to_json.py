from __future__ import annotations

import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OBJECTIVE_DIR = ROOT / "backup"
SUBJECTIVE_DIR = ROOT / "src" / "Subjective-Question"
DATA_DIR = ROOT / "data"


def read_lines(path: Path) -> list[str]:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        return path.read_text(encoding="gbk", errors="replace").splitlines()


def trim_empty_edges(lines: list[str]) -> list[str]:
    start = 0
    end = len(lines) - 1
    while start <= end and lines[start].strip() == "":
        start += 1
    while end >= start and lines[end].strip() == "":
        end -= 1
    return lines[start : end + 1]


def parse_objective_file(path: Path) -> list[dict]:
    lines = read_lines(path)
    questions: list[dict] = []
    index = 0

    while index < len(lines):
        marker = lines[index].strip()
        if marker in {"#JUDGE", "#CHOICE"}:
            qtype = "judge" if marker == "#JUDGE" else "single"
            index += 1
            question_lines = []
            while index < len(lines) and lines[index].strip() != "#OPTIONS":
                question_lines.append(lines[index])
                index += 1
            index += 1
            options = []
            while index < len(lines) and lines[index].strip() != "#CORRECT":
                option = lines[index]
                if option.strip():
                    options.append(option)
                index += 1
            index += 1
            answer_line = lines[index].strip() if index < len(lines) else ""
            answer_index = int(answer_line.split()[0]) - 1 if answer_line else 0
            while index < len(lines) and lines[index].strip() != "#END":
                index += 1
            index += 1
            questions.append(
                {
                    "id": str(uuid.uuid4()),
                    "qtype": qtype,
                    "question": "\n".join(trim_empty_edges(question_lines)),
                    "options": options,
                    "answer_index": max(answer_index, 0),
                    "source": path.name,
                }
            )
        else:
            index += 1
    return questions


def parse_subjective_file(path: Path) -> list[dict]:
    lines = read_lines(path)
    questions: list[dict] = []
    index = 0

    while index < len(lines):
        marker = lines[index].strip()
        if marker == "#SUBJECTIVE":
            index += 1
            question_lines = []
            while index < len(lines) and lines[index].strip() not in {
                "#ANSWER",
                "#USER_ANSWER",
                "#CORRECT_ANSWER",
            }:
                question_lines.append(lines[index])
                index += 1
            answer_marker = lines[index].strip() if index < len(lines) else ""
            index += 1
            answer_lines = []
            if answer_marker == "#USER_ANSWER":
                while index < len(lines) and lines[index].strip() != "#CORRECT_ANSWER":
                    index += 1
                if index < len(lines) and lines[index].strip() == "#CORRECT_ANSWER":
                    index += 1
            while index < len(lines) and lines[index].strip() != "#END":
                answer_lines.append(lines[index])
                index += 1
            index += 1
            questions.append(
                {
                    "id": str(uuid.uuid4()),
                    "question": "\n".join(trim_empty_edges(question_lines)),
                    "answer": "\n".join(trim_empty_edges(answer_lines)),
                    "source": path.name,
                }
            )
        else:
            index += 1
    return questions


def main() -> None:
    objective_questions: list[dict] = []
    for path in OBJECTIVE_DIR.glob("*.txt"):
        objective_questions.extend(parse_objective_file(path))

    subjective_questions: list[dict] = []
    for path in SUBJECTIVE_DIR.glob("*.txt"):
        subjective_questions.extend(parse_subjective_file(path))

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "objective_questions.json").write_text(
        json.dumps(objective_questions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (DATA_DIR / "subjective_questions.json").write_text(
        json.dumps(subjective_questions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
