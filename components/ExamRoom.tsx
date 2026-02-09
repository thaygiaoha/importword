import React, { useState, useEffect } from 'react';
const ExamRoom = ({ questions, studentName, duration, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState({});

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0) { handleFinish(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = () => {
    alert("Hết giờ làm bài hoặc bạn đã nộp bài!");
    console.log("Kết quả của học sinh:", answers);
    onFinish(); // Quay lại trang chủ
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-24">
      {/* Header cố định */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/30 p-4 mb-6 flex justify-between items-center rounded-2xl shadow-xl">
        <div>
          <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Thí sinh</div>
          <div className="font-black text-white">{studentName}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-red-400 font-bold uppercase tracking-widest">Thời gian còn lại</div>
          <div className="text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
        </div>
        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
          NỘP BÀI
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {questions.map((q, idx) => (
          <div key={idx} id={`q-${idx}`} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-black shadow-lg">
                {idx + 1}
              </span>
              <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng/Sai' : 'Tự luận ngắn'}
              </span>
            </div>

            {/* Nội dung câu hỏi */}
            <div className="text-lg leading-relaxed mb-6 font-medium text-slate-100">
              {q.question}
            </div>

            {/* Các phương án trả lời */}
            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [idx]: label})}
                      className={`p-4 rounded-2xl text-left border-2 transition-all flex items-center gap-3 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700'}`}>
                        {label}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Nếu là câu Tự luận ngắn */}
            {q.type === 'sa' && (
              <input 
                type="text"
                placeholder="Nhập đáp án của bạn..."
                className="w-full p-4 rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 outline-none transition-all"
                onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
              />
            )}
          </div>
        ))}
      </div>

      {/* Thanh điều hướng nhanh dưới cùng */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-3 rounded-3xl shadow-2xl flex gap-2 overflow-x-auto max-w-[90vw]">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => document.getElementById(`q-${i}`).scrollIntoView({ behavior: 'smooth' })}
            className={`min-w-[40px] h-10 rounded-xl font-bold transition-all ${
              answers[i] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
export default ExamRoom;
