import React, { useState } from 'react';
import { handleWordUpload } from '../wordProcessor'; // Đường dẫn file bóc tách Word

const TeacherAdminModal = ({ isOpen, onClose, DANHGIA_URL }) => {
  const [step, setStep] = useState(1); // 1: Login, 2: Config
  const [loading, setLoading] = useState(false);
  const [gvAuth, setGvAuth] = useState({ idNumber: '', pass: '' });
  const [config, setConfig] = useState({
    title: '', duration: 90, minTime: 30, tabLimit: 3,
    numMCQ: 28, scoreMCQ: 0.25,
    numTF: 4, pointsTF: "0.1, 0.25, 0.5, 1.0",
    numSA: 6, scoreSA: 0.5
  });

  // 1. Xác minh Giáo viên
  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(DANHGIA_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'checkGV', ...gvAuth })
      });
      const result = await res.json();
      if (result.status === 'success') setStep(2);
      else alert("❌ Sai ID hoặc Mật khẩu giáo viên!");
    } catch (e) { alert("Lỗi kết nối xác minh!"); }
    setLoading(false);
  };

  // 2. Xử lý File Word và Upload
  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const questions = await handleWordUpload(file);
      const payload = {
        action: 'uploadWord',
        idNumber: gvAuth.idNumber,
        config: { ...config, title: config.title || file.name.replace('.docx', '') },
        questions
      };

     await fetch(DANHGIA_URL, { method: 'POST', body: JSON.stringify(payload) });
      alert("✅ ĐÃ TẠO ĐỀ THÀNH CÔNG!");
      setStep(1); // Thêm dòng này để reset về màn hình đăng nhập
      onClose();
    } catch (err) { alert("Lỗi xử lý file Word!"); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <h2 className="font-black uppercase tracking-tighter">
            {step === 1 ? 'Xác minh Giáo viên' : 'Cấu hình đề thi'}
          </h2>
          <button onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="p-8 space-y-4">
          {step === 1 ? (
            <>
              <input type="text" placeholder="ID Giáo viên (idNumber)" className="w-full p-4 bg-slate-100 rounded-2xl outline-none border-2 focus:border-emerald-500 font-bold" 
                onChange={e => setGvAuth({...gvAuth, idNumber: e.target.value})} />
              <input type="password" placeholder="Mật khẩu" className="w-full p-4 bg-slate-100 rounded-2xl outline-none border-2 focus:border-emerald-500 font-bold"
                onChange={e => setGvAuth({...gvAuth, pass: e.target.value})} />
              <button onClick={handleVerify} disabled={loading} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg shadow-emerald-100">
                {loading ? <i className="fas fa-spinner animate-spin"></i> : 'ĐĂNG NHẬP HỆ THỐNG'}
              </button>
            </>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scroll">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Thông tin chung</label>
                <input type="text" placeholder="Tên bài kiểm tra (Mã đề)" className="p-3 bg-slate-50 rounded-xl border font-bold text-sm" onChange={e => setConfig({...config, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="TG làm bài (phút)" className="p-3 bg-slate-50 rounded-xl border text-sm" onChange={e => setConfig({...config, duration: e.target.value})} />
                  <input type="number" placeholder="TG nộp tối thiểu" className="p-3 bg-slate-50 rounded-xl border text-sm" onChange={e => setConfig({...config, minTime: e.target.value})} />
                </div>
                <input type="number" placeholder="Giới hạn chuyển Tab" className="p-3 bg-slate-50 rounded-xl border text-sm" onChange={e => setConfig({...config, tabLimit: e.target.value})} />
              </div>

             {/* Cấu hình MCQ */}
<div className="border-t pt-3 space-y-2">
  <label className="text-[10px] font-bold text-blue-600 uppercase ml-2 flex items-center gap-2">
    <i className="fas fa-list-ul"></i> Phần I: Trắc nghiệm (MCQ)
  </label>
  <div className="grid grid-cols-2 gap-2">
    <div className="space-y-1">
      <span className="text-[9px] text-slate-400 ml-1">Số câu</span>
      <input 
        type="number" 
        value={config.numMCQ} 
        className="w-full p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
        onChange={e => setConfig({...config, numMCQ: parseInt(e.target.value)})}
      />
    </div>
    <div className="space-y-1">
      <span className="text-[9px] text-slate-400 ml-1">Điểm/câu</span>
      <input 
        type="number" 
        step="0.01"
        value={config.scoreMCQ} 
        className="w-full p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
        onChange={e => setConfig({...config, scoreMCQ: parseFloat(e.target.value)})}
      />
    </div>
  </div>
</div>

{/* Cấu hình Đúng/Sai */}
<div className="border-t pt-3 space-y-2">
  <label className="text-[10px] font-bold text-orange-600 uppercase ml-2 flex items-center gap-2">
    <i className="fas fa-check-double"></i> Phần II: Đúng/Sai (TF)
  </label>
  <div className="grid grid-cols-2 gap-2 mb-2">
    <div className="space-y-1">
      <span className="text-[9px] text-slate-400 ml-1">Số câu</span>
      <input 
        type="number" 
        value={config.numTF} 
        className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none" 
        onChange={e => setConfig({...config, numTF: parseInt(e.target.value)})}
      />
    </div>
    <div className="space-y-1 flex flex-col justify-end">
       <span className="text-[8px] text-orange-400 italic mb-2">*Điểm theo số ý đúng</span>
    </div>
  </div>
  <input 
    type="text" 
    value={config.pointsTF} 
    className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm font-mono focus:ring-2 focus:ring-orange-400 outline-none" 
    placeholder="Ví dụ: 0.1, 0.25, 0.5, 1.0"
    onChange={e => setConfig({...config, pointsTF: e.target.value})} 
  />
</div>

{/* Cấu hình Trả lời ngắn */}
<div className="border-t pt-3 space-y-2">
  <label className="text-[10px] font-bold text-purple-600 uppercase ml-2 flex items-center gap-2">
    <i className="fas fa-edit"></i> Phần III: Trả lời ngắn (SA)
  </label>
  <div className="grid grid-cols-2 gap-2">
    <div className="space-y-1">
      <span className="text-[9px] text-slate-400 ml-1">Số câu</span>
      <input 
        type="number" 
        value={config.numSA} 
        className="w-full p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm font-bold focus:ring-2 focus:ring-purple-400 outline-none" 
        onChange={e => setConfig({...config, numSA: parseInt(e.target.value)})}
      />
    </div>
    <div className="space-y-1">
      <span className="text-[9px] text-slate-400 ml-1">Điểm/câu</span>
      <input 
        type="number" 
        step="0.01"
        value={config.scoreSA} 
        className="w-full p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm font-bold focus:ring-2 focus:ring-purple-400 outline-none" 
        onChange={e => setConfig({...config, scoreSA: parseFloat(e.target.value)})}
      />
    </div>
  </div>
</div>

              <button onClick={() => document.getElementById('word-final').click()} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase mt-4 flex items-center justify-center gap-3">
                {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-file-word text-blue-400"></i> CHỌN FILE WORD & IMPORT</>}
              </button>
              <input type="file" id="word-final" hidden accept=".docx" onChange={onFileChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAdminModal;
