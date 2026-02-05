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
        {/* Khu vực Routing & Config */}
        <div className="space-y-2">
           <input className="w-full p-3 rounded-xl bg-slate-800 text-white font-bold" placeholder="ID GIÁO VIÊN..." value={idgv} onChange={e => setIdgv(e.target.value)} />
           <input className="w-full p-3 rounded-xl bg-slate-800 text-white" placeholder="Link Script GV tự do (nếu F2=0)..." value={customLink} onChange={e => setCustomLink(e.target.value)} />
        </div>
        <div className="space-y-2">
           <input className="w-full p-7 rounded-xl bg-slate-500 text-white font-black" placeholder="MÃ ĐỀ KT (EXAMS)..." value={examCode} onChange={e => setExamCode(e.target.value)} />
           <div className="grid grid-cols-2 gap-2 text-[10px] text-white">
              <div>Số câu MCQ: <input type="number" className="w-full bg-slate-800 p-1" value={config.numMCQ} onChange={e => setConfig({...config, numMCQ: e.target.value})}/></div>
              <div>Điểm/câu: <input type="number" className="w-full bg-slate-800 p-1" value={config.scoreMCQ} onChange={e => setConfig({...config, scoreMCQ: e.target.value})}/></div>
           </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-white">
              <div>Số câu TF: <input type="number" className="w-full bg-slate-800 p-1" value={config.numTF} onChange={e => setConfig({...config, numTF: e.target.value})}/></div>
              <div>Điểm/câu: <input type="number" className="w-full bg-slate-800 p-1" value={config.scoreTF} onChange={e => setConfig({...config, scoreTF: e.target.value})}/></div>
           </div>
           <div className="grid grid-cols-2 gap-2 text-[10px] text-white">
              <div>Số câu SA: <input type="number" className="w-full bg-slate-800 p-1" value={config.numSA} onChange={e => setConfig({...config, numSA: e.target.value})}/></div>
              <div>Điểm/câu: <input type="number" className="w-full bg-slate-800 p-1" value={config.scoreSA} onChange={e => setConfig({...config, scoreSA: e.target.value})}/></div>
           </div>
        </div>
        <div className="flex flex-col gap-2">
           <button onClick={handleSaveAll} className="flex-1 bg-emerald-600 text-white rounded-2xl font-black">LƯU TỔNG HỢP</button>
           <button onClick={onBack} className="py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold">THOÁT</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-slate-500 ml-4">NỘI DUNG CÂU HỎI (WORD)</label>
          <textarea className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-2 shadow-inner" onChange={e => handleWordParser(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 ml-4">LỜI GIẢI CHI TIẾT (LG)</label>
          <textarea className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-2 shadow-inner" onChange={e => setJsonInputLG(e.target.value)} />
        </div>
      </div>
    </div>
  );
};

export default TeacherWordTask;
