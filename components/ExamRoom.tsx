import React, { useState, useEffect, useCallback } from 'react';
// Import hàm chấm điểm từ file của thầy
import { scoreWord } from '../scoreWord'; 

interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'sa' | 'short-answer'; 
  question: string;
  o?: string[];
  s?: any[];
  a?: string;
}

interface ExamRoomProps {
  questions: Question[];
  studentInfo: {
    idgv: string;
    sbd: string;
    name: string;
    className: string;
    examCode: string;
  };
  duration: number;       // Thời gian làm bài (phút)
  minSubmitTime?: number;  // miniTime từ sheet
  maxTabSwitches?: number; // tabLimit từ sheet
  deadline?: string;  
  scoreMCQ?: number;
  scoreTF?: number; 
  scoreSA?: number; 
  onFinish: (result: any) => void;
}

// Hàm format nội dung hiển thị (Latex, Xuống dòng)
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

// Component thẻ câu hỏi
const QuestionCard = React.memo(({ q, idx, answer, onSelect }: any) => {
  const qType = q.type ? q.type.toString().trim().toLowerCase() : "";
  return (
    <div className="bg-slate-900 border-2 border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-xl mb-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {qType === 'mcq' ? 'Phần I' : (qType === 'true-false' ? 'Phần II' : 'Phần III')}
        </span>
      </div>
      <div className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />
      
      {/* MCQ */}
      {qType === 'mcq' && q.o && (
        <div className="grid grid-cols-1 gap-4">
          {q.o.map((opt: any, i: number) => {
            const label = String.fromCharCode(65 + i);
            const isSelected = answer === label;
            return (
              <button key={i} onClick={() => onSelect(idx, label)} className={`p-5 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}>
                <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
                <div className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Đúng/Sai */}
      {qType === 'true-false' && (
        <div className="space-y-3">
          {(q.s || q.o || []).map((sub: any, sIdx: number) => {
            const subLabel = String.fromCharCode(65 + sIdx);
            const content = typeof sub === 'string' ? sub : (sub.text || "");
            return (
              <div key={sIdx} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-800 rounded-2xl bg-slate-800/30 gap-4">
                <div className="flex-1 text-slate-200">
                  <span className="font-bold text-emerald-500 mr-2">{subLabel}.</span>
                  <span dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
                </div>
                <div className="flex gap-2">
                  {['Đúng', 'Sai'].map((label) => {
                    const isSelected = answer?.[subLabel] === label;
                    return (
                      <button key={label} onClick={() => onSelect(idx, { ...(answer || {}), [subLabel]: label })} className={`px-6 py-2 rounded-xl font-bold border-2 transition-all ${isSelected ? (label === 'Đúng' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-red-600 border-red-500 text-white') : 'bg-slate-700 border-slate-600 text-slate-400'}`}>{label}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ngắn */}
      {(qType === 'sa' || qType === 'short-answer') && (
        <div className="mt-4 p-6 bg-slate-800/50 rounded-[2rem] border-2 border-slate-700 flex flex-col md:flex-row items-center gap-4">
          <span className="font-black text-emerald-400 shrink-0">ĐÁP ÁN:</span>
          <input type="text" className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono" placeholder="..." value={answer || ''} onChange={(e) => onSelect(idx, e.target.value)} />
        </div>
      )}
    </div>
  );
}, (prev, next) => JSON.stringify(prev.answer) === JSON.stringify(next.answer));

// --- COMPONENT CHÍNH ---
export default function ExamRoom({ 
  questions, studentInfo, duration, 
  minSubmitTime = 0, maxTabSwitches = 0, deadline = "", 
  scoreMCQ = 0.25, scoreTF = 1.0, scoreSA = 0.5, onFinish 
}: ExamRoomProps) {

  // KHAI BÁO STATE THEO THỨ TỰ
  const [startTime] = useState(new Date()); 
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(Number(duration) * 60);
  const [tabSwitches, setTabSwitches] = useState(0);

  // HÀM NỘP BÀI (Chốt chặn cuối cùng)
  const handleFinish = useCallback((isAuto = false) => {
    const timeNow = new Date().getTime();
    const startTimeMs = startTime.getTime();
    const timeTakenSeconds = Math.floor((timeNow - startTimeMs) / 1000);
    const timeSpentMin = Math.floor(timeTakenSeconds / 60);

    // Chặn nộp sớm
    if (!isAuto && Number(minSubmitTime) > 0 && timeSpentMin < Number(minSubmitTime)) {
      alert(`Cần làm bài tối thiểu ${minSubmitTime} phút. Còn ${Number(minSubmitTime) - timeSpentMin} phút nữa mới được nộp.`);
      return;
    }

    // Chấm điểm
    const result = scoreWord(
      questions, 
      answers, 
      Number(scoreMCQ), 
      Number(scoreTF), 
      Number(scoreSA)
    );

    // Đóng gói payload gửi về App.tsx
    const finalPayload = {
      score: result.totalScore || 0,
      timeUsed: timeTakenSeconds,
      details: result.details || [],
      timestamp: new Date().toLocaleString('vi-VN')
    };

    if (isAuto) alert("Hệ thống tự động nộp bài (do hết giờ hoặc vi phạm)!");
    else alert("Nộp bài thành công!");

    onFinish(finalPayload);
  }, [startTime, questions, answers, scoreMCQ, scoreTF, scoreSA, minSubmitTime, onFinish]);

  // Effect: Chống chuyển tab (Lấy maxTabSwitches từ props/sheet)
  useEffect(() => {
    const limit = Number(maxTabSwitches);
    if (limit <= 0) return;

    const handleTab = () => {
      if (document.hidden) {
        setTabSwitches(v => {
          const nextCount = v + 1;
          if (nextCount >= limit) {
            handleFinish(true);
            return nextCount;
          }
          alert(`CẢNH BÁO: Không chuyển tab! (${nextCount}/${limit}). Quá giới hạn bài sẽ tự nộp.`);
          return nextCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleTab);
    return () => document.removeEventListener("visibilitychange", handleTab);
  }, [maxTabSwitches, handleFinish]);

  // Effect: Đồng hồ đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(v => {
        if (v <= 1) { clearInterval(timer); handleFinish(true); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish]);

  // Effect: MathJax rendering
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch(() => {});
    }
  }, [questions, answers]);

  const handleSelect = useCallback((idx: number, val: any) => setAnswers(p => ({ ...p, [idx]: val })), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <span className="text-white font-black">{studentInfo?.name}</span>
          <span className="text-xs text-emerald-400">SBD: {studentInfo?.sbd} | Vi phạm: {tabSwitches}/{maxTabSwitches}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-mono font-black px-6 py-2 rounded-2xl bg-slate-800 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black hover:bg-emerald-500 transition-all">NỘP BÀI</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => <QuestionCard key={idx} q={q} idx={idx} answer={answers[idx]} onSelect={handleSelect} />)}
      </div>
    </div>
  );
}
