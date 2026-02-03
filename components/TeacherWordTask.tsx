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
  const [customLink, setCustomLink] = useState('');
  const [jsonInput, setJsonInput] = useState(''); // Ô nhập JSON bóc từ Word

  const [examForm, setExamForm] = useState({
    exams: '', fulltime: 90, mintime: 30, tab: 3, dateclose: '',
    MCQ: 12, scoremcq: 0.25,
    TF: 4, scoretf: 1.0,
    SA: 6, scoresa: 0.5
  });

  // ====== 1. Xác minh GV Word (Giữ nguyên logic cũ) ======
  const handleVerifyW = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${DANHGIA_URL}?action=checkTeacher&idgv=${gvId}`);
      const data = await res.json();
      const isAuthRequired = data.data.isAuthRequired;

      if (isAuthRequired === false) {
        setGvData({
          name: data.status === 'success' ? data.data.name : "GV Tự do",
          link: API_ROUTING[gvId] || data.data.link || ""
        });
        setStep('work');
      } else if (data.status === 'success') {
        setGvData({ ...data.data, link: API_ROUTING[gvId] || data.data.link });
        setStep('work');
      } else {
        alert("Hệ thống yêu cầu xác minh ID chính xác!");
      }
    } catch (e) { alert("Lỗi kết nối!"); } finally { setLoading(false); }
  };

  // ======= 2. Ghi cấu hình Exams (Giữ nguyên logic cũ) =======
  const handleSaveConfig = async () => {
    if (!examForm.exams) return alert("Vui lòng nhập mã đề!");
    const targetUrl = customLink || gvData?.link || DANHGIA_URL;
    if (!targetUrl) return alert("Thầy ơi, dán link App Script vào đã nhé!");

    const confirmSave = window.confirm(`Lưu cấu hình mã đề [${examForm.exams}]?`);
    if (!confirmSave) return;

    setLoading(true);
    try {
      const res = await fetch(`${targetUrl}?action=saveExamConfig&idgv=${gvId || "GUEST"}`, {
        method: 'POST',
        body: JSON.stringify(examForm)
      });
      alert("✅ Đã lưu cấu hình đề: " + examForm.exams);
    } catch (e) { alert("Lỗi kết nối!"); } finally { setLoading(false); }
  };

  // ======= 3. Ghi dữ liệu câu hỏi (JSON Mode) =======
  const handleUploadJsonData = async () => {
  if (!examForm.exams) return alert("Nhập Mã đề trước thầy ơi!");
  if (!jsonInput.trim()) return alert("Dán dữ liệu vào đã!");

  const targetUrl = customLink || gvData?.link || DANHGIA_URL;
  setLoading(true);
  try {
    let rawData = jsonInput.trim();

    // 1. Xử lý trường hợp lồng mảng [[...]] do copy thừa
    if (rawData.startsWith('[[')) {
      rawData = rawData.replace(/^\[\s*\[/, '[').replace(/\]\s*\]$/, ']');
    }

    // 2. PHÙ PHÉP: Biến Object Javascript thành JSON chuẩn
    // Tự động thêm dấu ngoặc kép cho key: id, classTag, part, type, question, o, a, s...
    const fixedJson = rawData
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') 
      .replace(/[\u201C\u201D]/g, '"') // Sửa ngoặc kép "thông minh" từ Word
      .replace(/[\u2018\u2019]/g, "'") // Sửa ngoặc đơn "thông minh"
      .replace(/ /g, ' '); // Xóa khoảng trắng lạ (non-breaking space) thường gặp ở Word

    const questions = JSON.parse(fixedJson);
    const questionArray = Array.isArray(questions) ? questions : [questions];

    const payload = {
      action: 'uploadExamData',
      idgv: gvId || "GUEST",
      examCode: examForm.exams,
      questions: questionArray
    };

    const res = await fetch(`${targetUrl}?action=uploadExamData`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    alert(result.status === "success" ? "✅ " + result.message : "❌ Lỗi: " + result.message);
    if(result.status === "success") setJsonInput('');

  } catch (e: any) { 
    console.error("Lỗi nội dung:", e);
    alert("❌ Lỗi định dạng! Thầy kiểm tra xem có quên dấu phẩy giữa các câu không nhé."); 
  } finally { setLoading(false); }
};

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-indigo-700 uppercase">Nhập Đề Thi (JSON)</h2>
        <button onClick={onBack} className="bg-red-50 text-red-600 px-8 py-2 rounded-full font-black hover:bg-red-600 hover:text-white transition-all">THOÁT</button>
      </div>

      {step === 'verify' ? (
        <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <input type="text" placeholder="ID GIÁO VIÊN..." className="w-full max-w-md p-5 rounded-2xl text-center font-black text-2xl uppercase border-4 border-white shadow-sm" value={gvId} onChange={e => setGvId(e.target.value)} />
          <button onClick={handleVerifyW} disabled={loading} className="mt-6 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase">
            {loading ? 'ĐANG XÁC MINH...' : 'VÀO HỆ THỐNG'}
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Ô NHẬP LINK RIÊNG (Nếu GV tự do) */}
          {!gvData?.link && (
            <div className="bg-amber-50 p-6 rounded-[2.5rem] border-2 border-dashed border-amber-200">
              <h4 className="text-sm font-black text-amber-800 uppercase mb-2">Link App Script riêng (GV tự do)</h4>
              <input className="w-full p-4 rounded-2xl font-bold text-blue-700 outline-none" placeholder="Dán link exec..." value={customLink} onChange={e => setCustomLink(e.target.value)} />
            </div>
          )}

          {/* CẤU HÌNH ĐỀ THI */}
          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-black text-indigo-900 uppercase mb-6 text-center">--- Cấu hình thông số đề kiểm tra/thi ---</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mã đề (exams)</label>
                <input className="w-full p-3 rounded-xl font-bold" value={examForm.exams} onChange={e=>setExamForm({...examForm, exams: e.target.value})} placeholder="GK1_TOAN12" />
              </div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">T.Gian</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.fulltime} onChange={e=>setExamForm({...examForm, fulltime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Nộp tối thiểu</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.mintime} onChange={e=>setExamForm({...examForm, mintime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Tab</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.tab} onChange={e=>setExamForm({...examForm, tab: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Ngày đóng</label><input type="date" className="w-full p-3 rounded-xl font-bold" value={examForm.dateclose} onChange={e=>setExamForm({...examForm, dateclose: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-100/50 p-4 rounded-2xl">
                <label className="text-[10px] font-black text-blue-600 uppercase">MCQ:        Số câu /         Điểm mỗi câu</label>
                <div className="flex gap-2"><input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.MCQ} onChange={e=>setExamForm({...examForm, MCQ: parseInt(e.target.value)})} /><input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoremcq} onChange={e=>setExamForm({...examForm, scoremcq: parseFloat(e.target.value)})} /></div>
              </div>
              <div className="bg-orange-100/50 p-4 rounded-2xl">
                <label className="text-[10px] font-black text-orange-600 uppercase">TF:       Số câu /          Điểm mỗi câu</label>
                <div className="flex gap-2"><input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.TF} onChange={e=>setExamForm({...examForm, TF: parseInt(e.target.value)})} /><input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoretf} onChange={e=>setExamForm({...examForm, scoretf: parseFloat(e.target.value)})} /></div>
              </div>
              <div className="bg-purple-100/50 p-4 rounded-2xl">
                <label className="text-[10px] font-black text-purple-600 uppercase">SA:        Số câu /         Điểm mỗi câu</label>
                <div className="flex gap-2"><input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.SA} onChange={e=>setExamForm({...examForm, SA: parseInt(e.target.value)})} /><input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoresa} onChange={e=>setExamForm({...examForm, scoresa: parseFloat(e.target.value)})} /></div>
              </div>
            </div>
            <button onClick={handleSaveConfig} className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all">Lưu Cấu Hình Đề</button>
          </div>

          {/* NHẬP JSON CÂU HỎI */}
          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-black text-emerald-900 uppercase mb-6 text-center">--- Nội dung câu hỏi (JSON) ---</h3>
            <textarea 
              className="w-full h-80 p-6 bg-white rounded-[2rem] border-2 border-emerald-200 shadow-inner font-mono text-xs focus:ring-4 ring-emerald-100 outline-none"
              placeholder='Dán JSON bóc từ Word vào đây...'
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
            <button onClick={handleUploadJsonData} disabled={loading} className="mt-6 w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">
              {loading ? "ĐANG LƯU DỮ LIỆU..." : "Ghi Câu Hỏi (Sheet Exam_Data)"}
            </button>
            <button 
      onClick={handleSaveConfig} // Tận dụng lại hàm lưu config có sẵn của thầy
      disabled={loading || !examForm.exams} 
      className="py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      <i className="fas fa-rocket"></i>
      {loading ? "ĐANG TẠO..." : "2. Kích Hoạt Đề Thi"}
    </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-4 italic">
    * Bước 1 để lưu nội dung câu hỏi, Bước 2 để thiết lập thời gian và mở đề cho học sinh.
  </p>
        </div>
      )}
    </div>
  );
};

export default TeacherWordTask;
