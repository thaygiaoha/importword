import React, { useState } from 'react';
import { DANHGIA_URL, API_ROUTING } from '../config';

interface TeacherWordTaskProps {
  onBack: () => void;
}

const TeacherWordTask: React.FC<TeacherWordTaskProps> = ({ onBack }) => {
  const [step, setStep] = useState<'verify' | 'work'>('verify');
  const [loading, setLoading] = useState(false);
  const [gvId, setGvId] = useState('');
  const [gvData, setGvData] = useState<any>(null);
  const [customLink, setCustomLink] = useState(''); // Link cho GV tự do (F2=0)
  const [jsonInput, setJsonInput] = useState(''); // Nội dung JSON bóc từ Word

  const [examForm, setExamForm] = useState({
    exams: '', fulltime: 90, mintime: 30, tab: 3, dateclose: '',
    MCQ: 12, scoremcq: 0.25,
    TF: 4, scoretf: 1.0,
    SA: 6, scoresa: 0.5
  });

  // ====== 1. Xác minh GV (Xử lý cả F2=0) ======
  const handleVerifyW = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${DANHGIA_URL}?action=checkTeacher&idgv=${gvId}`);
      const data = await res.json();
      
      const isAuthRequired = data.data?.isAuthRequired; // Ô F2

      if (isAuthRequired === false) {
        // TRƯỜNG HỢP F2 = 0: Vào luôn, hiện ô nhập Link riêng
        setGvData({ 
          name: data.status === 'success' ? data.data.name : "GV Tự do",
          link: API_ROUTING[gvId] || data.data?.link || "" 
        });
        setStep('work');
      } else if (data.status === 'success') {
        // TRƯỜNG HỢP F2 = 1: Phải có ID đúng trong hệ thống
        setGvData({ ...data.data, link: API_ROUTING[gvId] || data.data.link });
        setStep('work');
      } else {
        alert("Hệ thống yêu cầu ID chính xác! Hoặc Admin chưa mở quyền tự do.");
      }
    } catch (e) { alert("Lỗi kết nối!"); } finally { setLoading(false); }
  };

  // ====== 2. Xử lý ghi Đề thi (Gộp Config + JSON Questions) ======
  const handleUploadExamData = async () => {
    if (!examForm.exams) return alert("Thầy ơi, chưa nhập Mã đề!");
    if (!jsonInput.trim()) return alert("Thầy dán nội dung JSON bóc từ Word vào đã nhé!");

    // Ưu tiên Link riêng của GV (nếu F2=0), không có mới dùng link hệ thống
    const finalTargetUrl = customLink || gvData?.link || DANHGIA_URL;
    if (!finalTargetUrl) return alert("Thầy/Cô vui lòng dán link App Script kết nối!");

    setLoading(true);
    try {
      // Tự động lọc các block JSON { } trong ô dán
      const blocks = jsonInput.match(/\{[\s\S]*?\}/g);
      if (!blocks) throw new Error("Không tìm thấy dữ liệu JSON hợp lệ!");
      
      const questions = blocks.map(b => JSON.parse(b.replace(/[\u201C\u201D]/g, '"').replace(/'/g, '"')));

      const payload = {
        action: 'uploadExamData',
        idgv: gvId || "GUEST",
        examCode: examForm.exams,
        config: examForm, // Ghi vào sheet exams
        questions: questions // Ghi vào sheet exam_data
      };

      const res = await fetch(`${finalTargetUrl}?action=uploadExamData`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      alert(result.status === "success" ? "✅ Thành công: " + result.message : "❌ Lỗi: " + result.message);
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-indigo-700 uppercase italic">
          <i className="fas fa-file-import mr-2"></i> Nhập Đề Thi Từ JSON Word
        </h2>
        <button onClick={onBack} className="bg-red-50 text-red-500 px-6 py-2 rounded-full font-black text-xs hover:bg-red-500 hover:text-white transition-all">THOÁT</button>
      </div>

      {step === 'verify' ? (
        <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <input type="text" placeholder="ID GIÁO VIÊN..." className="w-full max-w-xs p-4 bg-white border-4 border-slate-100 rounded-2xl text-center font-black text-xl" value={gvId} onChange={e => setGvId(e.target.value)} />
          <button onClick={handleVerifyW} className="ml-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black">VÀO</button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Ô NHẬP LINK RIÊNG (Nếu GV Tự do / F2=0) */}
          {!gvData?.link && (
            <div className="bg-amber-50 p-6 rounded-[2.5rem] border-2 border-dashed border-amber-200 shadow-sm">
               <h4 className="text-sm font-black text-amber-800 uppercase mb-2"><i className="fas fa-link mr-2"></i> Kết nối riêng (F2=0)</h4>
               <input className="w-full p-4 rounded-2xl shadow-inner font-bold text-blue-700 outline-none" placeholder="Dán link App Script (exec) của thầy/cô..." value={customLink} onChange={e => setCustomLink(e.target.value)} />
            </div>
          )}

          {/* CẤU HÌNH ĐỀ THI */}
          <div className="bg-indigo-50 p-8 rounded-[3rem] grid grid-cols-2 md:grid-cols-6 gap-4 border border-indigo-100 shadow-sm">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mã đề (exams)</label>
              <input className="w-full p-3 rounded-xl shadow-inner font-bold" value={examForm.exams} onChange={e=>setExamForm({...examForm, exams: e.target.value})} placeholder="GK1_TOAN12" />
            </div>
            <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Thời gian</label><input type="number" className="w-full p-3 rounded-xl shadow-inner font-bold" value={examForm.fulltime} onChange={e=>setExamForm({...examForm, fulltime: parseInt(e.target.value)})} /></div>
            <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Tab</label><input type="number" className="w-full p-3 rounded-xl shadow-inner font-bold" value={examForm.tab} onChange={e=>setExamForm({...examForm, tab: parseInt(e.target.value)})} /></div>
            <div className="col-span-2"><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Ngày đóng</label><input type="date" className="w-full p-3 rounded-xl shadow-inner font-bold" value={examForm.dateclose} onChange={e=>setExamForm({...examForm, dateclose: e.target.value})} /></div>
          </div>

          {/* NHẬP NỘI DUNG JSON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 ml-4 uppercase">Dán JSON câu hỏi (Bóc từ Word)</label>
              <textarea 
                className="w-full h-96 p-6 bg-slate-900 text-emerald-400 rounded-[2.5rem] font-mono text-xs shadow-2xl outline-none focus:ring-4 ring-indigo-200"
                placeholder='Dán mảng JSON từ Word tại đây...'
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-center items-center bg-slate-50 rounded-[3rem] p-10 border-2 border-white shadow-inner">
               <div className="bg-white p-8 rounded-full shadow-xl mb-6">
                 <i className="fas fa-rocket text-5xl text-indigo-500 animate-bounce"></i>
               </div>
               <p className="text-center text-sm font-bold text-slate-600 mb-8 uppercase tracking-widest">
                 Kiểm tra kỹ cấu hình mã đề<br/>trước khi xác nhận ghi
               </p>
               <button 
                 onClick={handleUploadExamData}
                 disabled={loading}
                 className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
               >
                 {loading ? "ĐANG GỬI DỮ LIỆU..." : "XÁC NHẬN GHI ĐỀ THI"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWordTask;
