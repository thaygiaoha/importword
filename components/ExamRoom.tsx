import React, { useState, useEffect, useCallback, useRef } from 'react';
import { scoreWord } from '../scoreWord';

const formatContent = (text: string) => {
  if (!text) return "";
  let clean = text.toString().trim();
  if (clean.startsWith('{') && clean.includes('"question"')) {
    try { clean = JSON.parse(clean).question || clean; } catch (e) {}
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
  const qType = q.type?.toString().trim().toLowerCase() || "";
  return (
    <div className="bg-slate-900 border-2 border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-xl mb-10 mjx-section">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {qType === 'mcq' ? 'Phần I' : qType === 'true-false' ? 'Phần II' : 'Phần III'}
        </span>
      </div>
      <div className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100" dangerouslySetInnerHTML={{ __html: formatContent(q.question) }} />
      
      {qType === 'mcq' && q.o?.map((opt: any, i: number) => {
        const label = String.fromCharCode(65 + i);
        return (
          <button key={i} onClick={() => onSelect(idx, label)} className={`w-full p-5 mb-4 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${answer === label ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}>
            <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black ${answer === label ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
            <div className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
          </button>
        );
      })}

      {qType === 'true-false' && (q.s || q.o || []).map((sub: any, sIdx: number) => {
        const subLabel = String.fromCharCode(65 + sIdx);
        const text = typeof sub === 'string' ? sub : (sub.text || "");
        return (
          <div key={sIdx} className="flex flex-col md:flex-row md:items-center justify-between p-4 mb-3 border border-slate-800 rounded-2xl bg-slate-800/30 gap-4">
            <div className="flex-1 text-slate-200"><span className="font-bold text-emerald-500 mr-2">{subLabel}.</span><span dangerouslySetInnerHTML={{ __html: formatContent(text) }} /></div>
            <div className="flex gap-2">
              {['Đúng', 'Sai'].map(l => (
                <button key={l} onClick={() => onSelect(idx, { ...(answer || {}), [subLabel]: l })} className={`px-6 py-2 rounded-xl font-bold border-2 transition-all ${answer?.[subLabel] === l ? (l === 'Đúng' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-red-600 border-red-500 text-white') : 'bg-slate-700 border-slate-600 text-slate-400'}`}>{l}</button>
              ))}
            </div>
          </div>
        );
      })}

      {(qType === 'sa' || qType === 'short-answer') && (
        <input type="text" className="w-full bg-slate-900 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-emerald-500 outline-none text-2xl font-mono" placeholder="Nhập đáp án..." value={answer || ''} onChange={(e) => onSelect(idx, e.target.value)} />
      )}
    </div>
  );
});

export default function ExamRoom({ 
  questions, studentInfo, duration, 
  minSubmitTime = 0, maxTabSwitches = 0, 
  scoreMCQ = 0.25, scoreTF = 1.0, scoreSA = 0.5, onFinish 
}: any) {
  
  const [startTime] = useState(new Date()); 
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(Number(duration || 60) * 60);
  const [tabCount, setTabCount] = useState(0);
  
  const answersRef = useRef(answers);
  const tabCountRef = useRef(0);
  useEffect(() => { answersRef.current = answers; }, [answers]);

   // 3. RENDER MATHJAX (Để công thức không bị lỗi "trơ" mã LaTeX)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
    }
  }, [questions, answers]);


  useEffect(() => {
    triggerMathJax();
  }, [questions, answers, triggerMathJax]);

  const handleFinish = useCallback((isAuto = false) => {
    const usedSec = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const usedMin = Math.floor(usedSec / 60);

    if (!isAuto && Number(minSubmitTime) > 0 && usedMin < Number(minSubmitTime)) {
      alert(`⚠️ Cần tối thiểu ${minSubmitTime} phút mới được nộp.`);
      return;
    }

    const result = scoreWord(questions, answersRef.current, Number(scoreMCQ), Number(scoreTF), Number(scoreSA));
    onFinish({ score: result.totalScore, timeUsed: usedSec, details: result.details });
    if (isAuto) alert("Hệ thống tự động nộp bài!");
  }, [questions, startTime, minSubmitTime, scoreMCQ, scoreTF, scoreSA, onFinish]);

  // --- TAB VIOLATION LOGIC ---
  useEffect(() => {
    const limit = Number(maxTabSwitches);
    if (limit <= 0) return;

    const onTabChange = () => {
      if (document.hidden) {
        tabCountRef.current += 1;
        setTabCount(tabCountRef.current);
        if (tabCountRef.current >= limit) {
          handleFinish(true);
        } else {
          alert(`CẢNH BÁO VI PHẠM: Không được chuyển Tab (${tabCountRef.current}/${limit})!`);
        }
      }
    };
    document.addEventListener("visibilitychange", onTabChange);
    return () => document.removeEventListener("visibilitychange", onTabChange);
  }, [maxTabSwitches, handleFinish]);

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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-20 select-none">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-2xl">
        <div>
          <div className="text-white font-bold">{studentInfo?.name}</div>
          <div className="text-xs text-emerald-400 font-mono uppercase">
            TAB: {tabCount}/{maxTabSwitches} | SBD: {studentInfo?.sbd}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-black text-white bg-slate-800 px-5 py-2 rounded-xl">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <button onClick={() => handleFinish(false)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black">NỘP BÀI</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {questions.map((q: any, idx: number) => (
          <QuestionCard key={idx} q={q} idx={idx} answer={answers[idx]} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
