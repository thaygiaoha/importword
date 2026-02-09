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

      {/* PHẦN II: TRUE-FALSE - Sửa lỗi không hiện nội dung các ý */}
      {q.type === 'true-false' && (
        <div className="space-y-6">
          <p className="text-sm text-slate-400 italic mb-4">* Chọn Đúng hoặc Sai cho mỗi ý sau:</p>
          {/* Nếu q.o có chứa nội dung các ý A, B, C, D từ file Word */}
          {q.o && q.o.length > 0 ? (
            q.o.map((opt: string, i: number) => {
              const subLabel = String.fromCharCode(65 + i); // A, B, C, D
              return (
                <div key={i} className="bg-slate-800/20 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <span className="font-black text-emerald-500 text-xl">{subLabel}.</span>
                    <div className="text-lg text-slate-200" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
                  </div>
                  <div className="flex gap-4 mt-2">
                    {['Đúng', 'Sai'].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const currentAnswers = answer || {};
                          onSelect(idx, { ...currentAnswers, [subLabel]: val });
                        }}
                        className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${answer?.[subLabel] === val 
                          ? (val === 'Đúng' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-red-600 border-red-400 text-white') 
                          : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                      >
                        {val.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-red-400">Thiếu dữ liệu các ý con (Kiểm tra lại mảng 'o' trong JSON)</p>
          )}
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
