import { useState } from "react";

const API_BASE = "http://localhost:8000";
const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getOptionLabel = (index) => OPTION_LABELS[index] || `#${index + 1}`;

const PracticePage = () => {
  const [objectiveType, setObjectiveType] = useState("");
  const [objectiveQuestion, setObjectiveQuestion] = useState(null);
  const [objectiveError, setObjectiveError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [objectiveResult, setObjectiveResult] = useState(null);

  const [subjectiveQuestion, setSubjectiveQuestion] = useState(null);
  const [subjectiveError, setSubjectiveError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const loadObjective = async () => {
    setObjectiveError("");
    setObjectiveResult(null);
    setSelectedIndex(null);
    const typeParam = objectiveType ? `?qtype=${objectiveType}` : "";
    try {
      const response = await fetch(`${API_BASE}/api/questions/objective/random${typeParam}`);
      if (!response.ok) {
        throw new Error("No data");
      }
      const [question] = await response.json();
      setObjectiveQuestion(question);
    } catch (error) {
      setObjectiveQuestion(null);
      setObjectiveError("无法加载题目，请检查后端服务。");
    }
  };

  const checkAnswer = () => {
    if (!objectiveQuestion) return;
    if (selectedIndex === null) {
      setObjectiveResult({ message: "请选择一个答案。", success: false });
      return;
    }
    const isCorrect = selectedIndex === objectiveQuestion.answer_index;
    setObjectiveResult({
      message: isCorrect ? "回答正确！" : "回答错误。",
      success: isCorrect,
    });
  };

  const loadSubjective = async () => {
    setSubjectiveError("");
    setShowAnswer(false);
    try {
      const response = await fetch(`${API_BASE}/api/questions/subjective/random`);
      if (!response.ok) {
        throw new Error("No data");
      }
      const [question] = await response.json();
      setSubjectiveQuestion(question);
    } catch (error) {
      setSubjectiveQuestion(null);
      setSubjectiveError("无法加载题目，请检查后端服务。");
    }
  };

  return (
    <>
      <section className="card">
        <h2>客观题练习</h2>
        <div className="practice-controls">
          <label>
            类型
            <select
              value={objectiveType}
              onChange={(event) => setObjectiveType(event.target.value)}
            >
              <option value="">全部</option>
              <option value="single">单选题</option>
              <option value="judge">判断题</option>
            </select>
          </label>
          <button type="button" onClick={loadObjective}>
            抽取题目
          </button>
        </div>
        <div className="practice-area">
          {objectiveQuestion && (
            <>
              <h3>{objectiveQuestion.question}</h3>
              <div className="options">
                {objectiveQuestion.options.map((option, index) => (
                  <label className="option" key={`${option}-${index}`}>
                    <input
                      type="radio"
                      name="practice-option"
                      value={index}
                      checked={selectedIndex === index}
                      onChange={() => setSelectedIndex(index)}
                    />
                    <span className="option-label">{getOptionLabel(index)}.</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={checkAnswer}>
                检查答案
              </button>
              {objectiveResult && (
                <p className={`form-status ${objectiveResult.success ? "success" : "error"}`}>
                  {objectiveResult.message}
                </p>
              )}
            </>
          )}
          {objectiveError && <p className="form-status error">{objectiveError}</p>}
        </div>
      </section>

      <section className="card">
        <h2>主观题练习</h2>
        <button type="button" onClick={loadSubjective}>
          抽取题目
        </button>
        <div className="practice-area">
          {subjectiveQuestion && (
            <>
              <h3>{subjectiveQuestion.question}</h3>
              <textarea rows="4" placeholder="请在此作答" />
              <button type="button" onClick={() => setShowAnswer(true)}>
                查看参考答案
              </button>
              {showAnswer && <p className="answer">{subjectiveQuestion.answer}</p>}
            </>
          )}
          {subjectiveError && <p className="form-status error">{subjectiveError}</p>}
        </div>
      </section>
    </>
  );
};

export default PracticePage;
