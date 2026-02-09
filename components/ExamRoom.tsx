import React, { useState, useEffect, useCallback } from 'react';

interface Question {
  id: string;
  type: string; 
  question: string;
  o?: string[];
  s?: any[];
  a?: string;
}

interface ExamRoomProps {
  questions: Question[];
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

// --- PHẢI CÓ COMPONENT NÀY ĐỂ KHÔNG BỊ TRẮNG TRANG ---
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

      {(qType === 'sa' || qType === 'short-answer') && (
        <div className="mt-4 p-6 bg-slate-800/50 rounded-[2rem] border-2 border-slate-700 flex flex-col md:flex-row items-center gap-4">
          <span className="font-black text-emerald-400 shrink-0">ĐÁP ÁN:</span>
          <input type="text" className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono" placeholder="Ví dụ: 6.32" value={answer || ''} onChange={(e) => onSelect(idx, e.target.value)} />
        </div>
      )}
    </div>
  );
}, (prev, next) => JSON.stringify(prev.answer) === JSON.stringify(next.answer));

// --- COMPONENT CHÍNH ---
export default function ExamRoom({ 
  questions, studentInfo, duration, 
  minSubmitTime = 0, maxTabSwitches = 0, deadline = "", 
  onFinish 
}: ExamRoomProps) {
  
  // ÉP KIỂU SỐ TUYỆT ĐỐI (Fix lỗi minitime/tab không chuẩn do nhận String từ Sheets)
  const minTimeConst = Number(minSubmitTime) || 0;
  const maxTabConst = Number(maxTabSwitches) || 999;

  const [timeLeft, setTimeLeft] = useState(Number(duration) * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now());

  const handleFinish = useCallback((isAuto = false) => {
    if (!isAuto) {
      const timeSpentMin = (Date.now() - startTime) / 60000;
      if (timeSpentMin < minTimeConst) {
        alert(`CHƯA ĐỦ THỜI GIAN! \nBạn mới làm được ${Math.floor(timeSpentMin)} phút. Cần tối thiểu ${minTimeConst} phút mới được nộp.`);
        return;
      }
    }
    alert(isAuto ? "HỆ THỐNG TỰ ĐỘNG NỘP BÀI!" : "Nộp bài thành công!");
    onFinish();
  }, [startTime, minTimeConst, onFinish]);

  // Tab Switch - Chốt chặn cứng
  useEffect(() => {
    const handleTab = () => {
      if (document.hidden && maxTabConst > 0) {
        setTabSwitches(prev => {
          const currentViolation = prev + 1;
          if (currentViolation >= maxTabConst) {
            handleFinish(true);
            return currentViolation;
          }
          alert(`CẢNH BÁO: Không rời Tab! \nLần vi phạm: ${currentViolation}/${maxTabConst}`);
          return currentViolation;
        });
      }
    };
    document.addEventListener("visibilitychange", handleTab);
    return () => document.removeEventListener("visibilitychange", handleTab);
  }, [maxTabConst, handleFinish]);

  // Deadline & Timer logic (giữ nguyên)
  useEffect(() => {
    if (!deadline) return;
    const checkDeadline = () => {
      const parts = deadline.split(' ');
      const [d, m, y] = parts[0].split('/');
      const t = parts[1] || "23:59";
      if (new Date() > new Date(`${y}-${m}-${d}T${t}`)) { onFinish(); }
    };
    const dlTimer = setInterval(checkDeadline, 30000);
    return () => clearInterval(dlTimer);
  }, [deadline, onFinish]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(v => {
        if (v <= 1) { clearInterval(timer); handleFinish(true); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish]);

  const handleSelect = useCallback((idx: number, val: any) => {
    setAnswers(p => ({ ...p, [idx]: val }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40 font-sans">
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex flex-col">
          <span className="text-white font-black text-lg">{studentInfo?.name}</span>
          <div className="flex gap-2">
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono uppercase tracking-tighter">SBD: {studentInfo?.sbd}</span>
            {maxTabConst < 999 && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tabSwitches >= maxTabConst - 1 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                TAB: {tabSwitches}/{maxTabConst}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-5 py-2 rounded-2xl border border-slate-700">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all active:scale-90 shadow-lg shadow-emerald-600/20">
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
