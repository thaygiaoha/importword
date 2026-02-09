import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'sa'; 
  question: string;
  o?: string[];
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
  onFinish: () => void;
}

// 1. HÀM DỌN DẸP NỘI DUNG (GIỮ LẠI PHÒNG THỦ)
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
const handleAnswerChange = (questionId: string, value: any, subIndex?: number) => {
  setAnswers(prev => {
    if (typeof subIndex === 'number') {
      // Xử lý Phần II (Đúng/Sai)
      const currentArr = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [null, null, null, null];
      currentArr[subIndex] = value;
      return { ...prev, [questionId]: currentArr };
    }
    // Xử lý Phần I và III
    return { ...prev, [questionId]: value };
  });
};
// 2. COMPONENT CON CHO TỪNG CÂU HỎI (CHỐNG LAG)
const QuestionCard = React.memo(({ q, idx, answer, onSelect }: any) => {
  console.log(`Render câu: ${idx + 1}`); // Thầy xem log sẽ thấy chỉ câu nào chọn mới hiện log này
  
  return (
    <div id={`q-${idx}`} className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden mb-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
        <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
          {q.type === 'mcq' ? 'Phần I' : q.type === 'true-false' ? 'Phần II' : 'Phần III'}
        </span>
      </div>

      <div 
        className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100"
        dangerouslySetInnerHTML={{ __html: formatContent(q.question) }}
      />

     {/* PHẦN I: MCQ - Giữ nguyên vì đã chạy tốt */}
      {q.type === 'mcq' && q.o && (
        <div className="grid grid-cols-1 gap-4">
          {q.o.map((opt: string, i: number) => {
            const label = String.fromCharCode(65 + i);
            return (
              <button
                key={i}
                onClick={() => onSelect(idx, label)}
                className={`p-6 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${answer === label ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}
              >
                <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black ${answer === label ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
                <div className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
              </button>
            );
          })}
        </div>
      )}

      {/* PHẦN II: TRUE-FALSE - Đã chỉnh theo mảng 's' */}
     // Trong hàm render câu hỏi, phần type === 'true-false'
{q.type === 'true-false' && (
  <div className="space-y-4 mt-4">
    {q.s.map((sub, sIdx) => (
      <div key={sIdx} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
        <div className="flex-1 mr-4">
          <span className="font-medium mr-2">{String.fromCharCode(97 + sIdx)}.</span>
          <span dangerouslySetInnerHTML={{ __html: sub.text }} />
        </div>
        <div className="flex gap-2 shrink-0">
          {['Đúng', 'Sai'].map((label) => {
            const isSelected = answers[q.id]?.[sIdx] === (label === 'Đúng');
            return (
              <button
                key={label}
                onClick={() => handleAnswerChange(q.id, label === 'Đúng', sIdx)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}
      {/* PHẦN III: SHORT ANSWER - Chỉnh lại Input */}
      {q.type === 'short-answer' && (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Đáp án của bạn:
    </label>
    <input
      type="text"
      className="w-full max-w-xs p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      placeholder="Nhập kết quả..."
      value={answers[q.id] || ''}
      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
    />
    <p className="mt-2 text-xs text-gray-500 italic">
      * Lưu ý: Nhập số thập phân dùng dấu phẩy hoặc dấu chấm theo yêu cầu đề bài.
    </p>
  </div>
)}

      {/* PHẦN III: SHORT ANSWER - Ô nhập đáp án "xịn" */}
      {q.type === 'sa' && (
        <div className="bg-slate-800/30 p-8 rounded-[2rem] border-2 border-dashed border-slate-700">
          <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Đáp án của bạn:</label>
          <input 
            type="text"
            placeholder="Gõ câu trả lời vào đây..."
            className="w-full bg-transparent border-b-4 border-slate-700 focus:border-emerald-500 outline-none text-white font-black text-4xl py-4 transition-all"
            value={answer || ''}
            onChange={(e) => onSelect(idx, e.target.value)}
          />
          <p className="mt-4 text-slate-500 text-sm italic">Lưu ý: Nhập số thập phân dùng dấu phẩy hoặc dấu chấm theo yêu cầu đề bài.</p>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Chỉ vẽ lại nếu đáp án của câu này thay đổi thực sự
  return JSON.stringify(prev.answer) === JSON.stringify(next.answer);
});

// 3. COMPONENT CHÍNH
export default function ExamRoom({ questions, studentInfo, duration, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());

  // Chỉ chạy MathJax khi load đề xong
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [questions]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
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
  }, []);

  // Hàm chọn đáp án tối ưu
  const handleSelect = useCallback((idx: number, value: any) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = async () => {
    alert(`Bài làm của ${studentInfo.name} đã được nộp!`);
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      {/* HEADER CỐ ĐỊNH */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 font-black text-xs">SBD: {studentInfo.sbd}</div>
          <div className="font-black text-white">{studentInfo.name}</div>
        </div>
        <div className="text-2xl font-mono font-black text-white bg-slate-800 px-6 py-2 rounded-2xl">{formatTime(timeLeft)}</div>
        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black">NỘP BÀI</button>
      </div>

      <div className="max-w-4xl mx-auto">
        {questions.map((q, idx) => (
          <QuestionCard 
            key={q.id || idx} 
            q={q} 
            idx={idx} 
            answer={answers[idx]} 
            onSelect={handleSelect} 
          />
        ))}
      </div>
    </div>
  );
}
