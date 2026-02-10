import React, { useEffect, useState } from "react";

interface ExamRoomProps {
  questions: any[];
  studentInfo: {
    sbd: string;
    name: string;
  };
  settings: {
    duration: number;       // phút
    mintime: number;        // phút
    tab: number;            // số lần đổi tab
    close: string;          // yyyy-MM-dd
  };
  onFinish: (answers: any, violations: number) => void;
}

/* ===============================
   PARSE DATE yyyy-MM-dd
================================ */
const parseCloseDate = (s?: string) => {
  if (!s) return null;
  const d = new Date(s + "T23:59:59");
  return isNaN(d.getTime()) ? null : d;
};

export default function ExamRoom({
  questions,
  studentInfo,
  settings,
  onFinish
}: ExamRoomProps) {

  /* ===============================
     CONFIG
  ================================ */
  const EXAM_DURATION = settings.duration * 60;
  const MIN_TIME = settings.mintime * 60;
  const TAB_LIMIT = settings.tab;
  const CLOSE_DATE = parseCloseDate(settings.close);

  /* ===============================
     STATE
  ================================ */
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [canSubmit, setCanSubmit] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabCount, setTabCount] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  const TAB_KEY = `exam_tab_${studentInfo.sbd}`;
  /*=============MathJax ===================== */
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch(() => {});
    }
  }, [questions, answers]);

  /* ===============================
     CHẶN VÀO NẾU ĐỀ ĐÓNG
  ================================ */
  useEffect(() => {
    if (CLOSE_DATE && new Date() > CLOSE_DATE) {
      alert("⛔ Đề thi đã đóng.");
      window.location.href = "/";
    }
  }, []);

  /* ===============================
     TIMER DUY NHẤT
  ================================ */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(true);
          return 0;
        }

        const elapsed = EXAM_DURATION - prev;
        if (elapsed >= MIN_TIME) {
          setCanSubmit(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ===============================
     CHỐNG ĐỔI TAB (KHÔNG RESET)
  ================================ */
  useEffect(() => {
    let count = Number(localStorage.getItem(TAB_KEY)) || 0;
    setTabCount(count);

    const onBlur = () => {
      count++;
      localStorage.setItem(TAB_KEY, count.toString());
      setTabCount(count);

      if (count > TAB_LIMIT) {
        alert("🚫 Bạn đã chuyển tab quá số lần cho phép!");
        handleFinish(true, count);
      }
    };

    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  /* ===============================
     ANSWER
  ================================ */
  const handleAnswerChange = (idx: number, value: any, sub?: number) => {
    if (isClosed) return;
    setAnswers(prev => {
      const n = { ...prev };
      if (typeof sub === "number") {
        const arr = Array.isArray(prev[idx]) ? [...prev[idx]] : [];
        arr[sub] = value;
        n[idx] = arr;
      } else {
        n[idx] = value;
      }
      return n;
    });
  };

  /* ===============================
     SUBMIT
  ================================ */
  const handleFinish = (auto = false, finalTabs = tabCount) => {
    if (isClosed) return;
    setIsClosed(true);

    if (!auto) {
      const elapsed = EXAM_DURATION - timeLeft;
      if (elapsed < MIN_TIME) {
        alert("⏱ Chưa đủ thời gian tối thiểu để nộp bài.");
        setIsClosed(false);
        return;
      }
      if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) {
        setIsClosed(false);
        return;
      }
    }

    onFinish(answers, finalTabs);
  };

  /* ===============================
     FORMAT TIME
  ================================ */
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-40">
      <div className="sticky top-0 bg-slate-900 p-4 flex justify-between items-center rounded-xl">
        <div>
          <div className="text-sm font-bold">{studentInfo.name}</div>
          <div className="text-xs text-red-400">
            LỖI TAB: {tabCount}/{TAB_LIMIT}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="font-mono text-xl">{formatTime(timeLeft)}</div>
          <button
            disabled={!canSubmit}
            onClick={() => handleFinish(false)}
            className="px-4 py-2 bg-emerald-600 rounded disabled:opacity-50"
          >
            Nộp bài
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10 space-y-10">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-slate-900 p-6 rounded-xl">
            <div className="font-bold mb-4">
              Câu {idx + 1}
            </div>

            {q.type === "mcq" &&
              q.o.map((opt: any, i: number) => {
                const label = String.fromCharCode(65 + i);
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerChange(idx, label)}
                    className={`block w-full text-left p-3 mb-2 rounded ${
                      answers[idx] === label
                        ? "bg-emerald-600"
                        : "bg-slate-800"
                    }`}
                  >
                    {label}. {opt}
                  </button>
                );
              })}

            {q.type === "sa" && (
              <input
                className="w-full p-3 bg-slate-800 rounded"
                value={answers[idx] || ""}
                onChange={e => handleAnswerChange(idx, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

