import React, { useState, useEffect, useRef } from 'react';


interface ExamRoomProps {
  questions: any[];
  studentInfo: any;
  settings: {
    duration: number;        
    minSubmitTime: number;   
    limitTab: number;        
    closeTime: string;       // Nhận dd/mm/yyyy từ sheet
    antiLag: boolean;
  };
  onFinish: (answers: any, violations: number) => void;
}

// Hàm chuyển đổi dd/mm/yyyy thành đối tượng Date để so sánh
const parseDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  let day, month, year;
  
  if (dateStr.includes('-')) {
    // Định dạng yyyy-mm-dd (từ input date)
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    // Định dạng dd/mm/yyyy (từ sheet thủ công)
    const parts = dateStr.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  return new Date(year, month - 1, day, 23, 59, 59);
};

const formatContent = (text: any) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('/')) clean = clean.substring(1).trim();
  return clean.replace(/\\\\/g, "\\").replace(/\\left\s+([\(\[\{])/g, "\\left$1").replace(/\\right\s+([\)\}\]])/g, "\\right$1");
};

export default function ExamRoom({ questions, studentInfo, settings, onFinish }: ExamRoomProps) {
 const { settings } = examData;

 const EXAM_DURATION = settings.duration * 60; // giây
 const MIN_TIME = settings.mintime * 60;
 const TAB_LIMIT = settings.tab;

 const CLOSE_DATE = settings.close
  ? new Date(settings.close + "T23:59:59")
  : null;

  // Khởi tạo timeLeft bằng duration mới lấy được
 const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [canSubmit, setCanSubmit] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabCount, setTabCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  useEffect(() => {
  if (CLOSE_DATE && new Date() > CLOSE_DATE) {
    alert("⛔ Đề thi đã đóng. Bạn không thể vào làm bài.");
    window.location.href = "/";
  }
}, []);

 useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timer);
        handleAutoSubmit();
        return 0;
      }

      const spent = EXAM_DURATION - prev;
      if (spent >= MIN_TIME) {
        setCanSubmit(true);
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch(() => {});
    }
  }, [questions, answers]);
const TAB_KEY = `exam_tab_${examCode}_${studentId}`;
  useEffect(() => {
  let tabCount = Number(localStorage.getItem(TAB_KEY)) || 0;

  const onBlur = () => {
    tabCount++;
    localStorage.setItem(TAB_KEY, tabCount.toString());

    if (tabCount > TAB_LIMIT) {
      alert("🚫 Bạn đã chuyển tab quá số lần cho phép!");
      handleAutoSubmit();
    }
  };

  window.addEventListener("blur", onBlur);

  return () => window.removeEventListener("blur", onBlur);
}, []);
 useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // 1. Kiểm tra khóa đề
      if (closeDate && now > closeDate) {
        clearInterval(timer);
        if (!isClosed) {
          setIsClosed(true);
          alert("Hệ thống đã khóa đề thi. Bài làm sẽ được nộp tự động!");
          handleFinish(tabCount, true);
        }
        return;
      }

      // 2. Đếm ngược (Dùng functional update để không phụ thuộc timeLeft)
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(tabCount, true);
          return 0;
        }
        
        // 3. Cập nhật nút nộp bài (Khi đã trôi qua đủ minSubmit)
        const elapsedSec = (duration * 60) - (prev - 1);
        if (elapsedSec >= minSubmit * 60) {
          setIsSubmitDisabled(false);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [closeDate, isClosed, duration, minSubmit]); // Bỏ timeLeft ra khỏi đây
 useEffect(() => {
  const handleVisibility = () => {
    // Chỉ ghi nhận vi phạm nếu bài thi đang chạy và chưa bị khóa
    if (document.hidden && !isClosed && timeLeft > 0) {
      setTabCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxTabs) {
          alert(`Vi phạm: Bạn đã chuyển tab ${newCount}/${maxTabs} lần. Hệ thống tự động nộp bài!`);
          handleFinish(newCount, true); // Nộp tự động
        } else {
          alert(`Cảnh báo: Không được rời màn hình thi! (${newCount}/${maxTabs})`);
        }
        return newCount;
      });
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}, [maxTabs, isClosed, timeLeft]);

  const handleAnswerChange = (idx: number, value: any, subIndex?: number) => {
    if (isClosed) return;
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

 const handleFinish = (finalTabs?: number, auto?: boolean) => {
  if (!auto) {
    // Kiểm tra thời gian tối thiểu khi nộp thủ công
    const elapsedSec = (duration * 60) - timeLeft;
    if (elapsedSec < minSubmit * 60) {
      const waitMin = Math.ceil((minSubmit * 60 - elapsedSec) / 60);
      alert(`Chưa đủ thời gian nộp bài theo quy định. Vui lòng làm thêm ít nhất ${waitMin} phút.`);
      return;
    }

    if (!window.confirm("Bạn muốn nộp bài?")) return;
  }
  
  // Gửi kết quả
  onFinish(answers, finalTabs ?? tabCount);
};
  const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500/40 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] px-2 py-1 rounded-lg border border-emerald-500/30">SBD: {studentInfo?.sbd}</span>
            <span className="font-bold text-white text-sm">{studentInfo?.name}</span>
          </div>
          <div className="text-[10px] text-red-400 mt-1 font-bold">LỖI TAB: {tabCount}/{maxTabs}</div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xl font-mono font-black text-white bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">{formatTime(timeLeft)}</div>
         <button
  disabled={!canSubmit}
  onClick={handleSubmit}
>
  Nộp bài
</button>

        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-slate-900 border-2 border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-xl mb-10">
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
                {q.o.map((opt: any, i: number) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button key={i} onClick={() => handleAnswerChange(idx, label)} className={`p-5 rounded-3xl text-left border-2 flex items-center gap-6 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'}`}>
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
                {q.s.map((sub: any, sIdx: number) => (
                  <div key={sIdx} className="flex items-center justify-between p-4 border border-slate-800 rounded-[1.5rem] bg-slate-800/20">
                    <div className="flex-1 pr-6 text-slate-200 text-lg">
                      <span className="font-bold text-emerald-500 mr-3">{String.fromCharCode(97 + sIdx)}.</span>
                      <span dangerouslySetInnerHTML={{ __html: formatContent(sub.text) }} />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {[{l:'Đúng', v:true, c:'bg-blue-600'}, {l:'Sai', v:false, c:'bg-red-600'}].map((btn) => {
                        const isSelected = Array.isArray(answers[idx]) && answers[idx][sIdx] === btn.v;
                        return (
                          <button key={btn.l} onClick={() => handleAnswerChange(idx, btn.v, sIdx)} className={`w-16 py-2 rounded-xl font-bold border-2 text-sm transition-all ${isSelected ? `${btn.c} border-transparent text-white shadow-lg` : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
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
                <span className="font-black text-emerald-400 tracking-wider">ĐÁP ÁN:</span>
                <input
                  type="text"
                  className="flex-1 bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl text-white font-bold text-xl focus:border-emerald-500 outline-none transition-all"
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
