import { useEffect, useState } from "react";

const API_HOST = typeof window === "undefined" ? "localhost" : window.location.hostname;
const API_BASE = `http://${API_HOST}:8000`;

const EntryPage = () => {
  const [objectiveType, setObjectiveType] = useState("single");
  const [objectiveQuestion, setObjectiveQuestion] = useState("");
  const [objectiveOptions, setObjectiveOptions] = useState("");
  const [objectiveAnswer, setObjectiveAnswer] = useState("1");
  const [objectiveStatus, setObjectiveStatus] = useState(null);

  const [subjectiveQuestion, setSubjectiveQuestion] = useState("");
  const [subjectiveAnswer, setSubjectiveAnswer] = useState("");
  const [subjectiveStatus, setSubjectiveStatus] = useState(null);

  const [importKind, setImportKind] = useState("objective");
  const [importFile, setImportFile] = useState(null);
  const [importContent, setImportContent] = useState("");
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    if (objectiveType === "judge") {
      setObjectiveOptions("T\nF");
      setObjectiveAnswer("1");
    }
  }, [objectiveType]);

  const submitObjective = async (event) => {
    event.preventDefault();
    setObjectiveStatus(null);
    const questionText = objectiveQuestion.trim();
    const options = objectiveOptions
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const answerIndex = Number(objectiveAnswer) - 1;

    if (!questionText || options.length < 2) {
      setObjectiveStatus({ message: "请填写题目并提供至少两个选项。", success: false });
      return;
    }
    if (Number.isNaN(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
      setObjectiveStatus({ message: "正确答案序号超出范围。", success: false });
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
          qtype: objectiveType,
          source: "frontend",
        }),
      });
      if (!response.ok) {
        throw new Error("submit failed");
      }
      setObjectiveQuestion("");
      setObjectiveOptions("");
      setObjectiveAnswer("1");
      setObjectiveStatus({ message: "客观题提交成功！", success: true });
    } catch (error) {
      setObjectiveStatus({ message: "提交失败，请检查后端服务。", success: false });
    }
  };

  const submitSubjective = async (event) => {
    event.preventDefault();
    setSubjectiveStatus(null);
    const questionText = subjectiveQuestion.trim();
    const answerText = subjectiveAnswer.trim();

    if (!questionText || !answerText) {
      setSubjectiveStatus({ message: "请填写题目与参考答案。", success: false });
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
      setSubjectiveQuestion("");
      setSubjectiveAnswer("");
      setSubjectiveStatus({ message: "主观题提交成功！", success: true });
    } catch (error) {
      setSubjectiveStatus({ message: "提交失败，请检查后端服务。", success: false });
    }
  };

  const submitImport = async (event) => {
    event.preventDefault();
    setImportStatus(null);
    let content = importContent;
    if (importFile) {
      content = await importFile.text();
    }
    if (!content.trim()) {
      setImportStatus({ message: "请提供 TXT 内容或选择文件。", success: false });
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/questions/import-txt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: importKind,
          content,
          source: "txt-import",
        }),
      });
      if (!response.ok) {
        throw new Error("import failed");
      }
      const result = await response.json();
      setImportFile(null);
      setImportContent("");
      setImportStatus({ message: `导入成功：${result.imported} 题`, success: true });
    } catch (error) {
      setImportStatus({ message: "导入失败，请检查后端服务。", success: false });
    }
  };

  return (
    <>
      <section className="card">
        <h2>客观题录入</h2>
        <form onSubmit={submitObjective}>
          <label>
            类型
            <select value={objectiveType} onChange={(event) => setObjectiveType(event.target.value)}>
              <option value="single">单选题</option>
              <option value="judge">判断题</option>
            </select>
          </label>
          <label>
            题目
            <textarea
              rows="4"
              placeholder="请输入题目"
              value={objectiveQuestion}
              onChange={(event) => setObjectiveQuestion(event.target.value)}
            />
          </label>
          <label>
            选项（每行一个）
            <textarea
              rows="4"
              placeholder="选项 A&#10;选项 B&#10;选项 C"
              value={objectiveOptions}
              onChange={(event) => setObjectiveOptions(event.target.value)}
            />
          </label>
          <label>
            正确选项序号（从 1 开始）
            <input
              type="number"
              min="1"
              value={objectiveAnswer}
              onChange={(event) => setObjectiveAnswer(event.target.value)}
            />
          </label>
          <button type="submit">提交客观题</button>
          {objectiveStatus && (
            <p className={`form-status ${objectiveStatus.success ? "success" : "error"}`}>
              {objectiveStatus.message}
            </p>
          )}
        </form>
      </section>

      <section className="card">
        <h2>主观题录入</h2>
        <form onSubmit={submitSubjective}>
          <label>
            题目
            <textarea
              rows="4"
              placeholder="请输入主观题"
              value={subjectiveQuestion}
              onChange={(event) => setSubjectiveQuestion(event.target.value)}
            />
          </label>
          <label>
            参考答案
            <textarea
              rows="4"
              placeholder="请输入参考答案"
              value={subjectiveAnswer}
              onChange={(event) => setSubjectiveAnswer(event.target.value)}
            />
          </label>
          <button type="submit">提交主观题</button>
          {subjectiveStatus && (
            <p className={`form-status ${subjectiveStatus.success ? "success" : "error"}`}>
              {subjectiveStatus.message}
            </p>
          )}
        </form>
      </section>

      <section className="card">
        <h2>TXT 录题导入</h2>
        <form onSubmit={submitImport}>
          <label>
            题型
            <select value={importKind} onChange={(event) => setImportKind(event.target.value)}>
              <option value="objective">客观题</option>
              <option value="subjective">主观题</option>
            </select>
          </label>
          <label>
            选择 TXT 文件（可选）
            <input type="file" accept=".txt" onChange={(event) => setImportFile(event.target.files[0])} />
          </label>
          <label>
            或者直接粘贴内容
            <textarea
              rows="6"
              placeholder="#CHOICE&#10;..."
              value={importContent}
              onChange={(event) => setImportContent(event.target.value)}
            />
          </label>
          <button type="submit">导入题库</button>
          {importStatus && (
            <p className={`form-status ${importStatus.success ? "success" : "error"}`}>
              {importStatus.message}
            </p>
          )}
        </form>
      </section>
    </>
  );
};

export default EntryPage;
