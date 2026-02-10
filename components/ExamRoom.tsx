import React, { useState, useEffect, useCallback } from 'react';
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
  duration: number;
  minSubmitTime?: number; 
  maxTabSwitches?: number; 
  deadline?: string;  
  scoreMCQ?: number; // Cột D
  scoreTF?: number;  // Cột F
  scoreSA?: number;  // Cột H
  onFinish: () => void;
}
const formatContent = (text: any) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('/')) clean = clean.substring(1).trim();
  return clean.replace(/\\\\/g, "\\").replace(/\\left\s+([\(\[\{])/g, "\\left$1").replace(/\\right\s+([\)\}\]])/g, "\\right$1");
};

const QuestionCard = React.memo(({ q, idx, answer, onSelect }: any) => {
  const qType = q.type ? q.type.toString().trim().toLowerCase() : "";
  return (
    <div className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden mb-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {qType === 'mcq' ? 'Phần I' : (qType === 'true-false' ? 'Phần II' : 'Phần III')}
        </span>
      </div>
      <div className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />
      
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

      {(qType === 'sa' || qType === 'short-answer') && (
        <div className="mt-4 p-6 bg-slate-800/50 rounded-[2rem] border-2 border-slate-700 flex flex-col md:flex-row items-center gap-4">
          <span className="font-black text-emerald-400 shrink-0">ĐÁP ÁN:</span>
          <input type="text" className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono" placeholder="Ví dụ: 6.32" value={answer || ''} onChange={(e) => onSelect(idx, e.target.value)} />
        </div>
      )}
    </div>
  );
}, (prev, next) => JSON.stringify(prev.answer) === JSON.stringify(next.answer));
const parseCloseDate = (s?: string) => {
  if (!s) return null;
  const d = new Date(s + "T23:59:59");
  return isNaN(d.getTime()) ? null : d;
};

export default function ExamRoom({ 
  questions, 
  studentInfo, 
  duration, 
  minSubmitTime = 50, 
  maxTabSwitches = 2, 
  deadline = "", 
  onFinish 
}: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());
  const [tabSwitches, setTabSwitches] = useState(0);

 const handleFinish = useCallback((isAuto = false) => {
    const timeNow = new Date().getTime();
    const startTimeMs = startTime.getTime();
    const timeSpentMin = Math.floor((timeNow - startTimeMs) / 60000);
    const timeTakenSeconds = Math.floor((timeNow - startTimeMs) / 1000);
  



    if (!isAuto) {
      if (timeSpentMin < minSubmitTime) {
        alert(`Cần tối thiểu ${minSubmitTime} phút để nộp. Còn ${minSubmitTime - timeSpentMin} phút.`);
        return;
      }
    }

    // 1. GỌI SCOREWORD ĐỂ CHẤM ĐIỂM NGAY TỨC THÌ
    // Lấy điểm từ props: scoreMCQ (Cột D), scoreTF (Cột F), scoreSA (Cột H)
    const result = scoreWord(
      questions, 
      answers, 
      Number(scoreMCQ) || 0.25, 
      Number(scoreTF) || 1.0, 
      Number(scoreSA) || 0.5
    );

    alert(isAuto ? "Tự động nộp bài!" : "Nộp bài thành công!");

    // 2. GỬI DỮ LIỆU ĐÃ CHẤM VỀ HÀM CHA
    onFinish({
      tongdiem: result.totalScore.toString().replace('.', ','), // Chuyển dấu phẩy cho Sheets
      time: timeTakenSeconds,                                  // Số giây cho cột G
      timestamp: new Date().toLocaleString('vi-VN'),            // Cột A
      details: result.details                                   // Chi tiết nếu cần
    });
  }, [startTime, minSubmitTime, questions, answers, scoreMCQ, scoreTF, scoreSA, onFinish]);

  // 3. RENDER MATHJAX (Để công thức không bị lỗi "trơ" mã LaTeX)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
    }
  }, [questions, answers]);
 useEffect(() => {
  const handleTab = () => {
    if (document.hidden && maxTabSwitches > 0) {
      setTabSwitches(v => {
        const next = v + 1;
        if (next < maxTabSwitches) {
          setTabWarning(next);
        }
        return next;
      });
    }
  };

  document.addEventListener("visibilitychange", handleTab);
  return () => document.removeEventListener("visibilitychange", handleTab);
}, [maxTabSwitches]);
useEffect(() => {
  if (
    maxTabSwitches > 0 &&
    tabSwitches >= maxTabSwitches &&
    !hasAutoSubmitted
  ) {
    setHasAutoSubmitted(true);
    handleFinish(true);
  }
}, [tabSwitches, maxTabSwitches, hasAutoSubmitted, handleFinish]);


 useEffect(() => {
  if (deadline && new Date() > deadline) { 
    alert("Hết hạn!"); 
    onFinish(); 
  }
}, [deadline, onFinish]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(v => { if (v <= 1) { clearInterval(timer); handleFinish(true); return 0; } return v - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish]);

  const handleSelect = useCallback((idx: number, val: any) => setAnswers(p => ({ ...p, [idx]: val })), []);

  return (
    <>
    {tabWarning !== null && tabWarning < maxTabSwitches && (
  <div className="max-w-4xl mx-auto mb-6">
    <div className="bg-blue-600/20 border-2 border-red-500 text-red-200 px-6 py-4 rounded-2xl font-bold text-center animate-pulse">
      ⚠️ Cảnh báo chuyển tab ({tabWarning}/{maxTabSwitches})
    </div>
  </div>
)}

    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <span className="text-white font-black">{studentInfo?.name}</span>
          <span className="text-xs text-emerald-400">SBD: {studentInfo?.sbd}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-6 py-2 rounded-2xl">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black">NỘP BÀI</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => <QuestionCard key={idx} q={q} idx={idx} answer={answers[idx]} onSelect={handleSelect} />)}
      </div>
    </div>
       </>
  );
}
