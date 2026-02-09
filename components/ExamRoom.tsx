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

export default function ExamRoom({ questions, studentName, duration, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Đồng hồ đếm ngược
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
    // Sau này thầy sẽ viết hàm lưu kết quả vào GAS ở đây
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-24">
      {/* Header cố định chứa tên và đồng hồ */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/30 p-4 mb-6 flex justify-between items-center rounded-2xl shadow-xl">
        <div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Thí sinh</div>
          <div className="font-black text-white">{studentName}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Thời gian</div>
          <div className="text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
        </div>
        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40">
          NỘP BÀI
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} id={`q-${idx}`} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-black text-sm">
                {idx + 1}
              </span>
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng/Sai' : 'Tự luận ngắn'}
              </span>
            </div>

            <div className="text-base leading-relaxed mb-6 font-medium text-slate-100">
              {q.question}
            </div>

            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [idx]: label})}
                      className={`p-4 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {label}
                      </span>
                      <span className="text-sm font-semibold">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {q.type === 'sa' && (
              <input 
                type="text"
                placeholder="Nhập đáp án..."
                className="w-full p-4 rounded-xl bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 outline-none text-white font-bold"
                onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
              />
            )}
          </div>
        ))}
      </div>

      {/* Thanh điều hướng nhanh số câu hỏi bên dưới */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-3 rounded-2xl shadow-2xl flex gap-2 overflow-x-auto max-w-[95vw] no-scrollbar">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => document.getElementById(`q-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
            className={`min-w-[35px] h-9 rounded-lg font-bold text-xs transition-all ${
              answers[i] ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
