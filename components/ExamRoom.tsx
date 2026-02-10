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
  studentInfo: {
    idgv: string;
    sbd: string;
    name: string;
    className: string;
    examCode: string;
  };
  // Các thông số lấy từ sheet (exams)
  settings: {
    duration: number;        // Thời gian làm bài (phút)
    minSubmitTime: number;   // Thời gian tối thiểu để nộp bài (phút)
    limitTab: number;        // Số lần chuyển tab tối đa
    closeTime: string;       // Thời gian đóng đề (Y-m-d H:i:s)
    antiLag: boolean;        // Chế độ chống lag
  };
  onFinish: (finalAnswers: any, tabViolations: number) => void;
}

const formatContent = (text: any) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('/')) clean = clean.substring(1).trim();
  return clean.replace(/\\\\/g, "\\").replace(/\\left\s+([\(\[\{])/g, "\\left$1").replace(/\\right\s+([\)\}\]])/g, "\\right$1");
};

export default function ExamRoom({ questions, studentInfo, settings, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabCount, setTabCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const startTimeRef = useRef(new Date());

  // 1. Quản lý MathJax & Chống lag
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      // Nếu bật antiLag, ta có thể delay việc render hoặc tối giản hiệu ứng
      const timeout = setTimeout(() => {
        (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
      }, settings.antiLag ? 500 : 0);
      return () => clearTimeout(timeout);
    }
  }, [questions, answers, settings.antiLag]);

  // 2. Timer & Kiểm tra thời gian nộp bài / Đóng đề
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Kiểm tra thời gian đóng đề
      if (settings.closeTime && now > new Date(settings.closeTime)) {
        clearInterval(timer);
        alert("Đã hết giờ đóng đề, hệ thống tự động nộp bài!");
        handleFinish();
      }

      setTimeLeft((prev) => {
        // Kiểm tra thời gian tối thiểu nộp bài
        const elapsedMinutes = (settings.duration * 60 - prev) / 60;
        if (elapsedMinutes >= settings.minSubmitTime) {
          setIsSubmitDisabled(false);
        }

        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  // 3. Chống gian lận: Theo dõi số lần chuyển Tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabCount(prev => {
          const newCount = prev + 1;
          if (newCount >= settings.limitTab) {
            alert(`Bạn đã chuyển tab ${newCount} lần. Vi phạm quy chế và bài sẽ bị nộp tự động!`);
            handleFinish(newCount);
          } else {
            alert(`Cảnh báo: Bạn không được rời khỏi trang làm bài! (Lần ${newCount}/${settings.limitTab})`);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [settings.limitTab]);

  const handleAnswerChange = (idx: number, value: any, subIndex?: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (typeof subIndex === 'number') {
        const currentArr = Array.isArray(prev[idx]) ? [...prev[idx]] : [null, null, null, null];
        currentArr[subIndex] = value;
        newAnswers[idx] = currentArr;
      } else {
        newAnswers[idx] = value;
      }
      return newAnswers;
    });
  };

  const handleFinish = (finalTabCount?: number) => {
    onFinish(answers, finalTabCount ?? tabCount);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 p-4 pb-40 ${settings.antiLag ? 'transition-none' : 'transition-all'}`}>
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500/40 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 font-black text-xs px-2 py-1 rounded-lg border border-emerald-500/30">SBD: {studentInfo?.sbd}</span>
            <span className="font-bold text-white">{studentInfo?.name}</span>
          </div>
          <div className="text-[10px] text-red-400 mt-1 uppercase font-bold tracking-tighter">
            Số lần rời tab: {tabCount} / {settings.limitTab}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-5 py-2 rounded-2xl border border-slate-700 shadow-inner">
            {formatTime(timeLeft)}
          </div>
          <button 
            disabled={isSubmitDisabled}
            onClick={() => handleFinish()} 
            className={`px-6 py-3 rounded-2xl font-black transition-all ${isSubmitDisabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'}`}
          >
            {isSubmitDisabled ? `Mở nộp sau ${Math.ceil(settings.minSubmitTime - (settings.duration * 60 - timeLeft)/60)}p` : 'NỘP BÀI'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-slate-900 border-2 border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-xl mb-12">
            <div className="flex items-center gap-4 mb-8">
              <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                {q.type === 'mcq' ? 'PHẦN I' : q.type === 'true-false' ? 'PHẦN II' : 'PHẦN III'}
              </span>
            </div>

            <div className="text-xl md:text-2xl leading-relaxed mb-10 font-medium text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />

            {/* PHẦN I: MCQ */}
            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 gap-4">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button key={i} onClick={() => handleAnswerChange(idx, label)} className={`p-5 rounded-3xl text-left border-2 flex items-center gap-6 ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'}`}>
                      <span className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl font-black ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
                      <div className="text-lg font-medium text-slate-200" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* PHẦN II: TRUE-FALSE */}
            {q.type === 'true-false' && q.s && (
              <div className="space-y-4">
                {q.s.map((sub, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between p-4 border border-slate-800 rounded-[1.5rem] bg-slate-800/20">
                    <div className="flex-1 pr-6 text-slate-200 text-lg">
                      <span className="font-bold text-emerald-500 mr-3">{String.fromCharCode(97 + sIdx)}.</span>
                      <span dangerouslySetInnerHTML={{ __html: formatContent(sub.text) }} />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {[{l:'Đúng', v:true, c:'bg-blue-600'}, {l:'Sai', v:false, c:'bg-red-600'}].map((btn) => {
                        const isSelected = Array.isArray(answers[idx]) && answers[idx][sIdx] === btn.v;
                        return (
                          <button key={btn.l} onClick={() => handleAnswerChange(idx, btn.v, sIdx)} className={`w-16 py-2 rounded-xl font-bold border-2 text-sm ${isSelected ? `${btn.c} border-transparent text-white` : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                            {btn.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHẦN III: SHORT ANSWER */}
            {(q.type === 'short-answer' || q.type === 'sa') && (
              <div className="mt-4 p-6 bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-700 flex flex-col md:flex-row md:items-center gap-4">
                <span className="font-black text-emerald-400">ĐÁP ÁN:</span>
                <input
                  type="text"
                  className="flex-1 bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl text-white font-bold text-xl focus:border-emerald-500 outline-none"
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
