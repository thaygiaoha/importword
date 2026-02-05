import React, { useState } from 'react';
import { DANHGIA_URL, API_ROUTING } from '../config';

const TeacherWordTask = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [idgv, setIdgv] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [examCode, setExamCode] = useState('');
  
  // Các thông số nạp vào sheet(exams) của Admin
  const [config, setConfig] = useState({
  numMCQ: 12, scoreMCQ: 0.25,
  numTF: 4, scoreTF: 1.0,
  numSA: 6, scoreSA: 0.5,
  duration: 90,
  mintime: 60,
  tab: 2,
  close: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Mặc định 1 tuần sau
});

  const [jsonInputWord, setJsonInputWord] = useState(''); 
  const [jsonInputLG, setJsonInputLG] = useState('');
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Tái sử dụng hàm bóc tách của thầy
  const handleWordParser = (text) => {
    const results = [];
    let input = text;
    while (input.indexOf('{') !== -1 && input.indexOf('}#') !== -1) {
      let start = input.indexOf('{');
      let end = input.indexOf('}#') + 2;
      let block = input.substring(start, end).trim();
      let cleanBlock = block.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ");
      if (cleanBlock) results.push(cleanBlock);
      input = input.substring(end);
    }
    setJsonInputWord(JSON.stringify(results));
  };

  const handleSaveConfig = async (force = false) => {
  if (!examCode) return alert("Cần nhập Mã đề!");
  setLoading(true);
  try {
    const targetUrl = customLink || API_ROUTING[idgv];
    const resp = await fetch(`${targetUrl}?action=saveExamConfig&force=${force}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ idgv, examCode, config })
    });
    const res = await resp.json();
    
    if (res.status === 'exists') {
      if (window.confirm("Mã đề này đã có cấu hình. Thầy có muốn GHI ĐÈ không?")) {
        handleSaveConfig(true); // Gọi lại với quyền ghi đè
      }
    } else {
      alert(res.message);
    }
  } catch (e) { alert("Lỗi lưu cấu hình!"); }
  finally { setLoading(false); }
};
  // =====================================================================================================================
  
// HÀM 2: LƯU CÂU HỎI & LG (Ghi vào sheet exam_data)
// 2. LƯU CÂU HỎI (Ghi vào sheet exam_data - Chỉ cập nhật Cột A, B, C, D, G)
const handleSaveQuestions = async (isOverwrite = false) => {
  if (!examCode || !jsonInputWord) return alert("Thiếu mã đề hoặc nội dung câu hỏi!");
  setLoading(true);
  try {
    const targetUrl = customLink || API_ROUTING[idgv];
    const resp = await fetch(`${targetUrl}?action=saveOnlyQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ idgv, examCode, questions: JSON.parse(jsonInputWord), overwrite: isOverwrite })
    });
    const res = await resp.json();
    if (res.status === 'exists') {
      if (window.confirm("Mã đề này đã có câu hỏi. Xóa cũ nạp mới?")) handleSaveQuestions(true);
    } else alert(res.message);
  } catch (e) { alert("Lỗi lưu câu hỏi!"); } finally { setLoading(false); }
};

