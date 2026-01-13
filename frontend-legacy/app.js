const API_BASE = "http://localhost:8000";

const optionLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const getOptionLabel = (index) => optionLabels[index] || `#${index + 1}`;

const clearStatus = (el) => {
  if (!el) return;
  el.textContent = "";
  el.classList.remove("error", "success");
};

const setStatus = (el, message, success = true) => {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("success", success);
  el.classList.toggle("error", !success);
};

const objectiveForm = document.getElementById("objective-form");
const objectiveType = document.getElementById("objective-type");
const objectiveQuestion = document.getElementById("objective-question");
const objectiveOptions = document.getElementById("objective-options");
const objectiveAnswer = document.getElementById("objective-answer");
const objectiveStatus = document.getElementById("objective-status");

const subjectiveForm = document.getElementById("subjective-form");
const subjectiveQuestion = document.getElementById("subjective-question");
const subjectiveAnswer = document.getElementById("subjective-answer");
const subjectiveStatus = document.getElementById("subjective-status");

const loadObjectiveBtn = document.getElementById("load-objective");
const practiceObjectiveType = document.getElementById("practice-objective-type");
const objectivePractice = document.getElementById("objective-practice");

const loadSubjectiveBtn = document.getElementById("load-subjective");
const subjectivePractice = document.getElementById("subjective-practice");

const txtImportForm = document.getElementById("txt-import-form");
const txtImportKind = document.getElementById("txt-import-kind");
const txtImportFile = document.getElementById("txt-import-file");
const txtImportContent = document.getElementById("txt-import-content");
const txtImportStatus = document.getElementById("txt-import-status");

if (objectiveType) {
  objectiveType.addEventListener("change", () => {
    if (!objectiveOptions || !objectiveAnswer) return;
    if (objectiveType.value === "judge") {
      objectiveOptions.value = "T\nF";
      objectiveAnswer.value = "1";
    }
  });
}

if (objectiveForm) {
  objectiveForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus(objectiveStatus);
    const questionText = objectiveQuestion.value.trim();
    const options = objectiveOptions.value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const answerIndex = Number(objectiveAnswer.value) - 1;

    if (!questionText || options.length < 2) {
      setStatus(objectiveStatus, "请填写题目并提供至少两个选项。", false);
      return;
    }
    if (Number.isNaN(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
      setStatus(objectiveStatus, "正确答案序号超出范围。", false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/questions/objective`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          options,
          answer_index: answerIndex,
          qtype: objectiveType.value,
          source: "frontend",
        }),
      });

      if (!response.ok) {
        throw new Error("submit failed");
      }

      objectiveForm.reset();
      objectiveOptions.value = "";
      setStatus(objectiveStatus, "客观题提交成功！", true);
    } catch (error) {
      setStatus(objectiveStatus, "提交失败，请检查后端服务。", false);
    }
  });
}

if (subjectiveForm) {
  subjectiveForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus(subjectiveStatus);
    const questionText = subjectiveQuestion.value.trim();
    const answerText = subjectiveAnswer.value.trim();

    if (!questionText || !answerText) {
      setStatus(subjectiveStatus, "请填写题目与参考答案。", false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/questions/subjective`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          answer: answerText,
          source: "frontend",
        }),
      });

      if (!response.ok) {
        throw new Error("submit failed");
      }

      subjectiveForm.reset();
      setStatus(subjectiveStatus, "主观题提交成功！", true);
    } catch (error) {
      setStatus(subjectiveStatus, "提交失败，请检查后端服务。", false);
    }
  });
}

const renderObjectivePractice = (question) => {
  if (!objectivePractice) return;
  objectivePractice.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = question.question;
  objectivePractice.appendChild(title);

  const list = document.createElement("div");
  list.className = "options";

  question.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "practice-option";
    input.value = index;
    const prefix = document.createElement("span");
    prefix.className = "option-label";
    prefix.textContent = `${getOptionLabel(index)}.`;
    const text = document.createElement("span");
    text.textContent = option;
    label.appendChild(input);
    label.appendChild(prefix);
    label.appendChild(text);
    list.appendChild(label);
  });

  const checkButton = document.createElement("button");
  checkButton.textContent = "检查答案";
  const result = document.createElement("p");
  result.className = "form-status";

  checkButton.addEventListener("click", () => {
    const selected = list.querySelector("input:checked");
    if (!selected) {
      setStatus(result, "请选择一个答案。", false);
      return;
    }
    const isCorrect = Number(selected.value) === question.answer_index;
    setStatus(result, isCorrect ? "回答正确！" : "回答错误。", isCorrect);
  });

  objectivePractice.appendChild(list);
  objectivePractice.appendChild(checkButton);
  objectivePractice.appendChild(result);
};

if (loadObjectiveBtn && practiceObjectiveType && objectivePractice) {
  loadObjectiveBtn.addEventListener("click", async () => {
    objectivePractice.innerHTML = "";
    const typeParam = practiceObjectiveType.value
      ? `?qtype=${practiceObjectiveType.value}`
      : "";
    try {
      const response = await fetch(`${API_BASE}/api/questions/objective/random${typeParam}`);
      if (!response.ok) {
        throw new Error("No data");
      }
      const [question] = await response.json();
      renderObjectivePractice(question);
    } catch (error) {
      objectivePractice.textContent = "无法加载题目，请检查后端服务。";
    }
  });
}

const renderSubjectivePractice = (question) => {
  if (!subjectivePractice) return;
  subjectivePractice.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = question.question;
  const input = document.createElement("textarea");
  input.rows = 4;
  input.placeholder = "请在此作答";
  const reveal = document.createElement("button");
  reveal.textContent = "查看参考答案";
  const answer = document.createElement("p");
  answer.className = "answer";

  reveal.addEventListener("click", () => {
    answer.textContent = question.answer;
  });

  subjectivePractice.appendChild(title);
  subjectivePractice.appendChild(input);
  subjectivePractice.appendChild(reveal);
  subjectivePractice.appendChild(answer);
};

if (loadSubjectiveBtn && subjectivePractice) {
  loadSubjectiveBtn.addEventListener("click", async () => {
    subjectivePractice.innerHTML = "";
    try {
      const response = await fetch(`${API_BASE}/api/questions/subjective/random`);
      if (!response.ok) {
        throw new Error("No data");
      }
      const [question] = await response.json();
      renderSubjectivePractice(question);
    } catch (error) {
      subjectivePractice.textContent = "无法加载题目，请检查后端服务。";
    }
  });
}

if (txtImportForm) {
  txtImportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus(txtImportStatus);

    let content = "";
    const file = txtImportFile?.files?.[0];
    if (file) {
      content = await file.text();
    } else if (txtImportContent) {
      content = txtImportContent.value;
    }

    if (!content.trim()) {
      setStatus(txtImportStatus, "请提供 TXT 内容或选择文件。", false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/questions/import-txt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: txtImportKind?.value || "objective",
          content,
          source: "txt-import",
        }),
      });

      if (!response.ok) {
        throw new Error("import failed");
      }

      const result = await response.json();
      txtImportForm.reset();
      setStatus(txtImportStatus, `导入成功：${result.imported} 题`, true);
    } catch (error) {
      setStatus(txtImportStatus, "导入失败，请检查后端服务。", false);
    }
  });
}
