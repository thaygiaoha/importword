import React, { useState, useEffect } from 'react';

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

// HÀM QUÉT DẤU / VÀ DỌN DẸP MATHJAX
const formatContent = (text: string) => {
  if (!text) return "";
  let clean = text.toString().trim();
  
  // 1. Xóa dấu / ở đầu dòng (Lỗi do VBA nối chuỗi)
  if (clean.startsWith('/')) {
    clean = clean.substring(1).trim();
  }

  // 2. Vá lỗi MathJax Delimiter & Double Backslash
  clean = clean
    .replace(/\\\\/g, "\\") // Đưa \\ về \ đơn để MathJax nhận diện đúng
    .replace(/\\left\s+([\(\[\{])/g, "\\left$1") // Xóa dấu cách sau \left (Sửa lỗi ảnh 1, 5)
    .replace(/\\right\s+([\)\}\]])/g, "\\right$1") // Xóa dấu cách sau \right
    
    // 3. Xử lý trường hợp hệ phương trình/hàm số cho ảnh 7
    // Đảm bảo dấu { của hệ thức được hiểu đúng
    .replace(/\{\s*\\begin\{matrix\}/g, "\\begin{cases}") 
    .replace(/\\end\{matrix\}\s*\}/g, "\\end{cases}")
    
    // 4. Ép các ngoặc \left( về dạng an toàn nếu vẫn lỗi
    .replace(/\\left\s*\(/g, "(")
    .replace(/\\right\s*\)/g, ")")
    .replace(/\\left\s*\[/g, "[")
    .replace(/\\right\s*\]/g, "]")
    .replace(/\\left\s*\\\{/g, "{")
    .replace(/\\right\s*\\\}/g, "}");

  return clean;
};

export default function ExamRoom({ questions, studentInfo, duration, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());

  useEffect(() => {
    // @ts-ignore
    if (window.MathJax && window.MathJax.typesetPromise) {
      // @ts-ignore
      window.MathJax.typesetPromise().catch((err) => console.log('MathJax Error:', err));
    }
  });

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = async () => {
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const resultData = {
      timestamp: new Date().toLocaleString('vi-VN'),
      examCode: studentInfo.examCode,
      sbd: studentInfo.sbd,
      name: studentInfo.name,
      class: studentInfo.className,
      answers: JSON.stringify(answers),
      timeSpent: `${Math.floor(timeSpent / 60)} phút ${timeSpent % 60} giây`,
      idgv: studentInfo.idgv
    };
    console.log("Dữ liệu nộp bài:", resultData);
    alert(`Bài làm của ${studentInfo.name} đã được ghi nhận thành công!`);
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

        <div className="bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700">
          <div className="text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
        </div>

        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black">
          NỘP BÀI
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {questions.map((q, idx) => (
          <div key={idx} id={`q-${idx}`} className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <span className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black">{idx + 1}</span>
              <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
                {q.type === 'mcq' ? 'Phần I' : q.type === 'true-false' ? 'Phần II' : 'Phần III'}
              </span>
            </div>

            {/* CÂU HỎI - ĐÃ DỌN DẸP DẤU / */}
            <div 
              className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100"
              dangerouslySetInnerHTML={{ __html: formatContent(q.question) }}
            />

            {/* PHẦN I: MCQ */}
            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 gap-4">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [idx]: label})}
                      className={`p-6 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${answers[idx] === label ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}
                    >
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black ${answers[idx] === label ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{label}</span>
                      <div className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: formatContent(opt) }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* PHẦN II: TRUE-FALSE */}
            {q.type === 'true-false' && (
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map((sub) => (
                  <div key={sub} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <span className="font-black text-emerald-500 text-xl">{sub}.</span>
                    <div className="flex gap-2">
                      {['Đúng', 'Sai'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAnswers({...answers, [idx]: {...(answers[idx] || {}), [sub]: val}})}
                          className={`px-8 py-3 rounded-xl font-black text-sm transition-all border-2 ${answers[idx]?.[sub] === val ? (val === 'Đúng' ? 'bg-blue-600 border-blue-500' : 'bg-red-600 border-red-500') : 'bg-slate-700 border-slate-600 text-slate-400'}`}
                        >
                          {val.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHẦN III: SHORT ANSWER */}
            {q.type === 'sa' && (
              <input 
                type="text"
                placeholder="Ví dụ: 6.23"
                className="w-full p-8 rounded-3xl bg-slate-800/50 border-4 border-slate-800 focus:border-emerald-500 outline-none text-white font-black text-3xl"
                value={answers[idx] || ''}
                onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
