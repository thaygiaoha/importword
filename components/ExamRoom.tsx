import React, { useState, useEffect, useCallback } from 'react';

interface Question {
  id: string;
  type: string; 
  question: string;
  o?: string[];
  s?: { text: string; a: boolean }[];
  a?: string;
}

interface ExamRoomProps {
  questions: any[];
  studentInfo: any;
  duration: number;
  minSubmitTime?: number; 
  maxTabSwitches?: number; 
  deadline?: string;       
  onFinish: () => void;
}

const formatContent = (text: string) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('{') && clean.includes('"question"')) {
    try {
      const obj = JSON.parse(clean);
      clean = obj.question || clean;
    } catch (e) {}
  }
  return clean
    .replace(/\\+/g, '\\')
    .replace(/left\s*\[/g, "\\left[")
    .replace(/right\s*\]/g, "\\right]")
    .replace(/sin\s*x/g, "\\sin x")
    .replace(/\n/g, "<br />")
    .trim();
};

// ... (Hàm formatContent giữ nguyên như bản đẹp thầy ưng)

export default function ExamRoom({ 
  questions, studentInfo, duration, 
  minSubmitTime = 0, maxTabSwitches = 0, deadline = "", 
  onFinish 
}: ExamRoomProps) {
  // Ép kiểu số ngay lập tức để tránh lỗi so sánh chuỗi
  const minTimeConst = Number(minSubmitTime);
  const maxTabConst = Number(maxTabSwitches);

  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now()); // Dùng timestamp cho chuẩn

  // Hàm nộp bài "Sắt đá"
  const handleFinish = useCallback((isAuto = false) => {
    if (!isAuto) {
      const timeSpentMin = (Date.now() - startTime) / 60000;
      if (timeSpentMin < minTimeConst) {
        alert(`CHƯA ĐỦ THỜI GIAN! \nThầy quy định làm bài tối thiểu ${minTimeConst} phút. \nBạn mới làm được ${Math.floor(timeSpentMin)} phút.`);
        return;
      }
    }
    alert(isAuto ? "HỆ THỐNG TỰ ĐỘNG NỘP BÀI!" : "Nộp bài thành công!");
    onFinish();
  }, [startTime, minTimeConst, onFinish]);

  // Xử lý Tab - Chặn đứng ngay khi vi phạm
  useEffect(() => {
    const handleTab = () => {
      if (document.hidden && maxTabConst > 0) {
        setTabSwitches(prev => {
          const currentViolation = prev + 1;
          if (currentViolation >= maxTabConst) {
            handleFinish(true); // Nộp luôn không cho giải thích
            return currentViolation;
          }
          alert(`CẢNH BÁO: Không rời Tab! \nVi phạm: ${currentViolation}/${maxTabConst}`);
          return currentViolation;
        });
      }
    };
    document.addEventListener("visibilitychange", handleTab);
    return () => document.removeEventListener("visibilitychange", handleTab);
  }, [maxTabConst, handleFinish]);

  // Kiểm tra Deadline mỗi phút (Tránh lag do check liên tục)
  useEffect(() => {
    if (!deadline) return;
    const checkDeadline = () => {
      const parts = deadline.split(' ');
      const [d, m, y] = parts[0].split('/');
      const t = parts[1] || "23:59";
      if (new Date() > new Date(`${y}-${m}-${d}T${t}`)) { 
        alert("Đề thi đã đóng!"); 
        onFinish(); 
      }
    };
    const dlTimer = setInterval(checkDeadline, 30000); // 30s check 1 lần cho nhẹ máy
    return () => clearInterval(dlTimer);
  }, [deadline, onFinish]);

  // Timer đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(v => {
        if (v <= 1) { clearInterval(timer); handleFinish(true); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish]);

  // Chống lag: Chỉ render lại MathJax khi thực sự cần
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
    }, 200);
    return () => clearTimeout(timeout);
  }, [questions]);

  const handleSelect = useCallback((idx: number, val: any) => {
    setAnswers(p => ({ ...p, [idx]: val }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <span className="text-white font-black text-lg">{studentInfo?.name}</span>
          <div className="flex gap-2">
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">SBD: {studentInfo?.sbd}</span>
            {maxTabConst > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tabSwitches >= maxTabConst - 1 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                VI PHẠM TAB: {tabSwitches}/{maxTabConst}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-5 py-2 rounded-2xl border border-slate-700">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button 
            onClick={() => handleFinish(false)} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all active:scale-90"
          >
            NỘP BÀI
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => (
          <QuestionCard key={q.id || idx} q={q} idx={idx} answer={answers[idx]} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
