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
  studentInfo: {
    idgv: string;
    sbd: string;
    name: string;
    className: string;
    examCode: string;
  };
  duration: number; // Đơn vị: Phút
  onFinish: () => void;
}

const cleanMath = (text: string) => {
  if (!text) return "";
  return text.replace(/\\text\{\/\}/g, "/").replace(/\\left\( P \\right\)/g, "(P)");
};

export default function ExamRoom({ questions, studentInfo, duration, onFinish }: ExamRoomProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(new Date());

  // Tự động render MathJax
  useEffect(() => {
    // @ts-ignore
    if (window.MathJax && window.MathJax.typesetPromise) {
      // @ts-ignore
      window.MathJax.typesetPromise().catch((err) => console.log(err));
    }
  });

  // Đồng hồ đếm ngược
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
    
    // Tạo object kết quả để đẩy lên Sheets
    const resultData = {
      timestamp: new Date().toLocaleString('vi-VN'),
      examCode: studentInfo.examCode,
      sbd: studentInfo.sbd,
      name: studentInfo.name,
      class: studentInfo.className,
      answers: JSON.stringify(answers), // Lưu toàn bộ chuỗi đáp án
      timeSpent: `${Math.floor(timeSpent / 60)} phút ${timeSpent % 60} giây`,
      idgv: studentInfo.idgv
    };

    console.log("Dữ liệu nộp bài:", resultData);
    alert(`Chúc mừng ${studentInfo.name}! Bài làm đã được gửi thành công.`);
    
    // Ở đây thầy sẽ gọi API fetch để lưu vào Sheet(ketqua)
    // fetch(scriptURL, { method: 'POST', body: JSON.stringify(resultData) })

    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-40">
      {/* HEADER CỐ ĐỊNH */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b-2 border-emerald-500/30 p-4 mb-8 flex justify-between items-center rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 font-black text-xs">
             SBD: {studentInfo.sbd}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Thí sinh</div>
            <div className="font-black text-white leading-none">{studentInfo.name}</div>
          </div>
        </div>

        <div className="text-center bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700">
          <div className="text-[10px] text-red-400 font-black uppercase tracking-widest">Thời gian còn lại</div>
          <div className={`text-2xl font-mono font-black ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95">
          NỘP BÀI
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {questions.map((q, idx) => (
          <div key={idx} id={`q-${idx}`} className="bg-slate-900 border-2 border-slate-800 p-8 md:p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <span className="bg-emerald-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl">
                {idx + 1}
              </span>
              <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest bg-slate-800 px-4 py-1 rounded-full">
                {q.type === 'mcq' ? 'Phần I' : q.type === 'tf' ? 'Phần II' : 'Phần III'}
              </span>
            </div>

            {/* CÂU HỎI */}
            <div 
              className="text-xl md:text-2xl leading-relaxed mb-10 font-bold text-slate-100"
              dangerouslySetInnerHTML={{ __html: cleanMath(q.question) }}
            />

            {/* PHẦN I: TRẮC NGHIỆM LỰA CHỌN */}
            {q.type === 'mcq' && q.o && (
              <div className="grid grid-cols-1 gap-4">
                {q.o.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const isSelected = answers[idx] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [idx]: label})}
                      className={`p-6 rounded-3xl text-left border-2 transition-all flex items-center gap-6 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {label}
                      </span>
                      <div className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: cleanMath(opt) }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* PHẦN II: ĐÚNG SAI */}
            {q.type === 'tf' && (
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map((sub) => (
                  <div key={sub} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <span className="font-black text-emerald-500 text-xl">{sub}.</span>
                    <div className="flex gap-2">
                      {['Đúng', 'Sai'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAnswers({...answers, [idx]: {...(answers[idx] || {}), [sub]: val}})}
                          className={`px-8 py-3 rounded-xl font-black text-sm transition-all border-2 ${
                            answers[idx]?.[sub] === val 
                            ? (val === 'Đúng' ? 'bg-blue-600 border-blue-500' : 'bg-red-600 border-red-500') 
                            : 'bg-slate-700 border-slate-600 text-slate-400'
                          }`}
                        >
                          {val.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHẦN III: TRẢ LỜI NGẮN */}
            {q.type === 'sa' && (
              <div className="mt-4">
                <input 
                  type="text"
                  placeholder="Gợi ý: Dùng dấu chấm(.) cho số thập phân. Ví dụ: 6.23"
                  className="w-full p-8 rounded-3xl bg-slate-800/50 border-4 border-slate-800 focus:border-emerald-500 outline-none text-white font-black text-3xl transition-all"
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* THANH ĐIỀU HƯỚNG CÂU HỎI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-700 p-4 rounded-[2.5rem] shadow-2xl flex gap-3 overflow-x-auto max-w-[95vw] no-scrollbar">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => document.getElementById(`q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className={`min-w-[50px] h-12 rounded-2xl font-black text-sm transition-all ${
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
