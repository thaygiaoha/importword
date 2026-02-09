import React, { useState, useEffect, useCallback } from 'react';

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
  minSubmitTime: number; // Phút
  maxTabSwitches: number; // Lần
  deadline: string;       // Dạng dd/mm/yyyy hh:mm
  onFinish: () => void;
}

const formatContent = (text: string) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('/')) clean = clean.substring(1).trim();
  
  return clean
    .replace(/\\\\/g, "\\")
    .replace(/\\left\s+([\(\[\{])/g, "\\left$1")
    .replace(/\\right\s+([\)\}\]])/g, "\\right$1")
    .replace(/\{\s*\\begin\{matrix\}/g, "\\begin{cases}") 
    .replace(/\\end\{matrix\}\s*\}/g, "\\end{cases}")
    .replace(/\\left\s*\(/g, "(")
    .replace(/\\right\s*\)/g, ")")
    .replace(/\\left\s*\[/g, "[")
    .replace(/\\right\s*\]/g, "]")
    .replace(/\\left\s*\\\{/g, "{")
    .replace(/\\right\s*\\\}/g, "}");
};

const QuestionCard = React.memo(({ q, idx, answer, onSelect }: any) => {
  const qType = q.type ? q.type.toString().trim().toLowerCase() : "";

  return (
    <div id={`q-${idx}`} className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden mb-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {qType === 'mcq' ? 'Phần I' : (qType === 'true-false' ? 'Phần II' : 'Phần III')}
        </span>
      </div>

      <div 
        className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100"
        dangerouslySetInnerHTML={{ __html: formatContent(q.question) }}
      />

      {qType === 'mcq' && q.o && (
        <div className="grid grid-cols-1 gap-4">
          {q.o.map((opt: any, i: number) => {
            const label = String.fromCharCode(65 + i);
            const isSelected = answer === label;
            return (
              <button
                key={i}
                onClick={() => onSelect(idx, label)}
                className={`p-5 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}
              >
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
                      <button
                        key={label}
                        onClick={() => {
                          const newSubAns = { ...(answer || {}), [subLabel]: label };
                          onSelect(idx, newSubAns);
                        }}
                        className={`px-6 py-2 rounded-xl font-bold border-2 transition-all ${isSelected ? (label === 'Đúng' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-red-600 border-red-500 text-white') : 'bg-slate-700 border-slate-600 text-slate-400'}`}
                      >
                        {label}
                      </button>
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
          <input
            type="text"
            className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono"
            placeholder="Ví dụ: 6.32"
            value={answer || ''}
            onChange={(e) => onSelect(idx, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}, (prev, next) => JSON.stringify(prev.answer) === JSON.stringify(next.answer));

export default function ExamRoom({ questions, studentInfo, duration, minSubmitTime, maxTabSwitches, deadline, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());
  const [tabSwitches, setTabSwitches] = useState(0);

  // Xử lý nộp bài
  const handleFinish = useCallback(async (isAutoSubmit = false) => {
    const endTime = new Date();
    const timeSpentSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const minSubmitSeconds = (minSubmitTime || 0) * 60;

    if (!isAutoSubmit && timeSpentSeconds < minSubmitSeconds) {
      alert(`Chưa thể nộp bài! Bạn cần làm bài tối thiểu ${minSubmitTime} phút (Còn ${Math.ceil((minSubmitSeconds - timeSpentSeconds)/60)} phút nữa).`);
      return;
    }

    alert(isAutoSubmit ? "Hệ thống đã tự động nộp bài do vi phạm!" : "Bài làm đã được nộp thành công!");
    onFinish();
  }, [startTime, minSubmitTime, onFinish]);

  // Hạn chế chuyển Tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= maxTabSwitches) {
            handleFinish(true);
            return newCount;
          }
          alert(`Cảnh báo: Không rời tab! (Lần ${newCount}/${maxTabSwitches})`);
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [maxTabSwitches, handleFinish]);

  // Kiểm tra Hạn đóng đề (dd/mm/yyyy)
  useEffect(() => {
    if (!deadline) return;
    const [datePart, timePart] = deadline.split(' ');
    const [d, m, y] = datePart.split('/');
    const closeDate = new Date(`${y}-${m}-${d}T${timePart || '23:59:50'}`);
    
    if (new Date() > closeDate) {
      alert("Đề thi đã đóng vào lúc: " + deadline);
      onFinish();
    }
  }, [deadline, onFinish]);

  // MathJax & Timer
  useEffect(() => {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
  }, [questions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish]);

  const handleSelect = useCallback((idx: number, value: any) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex flex-wrap justify-between items-center rounded-3xl shadow-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400 font-bold text-xs">SBD: {studentInfo.sbd}</div>
          <div className="font-black text-white">{studentInfo.name}</div>
        </div>
        
        <div className="flex items-center gap-4">
          {maxTabSwitches > 0 && (
            <div className={`px-4 py-2 rounded-xl border font-bold text-xs ${tabSwitches > 0 ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              TAB: {tabSwitches}/{maxTabSwitches}
            </div>
          )}
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-6 py-2 rounded-2xl shadow-inner border border-slate-700">{formatTime(timeLeft)}</div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-600/20">NỘP BÀI</button>
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
