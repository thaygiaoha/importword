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
    duration: 90
  });

  const [jsonInputWord, setJsonInputWord] = useState(''); 
  const [jsonInputLG, setJsonInputLG] = useState('');

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

  // HÀM LƯU TỔNG HỢP (ONE-CLICK)
  const handleSaveAll = async () => {
    if (!idgv || !examCode || !jsonInputWord) return alert("Thầy điền thiếu IDGV, Mã đề hoặc Câu hỏi rồi!");
    setLoading(true);
    
    try {
      // 1. Xác định link gửi (Theo logic F2 thầy dặn)
      // Giả sử ta gọi hàm check F2 ở đây hoặc truyền idgv để Backend tự xử lý
      const targetUrl = customLink || API_ROUTING[idgv] || DANHGIA_URL;

      const payload = {
        idgv,
        examCode,
        config, // Đẩy vào sheet(exams)
        questions: JSON.parse(jsonInputWord), // Đẩy vào sheet(exam_data)
        solutions: jsonInputLG // Đẩy vào sheet(exam_data) cột E
      };

      const resp = await fetch(`${targetUrl}?action=uploadFullData`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      const res = await resp.json();
      alert(res.message);
    } catch (e) {
      alert("Lỗi hệ thống: " + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-white rounded-[2rem] shadow-2xl max-w-6xl mx-auto border-4 border-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-slate-900 rounded-[2.5rem]">
        {/* Khu vực Routing & Config */}
        <div className="space-y-2">
           <input className="w-full p-3 rounded-xl bg-slate-800 text-white font-bold" placeholder="ID GIÁO VIÊN..." value={idgv} onChange={e => setIdgv(e.target.value)} />
           <input className="w-full p-3 rounded-xl bg-slate-800 text-white" placeholder="Link Script (nếu F2=0)..." value={customLink} onChange={e => setCustomLink(e.target.value)} />
        </div>
        <div className="space-y-2">
           <input className="w-full p-7 rounded-xl bg-blue-500 text-white font-black" placeholder="MÃ ĐỀ KT (EXAMS)..." value={examCode} onChange={e => setExamCode(e.target.value)} />
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
