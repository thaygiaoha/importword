import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Question {
  id: string;
  type: string; 
  question: string;
  o?: string[];
  s?: { text: string; a: boolean }[];
  a?: string;
}

interface ExamRoomProps {
  questions: Question[];
  studentInfo: any;
  duration?: number; // Cho phép nhận trực tiếp hoặc qua settings
  settings?: {
    duration: number;
    minSubmitTime: number;
    limitTab: number;
    closeTime: string;
    antiLag: boolean;
  };
  onFinish: (answers: any, violations: number) => void;
}

const formatContent = (text: any) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('/')) clean = clean.substring(1).trim();
  return clean.replace(/\\\\/g, "\\").replace(/\\left\s+([\(\[\{])/g, "\\left$1").replace(/\\right\s+([\)\}\]])/g, "\\right$1");
};

export default function ExamRoom({ questions, studentInfo, duration, settings, onFinish }: ExamRoomProps) {
  // Ưu tiên lấy từ settings, nếu không có thì lấy từ duration, cuối cùng là mặc định 40p
  const finalDuration = settings?.duration || duration || 40;
  const minSubmit = settings?.minSubmitTime || 0;
  const maxTabs = settings?.limitTab || 999;
  const isAntiLag = settings?.antiLag || false;

  const [timeLeft, setTimeLeft] = useState(finalDuration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabCount, setTabCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(minSubmit > 0);

  // 1. MathJax & Chống lag
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      const timeout = setTimeout(() => {
        (window as any).MathJax.typesetPromise().catch(() => {});
      }, isAntiLag ? 600 : 100);
      return () => clearTimeout(timeout);
    }
  }, [questions, answers, isAntiLag]);

  // 2. Timer & Logic nộp bài
  useEffect(() => {
    const timer = setInterval(() => {
      // Kiểm tra thời gian tối thiểu nộp bài
      const elapsedSec = (finalDuration * 60) - (timeLeft - 1);
      if (elapsedSec >= minSubmit * 60) {
        setIsSubmitDisabled(false);
      }

      // Kiểm tra đóng đề (nếu có settings.closeTime)
      if (settings?.closeTime) {
        if (new Date() > new Date(settings.closeTime)) {
          clearInterval(timer);
          alert("Hết giờ đóng đề!");
          handleFinish();
        }
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 3. Theo dõi chuyển Tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxTabs) {
            alert("Vi phạm số lần chuyển Tab. Hệ thống tự động nộp bài!");
            handleFinish(newCount);
          } else {
            alert(`Cảnh báo chuyển Tab (${newCount}/${maxTabs})`);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [maxTabs]);

  const handleAnswerChange = (idx: number, value: any, subIndex?: number) => {
    setAnswers(prev => {
      const news = { ...prev };
      if (typeof subIndex === 'number') {
        const arr = Array.isArray(prev[idx]) ? [...prev[idx]] : [null, null, null, null];
        arr[subIndex] = value;
        news[idx] = arr;
      } else {
        news[idx] = value;
      }
      return news;
    });
  };

  const handleFinish = (finalTabs?: number) => {
    onFinish(answers, finalTabs ?? tabCount);
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!questions || questions.length === 0) return <div className="p-10 text-white">Đang tải...</div>;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 p-4 pb-40 ${isAntiLag ? '' : 'transition-all'}`}>
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500/40 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 font-black text-xs px-2 py-1 rounded-lg border border-emerald-500/30">SBD: {studentInfo?.sbd}</span>
            <span className="font-bold text-white uppercase">{studentInfo?.name}</span>
          </div>
          <div className="text-[9px] text-red-400 mt-1 font-bold">LỖI TAB: {tabCount}/{maxTabs}</div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xl font-mono font-black text-white bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">{formatTime(timeLeft)}</div>
          <button 
            disabled={isSubmitDisabled}
            onClick={() => handleFinish()} 
            className={`px-6 py-2 rounded-xl font-black transition-all ${isSubmitDisabled ? 'bg-slate-800 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'}`}
          >
            {isSubmitDisabled ? 'KHÓA' : 'NỘP BÀI'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-slate-900 border-2 border-slate-800 p-6 md:p-10 rounded-[2rem] shadow-xl mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-emerald-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-black">{idx + 1}</span>
              <span className="text-slate-500 font-black text-[10px] tracking-widest bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {q.type === 'mcq' ? 'PHẦN I' : q.type === 'true-false' ? 'PHẦN II' : 'PHẦN III'}
              </span>
            </div>

            <div className="text-lg md:text-xl leading-relaxed mb-8 font-medium text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />

            {/* PHẦN I */}
            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 gap-3">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button key={i} onClick={() => handleAnswerChange(idx, label)} className={`p-4 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'}`}>
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
                      <div className="text-md font-medium text-slate-200" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* PHẦN II */}
            {q.type === 'true-false' && q.s && (
              <div className="space-y-3">
                {q.s.map((sub, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-slate-800/20">
                    <div className="flex-1 pr-4 text-slate-200 text-md">
                      <span className="font-bold text-emerald-500 mr-2">{String.fromCharCode(97 + sIdx)}.</span>
                      <span dangerouslySetInnerHTML={{ __html: formatContent(sub.text) }} />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {[
                        {l:'Đúng', v:true, c:'bg-blue-600 border-blue-500'}, 
                        {l:'Sai', v:false, c:'bg-red-600 border-red-500'}
                      ].map((btn) => {
                        const isSel = Array.isArray(answers[idx]) && answers[idx][sIdx] === btn.v;
                        return (
                          <button key={btn.l} onClick={() => handleAnswerChange(idx, btn.v, sIdx)} className={`w-14 py-1.5 rounded-lg font-bold border-2 text-xs transition-all ${isSel ? `${btn.c} text-white` : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                            {btn.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHẦN III */}
            {(q.type === 'short-answer' || q.type === 'sa') && (
              <div className="mt-2 p-4 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col md:flex-row md:items-center gap-4">
                <span className="font-black text-emerald-400 text-sm">ĐÁP ÁN:</span>
                <input
                  type="text"
                  className="flex-1 bg-slate-950 border-2 border-slate-700 p-3 rounded-xl text-white font-bold focus:border-emerald-500 outline-none"
                  placeholder="Nhập kết quả..."
                  value={answers[idx] || ''}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
