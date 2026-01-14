import { useEffect, useMemo, useState } from "react";

const API_HOST = typeof window === "undefined" ? "localhost" : window.location.hostname;
const API_BASE = `http://${API_HOST}:8000`;
const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PAGE_SIZE = 10;
const KNOWN_OBJECTIVE_SETS = ["cn-cal.txt", "cn-con.txt", "java-tot.txt", "javaself.txt"];

const getOptionLabel = (index) => OPTION_LABELS[index] || `#${index + 1}`;
const normalizeSource = (source) => source || "未分类";
const getSourceLabel = (source) =>
  source ? source.replace(/\.txt$/i, "") : "未分类";

const PracticePage = () => {
  const [objectiveSet, setObjectiveSet] = useState("");
  const [objectiveBank, setObjectiveBank] = useState([]);
  const [objectiveError, setObjectiveError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [objectiveResult, setObjectiveResult] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [subjectiveQuestion, setSubjectiveQuestion] = useState(null);
  const [subjectiveError, setSubjectiveError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const loadObjective = async () => {
    setObjectiveError("");
    try {
      const response = await fetch(`${API_BASE}/api/questions/objective`);
      if (!response.ok) throw new Error("No data");
      const questions = await response.json();
      setObjectiveBank(Array.isArray(questions) ? questions : []);
      if (!questions || questions.length === 0) {
        setObjectiveError("题库为空，请先导入题目。");
      }
    } catch (error) {
      setObjectiveBank([]);
      setObjectiveError("无法加载题库，请检查后端服务。");
    }
  };

  const objectiveSets = useMemo(() => {
    const sourceSet = new Set();
    objectiveBank.forEach((item) => sourceSet.add(normalizeSource(item.source)));
    const ordered = [];
    KNOWN_OBJECTIVE_SETS.forEach((name) => {
      if (sourceSet.has(name)) ordered.push(name);
    });
    sourceSet.forEach((name) => {
      if (!ordered.includes(name)) ordered.push(name);
    });
    return ordered;
  }, [objectiveBank]);

  const objectiveQuestions = useMemo(() => {
    if (!objectiveSet) return [];
    const key = normalizeSource(objectiveSet);
    return objectiveBank.filter((item) => normalizeSource(item.source) === key);
  }, [objectiveBank, objectiveSet]);

  const objectiveQuestion = objectiveQuestions[questionIndex] || null;
  const canPrevQuestion = questionIndex > 0;
  const canNextQuestion = questionIndex < objectiveQuestions.length - 1;
  const currentPage = Math.floor(questionIndex / PAGE_SIZE);
  const totalPages = Math.ceil(objectiveQuestions.length / PAGE_SIZE);
  const pageStartIndex = currentPage * PAGE_SIZE;
  const pageQuestions = objectiveQuestions.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);

  const resetObjectiveAnswer = () => {
    setSelectedIndex(null);
    setObjectiveResult(null);
  };

  const selectQuestion = (index) => {
    if (objectiveQuestions.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, objectiveQuestions.length - 1));
    setQuestionIndex(safeIndex);
    resetObjectiveAnswer();
  };

  const changePage = (delta) => {
    if (objectiveQuestions.length === 0) return;
    const nextPage = Math.max(0, Math.min(currentPage + delta, totalPages - 1));
    selectQuestion(nextPage * PAGE_SIZE);
  };

  const goPrevQuestion = () => {
    if (!canPrevQuestion) return;
    selectQuestion(questionIndex - 1);
  };

  const goNextQuestion = () => {
    if (!canNextQuestion) return;
    selectQuestion(questionIndex + 1);
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
      if (!response.ok) throw new Error("No data");
      const [question] = await response.json();
      setSubjectiveQuestion(question);
    } catch (error) {
      setSubjectiveQuestion(null);
      setSubjectiveError("无法加载题目，请检查后端服务。");
    }
  };

  useEffect(() => {
    loadObjective();
  }, []);

  useEffect(() => {
    if (objectiveSets.length === 0) {
      setObjectiveSet("");
      return;
    }
    if (!objectiveSet || !objectiveSets.includes(objectiveSet)) {
      setObjectiveSet(objectiveSets[0]);
    }
  }, [objectiveSets, objectiveSet]);

  useEffect(() => {
    setQuestionIndex(0);
    resetObjectiveAnswer();
  }, [objectiveSet]);

  useEffect(() => {
    if (objectiveQuestions.length === 0) {
      setQuestionIndex(0);
      resetObjectiveAnswer();
      return;
    }
    if (questionIndex >= objectiveQuestions.length) {
      setQuestionIndex(0);
      resetObjectiveAnswer();
    }
  }, [objectiveQuestions, questionIndex]);

  return (
    <div className="layout">
      {/* 客观题部分 */}
      <section className="card">
        <h2>客观题练习</h2>
        <div className="practice-controls">
          <label className="filter-label">
            题目集
            <select
              value={objectiveSet}
              onChange={(event) => setObjectiveSet(event.target.value)}
              disabled={objectiveSets.length === 0}
            >
              {objectiveSets.length === 0 ? (
                <option value="">暂无题库</option>
              ) : (
                objectiveSets.map((source) => (
                  <option key={source} value={source}>
                    {getSourceLabel(source)}
                  </option>
                ))
              )}
            </select>
          </label>
          <button type="button" onClick={loadObjective}>
            刷新题库
          </button>
        </div>

        <div className="practice-area">
          {objectiveQuestion && (
            <>
              <div className="question-header">
                <div className="question-meta">
                  第 {questionIndex + 1} / {objectiveQuestions.length} 题
                </div>
                <div className="question-nav">
                  <button
                    type="button"
                    className="nav-button ghost"
                    onClick={goPrevQuestion}
                    disabled={!canPrevQuestion}
                  >
                    上一题
                  </button>
                  <button
                    type="button"
                    className="nav-button"
                    onClick={goNextQuestion}
                    disabled={!canNextQuestion}
                  >
                    下一题
                  </button>
                </div>
              </div>
              <h3 className="question-text">{objectiveQuestion.question}</h3>
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
                    <span className="option-text">{option}</span>
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
          {!objectiveError && !objectiveQuestion && (
            <p className="form-status">暂无题目，请先选择题目集或刷新题库。</p>
          )}
          {objectiveQuestions.length > 0 && (
            <div className="question-index">
              <div className="index-grid">
                {pageQuestions.map((item, index) => {
                  const absoluteIndex = pageStartIndex + index;
                  return (
                    <button
                      type="button"
                      key={item.id || `${item.source}-${absoluteIndex}`}
                      className={`index-button ${absoluteIndex === questionIndex ? "active" : ""}`}
                      onClick={() => selectQuestion(absoluteIndex)}
                    >
                      {absoluteIndex + 1}
                    </button>
                  );
                })}
              </div>
              <div className="index-pagination">
                <button
                  type="button"
                  className="page-button"
                  onClick={() => changePage(-1)}
                  disabled={currentPage <= 0}
                >
                  上一组
                </button>
                <span className="page-info">
                  第 {totalPages === 0 ? 0 : currentPage + 1} / {totalPages} 组
                </span>
                <button
                  type="button"
                  className="page-button"
                  onClick={() => changePage(1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  下一组
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 主观题部分 */}
      <section className="card">
        <h2>主观题练习</h2>
        <button type="button" onClick={loadSubjective}>
          抽取题目
        </button>
        <div className="practice-area">
          {subjectiveQuestion && (
            <>
              <h3 className="question-text">{subjectiveQuestion.question}</h3>
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
    </div>
  );
};

export default PracticePage;
