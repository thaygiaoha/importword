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
     {q.type === 'true-false' && (
  <div className="space-y-3 mt-4">
    {q.s && q.s.map((sub: any, sIdx: number) => (
      <div key={sIdx} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
        <div className="flex-1 pr-4 text-gray-800">
          <span className="font-bold mr-2">{String.fromCharCode(97 + sIdx)}.</span>
          <span dangerouslySetInnerHTML={{ __html: sub.text }} />
        </div>
        <div className="flex gap-2">
          {['Đúng', 'Sai'].map((label) => {
            const val = label === 'Đúng';
            const isSelected = answers[q.id] && answers[q.id][sIdx] === val;
            return (
              <button
                key={label}
                onClick={() => handleAnswerChange(q.id, val, sIdx)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-all ${
                  isSelected 
                    ? 'bg-green-600 text-white border-green-600 shadow-inner' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400'
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
  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
    <div className="flex items-center gap-3">
      <span className="font-medium text-blue-800">Đáp án:</span>
      <input
        type="text"
        className="flex-1 max-w-[200px] p-2 border-2 border-blue-300 rounded focus:border-blue-500 focus:ring-0 outline-none"
        placeholder="Nhập kết quả..."
        value={answers[q.id] || ''}
        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
      />
    </div>
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
  // Thêm dòng này nếu chưa có  

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
  const handleAnswerChange = (questionId: string, value: any, subIndex?: number) => {
  setAnswers(prev => {
    // Nếu là câu hỏi Đúng/Sai (Phần II)
    if (typeof subIndex === 'number') {
      const currentArr = Array.isArray(prev[questionId]) 
        ? [...prev[questionId]] 
        : [null, null, null, null];
      currentArr[subIndex] = value;
      return { ...prev, [questionId]: currentArr };
    }
    // Nếu là câu hỏi trắc nghiệm hoặc điền số (Phần I, III)
    return { ...prev, [questionId]: value };
  });
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
