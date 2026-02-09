import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  type: 'mcq' | 'tf' | 'sa';
  question: string;
  o?: string[];
  a?: string;
}

interface ExamRoomProps {
  questions: Question[];
  studentName: string;
  duration: number;
  onFinish: () => void;
}

// Hàm dọn rác LaTeX để hiển thị MathJax mượt hơn
const cleanMath = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\\text\{\/\}/g, "/")
    .replace(/\\left\( P \\right\)/g, "(P)")
    .replace(/\\left\( Q \\right\)/g, "(Q)");
};

export default function ExamRoom({ questions, studentName, duration, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // 1. Logic Render lại MathJax khi có thay đổi
  useEffect(() => {
    // @ts-ignore
    if (window.MathJax && window.MathJax.typesetPromise) {
      // @ts-ignore
      window.MathJax.typesetPromise().catch((err: any) => console.log('MathJax error:', err));
    }
  }); // Chạy sau mỗi lần component re-render

  // 2. Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = () => {
    alert("Hệ thống ghi nhận kết quả bài thi của bạn!");
    console.log("Đáp án của học sinh:", answers);
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-32">
      {/* Header cố định chứa tên và đồng hồ */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/30 p-4 mb-6 flex justify-between items-center rounded-2xl shadow-xl">
        <div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Thí sinh</div>
          <div className="font-black text-white">{studentName}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Thời gian còn lại</div>
          <div className="text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
        </div>
        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40">
          NỘP BÀI
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {questions.map((q, idx) => (
          <div key={idx} id={`q-${idx}`} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-2xl font-black text-lg">
                {idx + 1}
              </span>
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest bg-slate-800 px-3 py-1 rounded-full">
                {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng/Sai' : 'Tự luận ngắn'}
              </span>
            </div>

            {/* Nội dung câu hỏi hỗ trợ HTML (Hình ảnh) và MathJax */}
            <div 
              className="text-lg md:text-xl leading-relaxed mb-8 font-medium text-slate-100 mathjax-content"
              dangerouslySetInnerHTML={{ __html: cleanMath(q.question) }}
            />

            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [idx]: label})}
                      className={`p-5 rounded-2xl text-left border-2 transition-all flex items-center gap-4 group ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-sm transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                        {label}
                      </span>
                      <div 
                        className="text-base font-semibold"
                        dangerouslySetInnerHTML={{ __html: cleanMath(opt) }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            
            {q.type === 'sa' && (
              <div className="mt-4">
                <input 
                  type="text"
                  placeholder="Nhập câu trả lời của bạn vào đây..."
                  className="w-full p-5 rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 outline-none text-white font-bold text-lg transition-all"
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Thanh điều hướng nhanh - Style hiện đại */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-[2rem] shadow-2xl flex gap-3 overflow-x-auto max-w-[95vw] no-scrollbar">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => document.getElementById(`q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className={`min-w-[40px] h-10 rounded-xl font-black text-sm transition-all transform active:scale-90 ${
              answers[i] ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
