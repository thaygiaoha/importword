import React, { useEffect, useRef, useState } from "react";

interface ExamRoomProps {
  questions: any[];
  studentInfo: {
    sbd: string;
    name: string;
    idgv: string;
    examCode: string;
  };
  settings: {
    duration: number; // phút
    mintime: number;  // phút
    tab: number;
    close: string;    // dd/mm/yyyy | yyyy-mm-dd
  };
  onFinish: (answers: any, violations: number) => void;
}

// parse ngày đóng đề
const parseCloseDate = (str: string) => {
  if (!str) return null;

  if (str.includes("-")) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59);
  }

  if (str.includes("/")) {
    const [d, m, y] = str.split("/").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59);
  }

  return null;
};

export default function ExamRoom({
  questions,
  studentInfo,
  settings,
  onFinish
}: ExamRoomProps) {

  // ====== CONFIG TỪ SHEET (KHÔNG ĐỔI TÊN) ======
  const EXAM_DURATION = settings.duration * 60;
  const MIN_TIME = settings.mintime * 60;
  const TAB_LIMIT = settings.tab;
  const CLOSE_DATE = parseCloseDate(settings.close);

  // ====== STATE ======
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabCount, setTabCount] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const finishedRef = useRef(false);

  // ====== KIỂM TRA ĐÓNG ĐỀ NGAY KHI VÀO ======
  useEffect(() => {
    if (CLOSE_DATE && new Date() > CLOSE_DATE) {
      alert("⛔ Đề thi đã đóng.");
      onFinish({}, 0);
    }
  }, []);

  // ====== ĐẾM GIỜ ======
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finish(true);
          return 0;
        }

        const elapsed = EXAM_DURATION - prev;
        if (elapsed >= MIN_TIME) setCanSubmit(true);

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ====== CHỐNG CHUYỂN TAB ======
  useEffect(() => {
    const onBlur = () => {
      setTabCount(prev => {
        const next = prev + 1;
        if (next > TAB_LIMIT) {
          alert("🚫 Chuyển tab quá số lần cho phép. Tự động nộp bài!");
          finish(true, next);
        }
        return next;
      });
    };

    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // ====== NỘP BÀI ======
  const finish = (auto = false, tabs?: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (!auto) {
      const elapsed = EXAM_DURATION - timeLeft;
      if (elapsed < MIN_TIME) {
        alert("⏳ Chưa đủ thời gian tối thiểu để nộp bài.");
        finishedRef.current = false;
        return;
      }
      if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) {
        finishedRef.current = false;
        return;
      }
    }

    onFinish(answers, tabs ?? tabCount);
  };

  // ====== TRẢ LỜI ======
  const setAnswer = (qIdx: number, value: any, sub?: number) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (typeof sub === "number") {
        const arr = Array.isArray(prev[qIdx]) ? [...prev[qIdx]] : [];
        arr[sub] = value;
        next[qIdx] = arr;
      } else {
        next[qIdx] = value;
      }
      return next;
    });
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="sticky top-0 z-50 bg-slate-900 p-4 rounded-xl flex justify-between items-center">
        <div>
          <div className="text-sm font-bold">{studentInfo.name}</div>
          <div className="text-xs text-red-400">
            Tab: {tabCount}/{TAB_LIMIT}
          </div>
        </div>
        <div className="font-mono text-xl">{fmtTime(timeLeft)}</div>
        <button
          disabled={!canSubmit}
          onClick={() => finish(false)}
          className="bg-emerald-600 px-4 py-2 rounded disabled:opacity-40"
        >
          Nộp bài
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-6 space-y-6">
        {questions.map((q, i) => (
          <div key={i} className="bg-slate-900 p-6 rounded-xl">
            <div className="font-bold mb-3">Câu {i + 1}</div>

            {/* MCQ */}
            {q.type === "mcq" &&
              q.o?.map((opt: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setAnswer(i, idx)}
                  className={`block w-full text-left p-3 rounded mt-2 ${
                    answers[i] === idx
                      ? "bg-emerald-600"
                      : "bg-slate-800"
                  }`}
                >
                  {opt}
                </button>
              ))}

            {/* TRUE / FALSE */}
            {q.type === "true-false" &&
              q.s?.map((sub: any, sIdx: number) => (
                <div key={sIdx} className="flex gap-3 items-center mt-2">
                  <span>{sub.text}</span>
                  <button onClick={() => setAnswer(i, true, sIdx)}>Đúng</button>
                  <button onClick={() => setAnswer(i, false, sIdx)}>Sai</button>
                </div>
              ))}

            {/* SHORT ANSWER */}
            {(q.type === "sa" || q.type === "short-answer") && (
              <input
                className="w-full mt-3 p-3 bg-slate-800 rounded"
                value={answers[i] || ""}
                onChange={e => setAnswer(i, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