// 3. LƯU LỜI GIẢI (Cập nhật vào Cột E của sheet exam_data dựa trên ID)
const handleSaveSolutions = async () => {
  if (!jsonInputLG) return alert("Thầy chưa nhập nội dung lời giải!");
  setLoading(true);
  try {
    const targetUrl = customLink || API_ROUTING[idgv];
    const resp = await fetch(`${targetUrl}?action=saveOnlySolutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ idgv, solutions: jsonInputLG })
    });
    const res = await resp.json();
    alert(res.message);
  } catch (e) { alert("Lỗi cập nhật lời giải!"); } finally { setLoading(false); }
};
  return (
    <div className="p-6 bg-white rounded-[2rem] shadow-2xl max-w-6xl mx-auto border-4 border-slate-50">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-slate-900 rounded-[2.5rem]">
    
    {/* CỘT BÊN TRÁI: XÁC MINH & CẤU HÌNH (Gộp Cột 1 và Cột 2 cũ) */}
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-r border-slate-800 pr-4">
      
      {/* Khối Xác thực */}
      <div className="space-y-3">
        <div className="text-[10px] text-emerald-400 font-bold uppercase ml-2">Xác thực hệ thống</div>
        <input 
          className="w-full p-4 rounded-xl bg-slate-800 text-white font-bold border border-slate-700 shadow-inner focus:border-emerald-500 outline-none transition-all" 
          placeholder="ID GIÁO VIÊN..." 
          value={idgv} 
          onChange={e => setIdgv(e.target.value)} 
        />
        <input 
          className="w-full p-4 rounded-xl bg-slate-500 text-white font-black text-center placeholder-slate-300 shadow-inner" 
          placeholder="MÃ ĐỀ KT (EXAMS)..." 
          value={examCode} 
          onChange={e => setExamCode(e.target.value)} 
        />
      </div>

      {/* Khối Thông số (Cấu hình đề) */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-white bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
        <div className="col-span-2 text-emerald-400 font-bold uppercase mb-1 flex justify-between">
          <span>Cấu hình câu hỏi</span>
          <i className="fas fa-cog"></i>
        </div>
        <div>MCQ: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.numMCQ} onChange={e => setConfig({...config, numMCQ: e.target.value})}/></div>
        <div>Điểm/câu: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.scoreMCQ} onChange={e => setConfig({...config, scoreMCQ: e.target.value})}/></div>
        
        <div>TF: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.numTF} onChange={e => setConfig({...config, numTF: e.target.value})}/></div>
        <div>Điểm/câu: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.scoreTF} onChange={e => setConfig({...config, scoreTF: e.target.value})}/></div>
        
        <div>SA: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.numSA} onChange={e => setConfig({...config, numSA: e.target.value})}/></div>
        <div>Điểm/câu: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700" value={config.scoreSA} onChange={e => setConfig({...config, scoreSA: e.target.value})}/></div>

        <div className="col-span-2 text-orange-400 font-bold uppercase mt-2 border-t border-slate-700 pt-1">Thời gian & Bảo mật</div>
        <div>Phút thi: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700 text-orange-300" value={config.duration} onChange={e => setConfig({...config, duration: e.target.value})}/></div>
        <div>Nộp bài sau: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700 text-orange-300" value={config.mintime} onChange={e => setConfig({...config, mintime: e.target.value})}/></div>
        
        <div>Lỗi Tab: <input type="number" className="w-full bg-slate-900 p-1 rounded border border-slate-700 text-red-400" value={config.tab} onChange={e => setConfig({...config, tab: e.target.value})}/></div>
        <div>Ngày đóng: <input type="date" className="w-full bg-slate-900 p-1 rounded border border-slate-700 text-[9px]" value={config.close} onChange={e => setConfig({...config, close: e.target.value})}/></div>
      </div>
    </div>
    {/* CỘT BÊN PHẢI: HÀNH ĐỘNG */}
    <div className="flex flex-col gap-2 justify-center">
      <button onClick={() => handleSaveConfig(false)} className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-sm border-b-4 border-blue-800">
        LƯU CẤU HÌNH ĐỀ
      </button>
      <button onClick={() => handleSaveQuestions(false)} className="py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg hover:bg-orange-700 active:scale-95 transition-all text-sm border-b-4 border-orange-800">
        NẠP CÂU HỎI (WORD)
      </button>
      <button onClick={handleSaveSolutions} className="py-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg hover:bg-purple-700 active:scale-95 transition-all text-sm border-b-4 border-purple-800">
        CẬP NHẬT LỜI GIẢI
      </button>     
      {/* Nút bấm quan trọng nhất đây thầy ơi */}
  <button
    onClick={() => handleSaveConfig(false)} // Gọi hàm xử lý đã có của thầy
    disabled={loading}
    className={`w-full py-4 rounded-xl font-bold text-white shadow-2xl transition-all duration-200 
      ${loading 
        ? 'bg-gray-600 cursor-not-allowed' 
        : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 active:scale-95'
      }`}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <i className="fas fa-spinner animate-spin"></i> ĐANG KHỞI TẠO...
      </span>
    ) : (
      <span className="flex items-center justify-center gap-2 text-lg">
        <i className="fas fa-magic"></i> BẤM VÀO ĐÂY ĐỂ TẠO ĐỀ
      </span>
    )}
  </button>
   <button onClick={onBack} className="w-full py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all">THOÁT TRÌNH TẠO
   </button> 
    </div>
  </div>

  {/* KHU VỰC TEXTAREA */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="group">
      <label className="text-xs font-bold text-slate-500 ml-4 group-focus-within:text-orange-500 transition-colors">NỘI DUNG CÂU HỎI (DÁN TỪ WORD)</label>
      <textarea 
        className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-2 shadow-inner focus:border-orange-400 focus:bg-white outline-none transition-all text-sm" 
        placeholder="Ctrl + V nội dung từ file Word vào đây..."
        onChange={e => handleWordParser(e.target.value)} 
      />
    </div>
    <div className="group">
      <label className="text-xs font-bold text-slate-500 ml-4 group-focus-within:text-purple-500 transition-colors">LỜI GIẢI CHI TIẾT (DÁN LG)</label>
      <textarea 
        className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-2 shadow-inner focus:border-purple-400 focus:bg-white outline-none transition-all text-sm" 
        placeholder="Ctrl + V nội dung lời giải đã format vào đây..."
        onChange={e => setJsonInputLG(e.target.value)} 
      />
    </div>
  </div>
</div>
  );
};

export default TeacherWordTask;
