import React, { useState } from 'react';
import { DANHGIA_URL, API_ROUTING } from '../config';

const TeacherWordTask = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [idgv, setIdgv] = useState('');
  const [customLink, setCustomLink] = useState(''); // Để dự phòng nếu cần dán trực tiếp link
  const [examCode, setExamCode] = useState('');

  const [config, setConfig] = useState({
    numMCQ: 12, scoreMCQ: 0.25,
    numTF: 4, scoreTF: 1.0,
    numSA: 6, scoreSA: 0.5,
    duration: 90,
    mintime: 60,
    tab: 2,
    close: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [jsonInputWord, setJsonInputWord] = useState('');
  const [jsonInputLG, setJsonInputLG] = useState('');

  // Tái sử dụng hàm bóc tách của thầy
  // =========================================================================================================================================
 const handleWordParser = (text) => {
  if (!text.trim()) return alert("Dán dữ liệu vào đã thầy ơi!");

  const blocks = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') { if (depth === 0) current = ''; depth++; }
    if (depth > 0) current += ch;
    if (ch === '}') { depth--; if (depth === 0) blocks.push(current.trim()); }
  }

  const results = blocks.map((block, index) => {
    const tagMatch = block.match(/classTag\s*:\s*["']([^"']+)["']/);
    const typeMatch = block.match(/type\s*:\s*["']([^"']+)["']/);
    return {
      id: Date.now() + index,
      classTag: tagMatch ? tagMatch[1] : "1001.a",
      type: typeMatch ? typeMatch[1] : "SA",
      question: block
    };
  });

  if (results.length > 0) {
    setJsonInput(results);
    // QUAN TRỌNG: Truyền thẳng kết quả vào hàm lưu
    handleSaveQuestions(results); 
  } else {
    alert("Không tìm thấy dấu { } nào để tách!");
  }
};
  // 1. LƯU CẤU HÌNH =====================================================================================================
  const handleSaveConfig = async (force = false) => {
    if (!idgv) return alert("❌ Thầy chưa nhập ID Giáo viên!");
    if (!examCode) return alert("❌ Cần nhập Mã đề!");
    
    const targetUrl = customLink || API_ROUTING[idgv];
    if (!targetUrl) return alert("❌ Không tìm thấy Link Script cho ID này!");

    setLoading(true);
    try {
      const resp = await fetch(`${targetUrl}?action=saveExamConfig&force=${force}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ idgv, examCode, config })
      });
      const res = await resp.json();

      if (res.status === 'exists') {
        if (window.confirm("⚠️ Mã đề này đã có cấu hình. Thầy có muốn GHI ĐÈ không?")) {
          handleSaveConfig(true);
        }
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("❌ Lỗi kết nối đến Script giáo viên!");
    } finally {
      setLoading(false);
    }
  };
// ==============================================================================================================================================
    // =================================================
const handleSaveQuestions = async (dataArray) => {
  // 1. Kiểm tra dữ liệu đầu vào
  if (!dataArray || (Array.isArray(dataArray) && dataArray.length === 0)) {
    alert("Chưa có dữ liệu để nạp!");
    return;
  }
  
  setLoading(true);
  try {
    const targetUrl = API_ROUTING[idgv]; 
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "saveOnlyQuestions", // Thầy nhớ check bên GAS tên action này nhé
        examCode: examCode,
        idgv: idgv,
        questions: dataArray // ĐÃ SỬA: Dùng đúng tên tham số dataArray
      }),
    });

    const result = await response.json();
    if (result.status === "success") {
      alert("✅ Ngon lành: " + result.message);
    } else {
      alert("❌ Lỗi Script: " + result.message);
    }
  } catch (error) {
    console.error("Lỗi fetch:", error);
    alert("Không kết nối được với Script, thầy kiểm tra lại link GAS!");
  } finally {
    setLoading(false);
  }
};
// =================================================bóc lời giải ============================================================================================
  const handleSolutionParser = (text) => {
  const results = [];
  const segments = text.split('}#');

  segments.forEach(segment => {
    const startIndex = segment.indexOf('{');
    if (startIndex !== -1) {
      let rawInside = segment.substring(startIndex).trim();
      if (!rawInside.endsWith('}')) rawInside += '}'; 

      try {
        // Nuốt Object không nháy của thầy
        const obj = new Function(`return ${rawInside}`)();
        
        if (obj && obj.id) {
          results.push({
            id: obj.id,
            // Đóng gói lại thành JSON chuẩn để lưu vào cột E
            // Chỉ giữ lại id và loigiai cho nhẹ sheet
            content: JSON.stringify({
              id: obj.id,
              loigiai: obj.loigiai || ""
            })
          });
        }
      } catch (e) {
        console.error("Lỗi parse LG: ", e);
      }
    }
  });

  // Gửi mảng này sang GAS
  setJsonInputSolution(JSON.stringify(results)); 
  alert(`✅ Đã chuẩn bị xong ${results.length} lời giải. Bấm nút Nạp LG thôi thầy!`);
};
  // 3. LƯU LỜI GIẢI từ word ==========================================================================================================================================================
  const handleSaveSolutions = async () => {
  if (!idgv || !jsonInputLG) return alert("Thiếu IDGV hoặc nội dung!");
  
  const targetUrl = customLink || API_ROUTING[idgv];
  setLoading(true);

  // Tách các block bằng dấu ngoặc nhọn
  const rawBlocks = jsonInputLG.split(/}\s*{/).map(s => {
    let b = s.trim();
    if (!b.startsWith('{')) b = '{' + b;
    if (!b.endsWith('}')) b = b + '}';
    return b;
  });

  try {
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Ép kiểu text để không bị soi CORS
      body: JSON.stringify({ 
        action: "saveOnlySolutions", 
        examCode: examCode,
        solutions: rawBlocks 
      })
    });

    // Nếu fetch thành công nó sẽ chạy xuống đây
    alert("✅ Đã gửi lệnh! Thầy check Sheet xem nó nhảy số chưa.");
  } catch (e) {
    console.error(e);
    alert("❌ Vẫn lỗi kết nối! Thầy kiểm tra lại Link Script trong GAS đã Deploy bản mới nhất chưa?");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="p-6 bg-white rounded-[2rem] shadow-2xl max-w-6xl mx-auto border-4 border-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-slate-900 rounded-[2.5rem]">
        
        {/* CỘT BÊN TRÁI: XÁC MINH & CẤU HÌNH */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-r border-slate-800 pr-4">
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
          <button 
            disabled={loading}
            onClick={() => handleSaveConfig(false)} 
            className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all text-sm border-b-4 border-blue-800"
          >
            {loading ? "ĐANG LƯU..." : "LƯU CẤU HÌNH ĐỀ"}
          </button>
          <button 
            disabled={loading}
            onClick={() => handleSaveQuestions(false)} 
            className="py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg hover:bg-orange-700 active:scale-95 disabled:opacity-50 transition-all text-sm border-b-4 border-orange-800"
          >
            NẠP CÂU HỎI (WORD)
          </button>
          <button 
            disabled={loading}
            onClick={handleSaveSolutions} 
            className="py-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all text-sm border-b-4 border-purple-800"
          >
            CẬP NHẬT LỜI GIẢI
          </button>
          <button 
            onClick={onBack} 
            className="w-full py-2 mt-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            QUAY VỀ TRANG CHỦ
          </button>
        </div>
      </div>

      {/* KHU VỰC TEXTAREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="text-xs font-bold text-slate-500 ml-4 group-focus-within:text-orange-500 transition-colors uppercase">Nội dung câu hỏi (Dán từ Word)</label>
          <textarea 
            className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-2 shadow-inner focus:border-orange-400 focus:bg-white outline-none transition-all text-sm" 
            placeholder="Ctrl + V nội dung từ file Word vào đây..."
            onChange={e => handleWordParser(e.target.value)} 
          />
        </div>
        <div className="group">
          <label className="text-xs font-bold text-slate-500 ml-4 group-focus-within:text-purple-500 transition-colors uppercase">Lời giải chi tiết (Dán LG)</label>
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
