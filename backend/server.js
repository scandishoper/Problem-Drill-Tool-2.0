const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8000;

const DATA_DIR = path.join(__dirname, "..", "data");
const OBJECTIVE_PATH = path.join(DATA_DIR, "objective_questions.json");
const SUBJECTIVE_PATH = path.join(DATA_DIR, "subjective_questions.json");

app.use(cors());
app.use(express.json());

const readJsonFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, payload) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
};

const trimEmptyEdges = (lines) => {
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && lines[start].trim() === "") {
    start += 1;
  }
  while (end >= start && lines[end].trim() === "") {
    end -= 1;
  }
  return lines.slice(start, end + 1);
};

const parseObjectiveFromText = (content, source) => {
  const lines = content.split(/\r?\n/);
  const questions = [];
  let index = 0;

  while (index < lines.length) {
    const marker = lines[index].trim();
    if (marker === "#JUDGE" || marker === "#CHOICE") {
      const qtype = marker === "#JUDGE" ? "judge" : "single";
      index += 1;
      const questionLines = [];
      while (index < lines.length && lines[index].trim() !== "#OPTIONS") {
        questionLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      const options = [];
      while (index < lines.length && lines[index].trim() !== "#CORRECT") {
        const option = lines[index];
        if (option.trim()) options.push(option);
        index += 1;
      }
      index += 1;
      const answerLine = index < lines.length ? lines[index].trim() : "";
      let answerIndex = 0;
      if (answerLine) {
        const parsed = Number.parseInt(answerLine.split(/\s+/)[0], 10);
        if (!Number.isNaN(parsed)) {
          answerIndex = parsed - 1;
        }
      }
      while (index < lines.length && lines[index].trim() !== "#END") {
        index += 1;
      }
      index += 1;
      questions.push({
        id: randomUUID(),
        qtype,
        question: trimEmptyEdges(questionLines).join("\n"),
        options,
        answer_index: Math.max(answerIndex, 0),
        source,
      });
      continue;
    }
    index += 1;
  }

  return questions;
};

const parseSubjectiveFromText = (content, source) => {
  const lines = content.split(/\r?\n/);
  const questions = [];
  let index = 0;

  while (index < lines.length) {
    const marker = lines[index].trim();
    if (marker === "#SUBJECTIVE") {
      index += 1;
      const questionLines = [];
      while (
        index < lines.length &&
        !["#ANSWER", "#USER_ANSWER", "#CORRECT_ANSWER"].includes(lines[index].trim())
      ) {
        questionLines.push(lines[index]);
        index += 1;
      }
      const answerMarker = index < lines.length ? lines[index].trim() : "";
      index += 1;
      if (answerMarker === "#USER_ANSWER") {
        while (index < lines.length && lines[index].trim() !== "#CORRECT_ANSWER") {
          index += 1;
        }
        if (index < lines.length && lines[index].trim() === "#CORRECT_ANSWER") {
          index += 1;
        }
      }
      const answerLines = [];
      while (index < lines.length && lines[index].trim() !== "#END") {
        answerLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      questions.push({
        id: randomUUID(),
        question: trimEmptyEdges(questionLines).join("\n"),
        answer: trimEmptyEdges(answerLines).join("\n"),
        source,
      });
      continue;
    }
    index += 1;
  }

  return questions;
};

const takeRandomSample = (items, count) => {
  const result = [];
  const pool = [...items];
  const limit = Math.min(count, pool.length);

  for (let i = 0; i < limit; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
};

const normalizeCount = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const validateObjectivePayload = ({ question, options, answer_index: answerIndex, qtype }) => {
  if (typeof question !== "string" || question.trim().length === 0) {
    return "question 不能为空";
  }
  if (!Array.isArray(options) || options.length < 2 || options.some((item) => typeof item !== "string")) {
    return "options 至少包含两个选项";
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
    return "answer_index 超出范围";
  }
  if (qtype && !["single", "judge"].includes(qtype)) {
    return "qtype 只能是 single 或 judge";
  }
  return null;
};

const validateSubjectivePayload = ({ question, answer }) => {
  if (typeof question !== "string" || question.trim().length === 0) {
    return "question 不能为空";
  }
  if (typeof answer !== "string" || answer.trim().length === 0) {
    return "answer 不能为空";
  }
  return null;
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/questions/objective", async (_req, res, next) => {
  try {
    const questions = await readJsonFile(OBJECTIVE_PATH);
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

app.get("/api/questions/objective/random", async (req, res, next) => {
  try {
    const count = normalizeCount(req.query.count);
    const qtype = req.query.qtype ? String(req.query.qtype) : null;
    let questions = await readJsonFile(OBJECTIVE_PATH);

    if (qtype) {
      questions = questions.filter((item) => item.qtype === qtype);
    }

    if (questions.length === 0) {
      res.status(404).json({ detail: "No objective questions found." });
      return;
    }

    res.json(takeRandomSample(questions, count));
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions/objective", async (req, res, next) => {
  try {
    const payload = req.body;
    const validationError = validateObjectivePayload(payload);

    if (validationError) {
      res.status(400).json({ detail: validationError });
      return;
    }

    const question = {
      id: randomUUID(),
      question: payload.question.trim(),
      options: payload.options.map((option) => option.trim()),
      answer_index: payload.answer_index,
      qtype: payload.qtype || "single",
      source: payload.source || null,
    };

    const questions = await readJsonFile(OBJECTIVE_PATH);
    questions.push(question);
    await writeJsonFile(OBJECTIVE_PATH, questions);

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
});

app.get("/api/questions/subjective", async (_req, res, next) => {
  try {
    const questions = await readJsonFile(SUBJECTIVE_PATH);
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

app.get("/api/questions/subjective/random", async (req, res, next) => {
  try {
    const count = normalizeCount(req.query.count);
    const questions = await readJsonFile(SUBJECTIVE_PATH);

    if (questions.length === 0) {
      res.status(404).json({ detail: "No subjective questions found." });
      return;
    }

    res.json(takeRandomSample(questions, count));
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions/subjective", async (req, res, next) => {
  try {
    const payload = req.body;
    const validationError = validateSubjectivePayload(payload);

    if (validationError) {
      res.status(400).json({ detail: validationError });
      return;
    }

    const question = {
      id: randomUUID(),
      question: payload.question.trim(),
      answer: payload.answer.trim(),
      source: payload.source || null,
    };

    const questions = await readJsonFile(SUBJECTIVE_PATH);
    questions.push(question);
    await writeJsonFile(SUBJECTIVE_PATH, questions);

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions/import-txt", async (req, res, next) => {
  try {
    const { kind, content, source } = req.body || {};

    if (typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ detail: "content 不能为空" });
      return;
    }
    if (!["objective", "subjective"].includes(kind)) {
      res.status(400).json({ detail: "kind 只能是 objective 或 subjective" });
      return;
    }

    if (kind === "objective") {
      const questions = parseObjectiveFromText(content, source || "txt-import");
      const stored = await readJsonFile(OBJECTIVE_PATH);
      stored.push(...questions);
      await writeJsonFile(OBJECTIVE_PATH, stored);
      res.status(201).json({ imported: questions.length });
      return;
    }

    const questions = parseSubjectiveFromText(content, source || "txt-import");
    const stored = await readJsonFile(SUBJECTIVE_PATH);
    stored.push(...questions);
    await writeJsonFile(SUBJECTIVE_PATH, stored);
    res.status(201).json({ imported: questions.length });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ detail: "服务器内部错误" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Problem Drill backend running on http://localhost:${PORT}`);
});
