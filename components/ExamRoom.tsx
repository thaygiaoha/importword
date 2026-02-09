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

const QuestionCard = React.memo(({ q, idx, answer, onSelect }: any) => {
  const qType = (q.type || "").toString().trim().toLowerCase();
  return (
    <div className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden mb-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {qType === 'mcq' ? 'Phần I' : (qType === 'true-false' ? 'Phần II' : 'Phần III')}
        </span>
      </div>
      <div className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />
      
      {/* --- PHẦN I --- */}
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

      {/* --- PHẦN II --- */}
      {qType === 'true-false' && (
        <div className="space-y-3">
          {(q.s || q.o || []).map((sub: any, sIdx: number) => {
            const subLabel = String.fromCharCode(65 + sIdx);
            const content = typeof sub === 'string' ? sub : (sub.text || "");
            return (
              <div key={sIdx} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-800 rounded-2xl bg-slate-800/30 gap-4">
                <div className="flex-1 text-slate-200 font-bold">
                  <span className="text-emerald-500 mr-2">{subLabel}.</span>
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

      {/* --- PHẦN III --- */}
      {(qType === 'sa' || qType === 'short-answer') && (
        <div className="mt-4 p-6 bg-slate-800/50 rounded-[2rem] border-2 border-slate-700 flex flex-col md:flex-row items-center gap-4">
          <span className="font-black text-emerald-400 shrink-0">ĐÁP ÁN:</span>
          <input type="text" className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono" placeholder="Ví dụ: 6.32" value={answer || ''} onChange={(e) => onSelect(idx, e.target.value)} />
        </div>
      )}
    </div>
  );
}, (prev, next) => JSON.stringify(prev.answer) === JSON.stringify(next.answer));

export default function ExamRoom({ questions, studentInfo, duration, minSubmitTime = 0, maxTabSwitches = 3, deadline = "", onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());
  const [tabSwitches, setTabSwitches] = useState(0);

  const handleFinish = useCallback((isAuto = false) => {
    if (!isAuto) {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);
      if (timeSpent < minSubmitTime) {
        alert(`Bạn phải làm bài ít nhất ${minSubmitTime} phút. Còn ${minSubmitTime - timeSpent} phút nữa.`);
        return;
      }
    }
    alert(isAuto ? "Hệ thống tự động nộp bài!" : "Nộp bài thành công!");
    onFinish();
  }, [startTime, minSubmitTime, onFinish]);

  // Ép MathJax quét lại mỗi khi render câu hỏi hoặc chọn đáp án
  useEffect(() => {
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [questions, answers]);

  useEffect(() => {
    const handleTab = () => {
      if (document.hidden && maxTabSwitches > 0) {
        setTabSwitches(v => {
          const nextV = v + 1;
          if (nextV >= maxTabSwitches) { handleFinish(true); return nextV; }
          alert(`Cảnh báo chuyển Tab (Lần ${nextV}/${maxTabSwitches}). Vi phạm quá số lần sẽ bị nộp bài tự động!`);
          return nextV;
        });
      }
    };
    document.addEventListener("visibilitychange", handleTab);
    return () => document.removeEventListener("visibilitychange", handleTab);
  }, [maxTabSwitches, handleFinish]);

  useEffect(() => {
    if (deadline) {
      const parts = deadline.split(' ');
      const [d, m, y] = parts[0].split('/');
      const t = parts[1] || "23:59";
      if (new Date() > new Date(`${y}-${m}-${d}T${t}`)) { alert("Đề thi đã đóng!"); onFinish(); }
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <span className="text-white font-black text-lg">{studentInfo?.name}</span>
          <div className="flex gap-2">
            <span className="text-xs text-emerald-400">SBD: {studentInfo?.sbd}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${tabSwitches > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
              Tab: {tabSwitches}/{maxTabSwitches}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700 shadow-inner">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-600/20">NỘP BÀI</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => <QuestionCard key={q.id || idx} q={q} idx={idx} answer={answers[idx]} onSelect={handleSelect} />)}
      </div>
    </div>
  );
}
