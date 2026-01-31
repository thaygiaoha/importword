import React, { useState, useEffect } from 'react';
import { DANHGIA_URL } from '../config';

const AdminPanel = ({ mode, onBack }) => {
  const [currentTab, setCurrentTab] = useState(mode || 'cauhoi');
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [otp, setOtp] = useState("");
   const [loiGiaiTraCuu, setLoiGiaiTraCuu] = useState("");
  const [loadingLG, setLoadingLG] = useState(false);
 
  const [jsonInput, setJsonInput] = useState('');
  const [subjects, setSubjects] = useState([]); // Khai báo này để chứa môn học
  useEffect(() => {
  // Hàm này sẽ chạy ngay khi thầy mở trang Admin
  const loadConfig = async () => {
    try {
      const response = await fetch(`${DANHGIA_URL}?action=getAppConfig`, {
        method: 'GET',
        redirect: 'follow' // Bắt buộc phải có để tránh lỗi CORS
      });
      const result = await response.json();
      if (result.status === "success") {
        setSubjects(result.data.topics);
        console.log("✅ Đã nạp cấu hình môn học thành công!");
      }
    } catch (err) {
      console.error("❌ Lỗi nạp Config:", err);
    }
  };

  loadConfig();
}, []); // Dấu ngoặc vuông này đảm bảo nó chỉ chạy 1 lần duy nhất khi load trang 

  const [editForm, setEditForm] = useState({ 
    idquestion: '', classTag: '', question: '', phuongan: '', dadung: '', loigiai: '' 
  });
  const [gvInfo, setGvInfo] = useState({ id: '', pass: '' });  
  const [maTranForm, setMaTranForm] = useState({
  makiemtra: '',
  name: '',
  duration: '',
  topics: '',
  numMC: '',
  scoreMC: '',
  mcL3: '',
  mcL4: '',
  numTF: '',
  scoreTF: '',
  tfL3: '',
  tfL4: '',
  numSA: '',
  scoreSA: '',
  saL3: '',
  saL4: ''
});
  useEffect(() => {
    if (mode) setCurrentTab(mode);
  }, [mode]);

  // --- 1. XỬ LÝ WORD ---
  const findQuestion = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${DANHGIA_URL}?action=getQuestionById&id=${editForm.idquestion}`);
      const res = await resp.json();
      if (res.status === 'success') setEditForm(res.data);
      else alert("Không tìm thấy!");
    } finally { setLoading(false); }
  };
  const handleUpdateQuestion = async () => {
  setLoading(true);
  try {
    // Chỉ để data trong payload
    const payload = {
      data: {
        idquestion: editForm.idquestion,
        classTag: editForm.classTag || "",
        question: editForm.question,
        datetime: editForm.datetime || "",
        loigiai: editForm.loigiai || ""
      }
    };

    // Thêm ?action=updateQuestion vào cuối URL
    const res = await fetch(`${DANHGIA_URL}?action=updateQuestion`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if(result.status === 'success') {
      alert("Cập nhật thành công!");
      // Thầy nên thêm logic đóng Modal hoặc cập nhật lại danh sách tại đây
    }
    
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
  } finally {
    setLoading(false);
  }
};  
const handleWordParser = (text) => {
  if (!text.trim()) {
    setJsonInput('');
    return;
  }

  // Tách từng block { ... }
  const blocks = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) current = '';
      depth++;
    }
    if (depth > 0) current += ch;
    if (ch === '}') {
      depth--;
      if (depth === 0) blocks.push(current.trim());
    }
  }

  const baseId = Date.now(); // mốc an toàn
  const results = blocks.map((block, index) => {
    const classTagMatch = block.match(/classTag\s*:\s*["']([^"']+)["']/);

    return {
      id: baseId + index,
      classTag: classTagMatch ? classTagMatch[1] : "1001.1",
      question: block
    };
  });

  setJsonInput(JSON.stringify(results, null, 2));
};


  const handleSaveQuestions = async () => {
  if (!jsonInput) return alert("Chưa có dữ liệu!");
  setLoading(true);
  try {
    const dataArray = JSON.parse(jsonInput); // Đây là mảng các câu hỏi [{id, tag, q}, ...]
    
    // Gửi yêu cầu POST với nội dung là mảng phẳng
    const resp = await fetch(`${DANHGIA_URL}?action=saveQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(dataArray) // Gửi THẲNG cái mảng này đi
    });
    
    const res = await resp.json();
    if (res.status === 'success') { 
      alert(`🚀 Thành công! Đã chèn ${dataArray.length} dòng.`); 
      setJsonInput(''); 
    }
  } catch (e) { alert("Lỗi gửi dữ liệu!"); }
  finally { setLoading(false); }
};
  const handleSearchLG = async (id) => {
  if (!id) return alert("Không tìm thấy ID câu hỏi!");
  
  setLoadingLG(true);
  try {
    // Thêm redirect 'follow' để vượt rào Google
    const response = await fetch(`${DANHGIA_URL}?action=getLG&id=${id}`, {
      method: 'GET',
      redirect: 'follow' 
    });
    
    const text = await response.text();
    
    // Regex chuẩn để bóc tách nội dung giữa dấu nháy của loigiai
    const match = text.match(/loigiai\s*:\s*["']([\s\S]*)["']/);
    const finalContent = match ? match[1] : text;

    setLoiGiaiTraCuu(finalContent.trim());
  } catch (error) {
    console.error("Lỗi tra cứu LG:", error);
    alert("Lỗi kết nối Server!");
  } finally {
    setLoadingLG(false);
  }
};
// Up lG
const handleUploadLG = async () => {
  if (!jsonInput.trim()) return alert("Dán nội dung vào đã thầy ơi!");
  setLoading(true);
  try {
    const blocks = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < jsonInput.length; i++) {
      const ch = jsonInput[i];
      if (ch === '{') { if (depth === 0) current = ''; depth++; }
      if (depth > 0) current += ch;
      if (ch === '}') { depth--; if (depth === 0) blocks.push(current.trim()); }
    }

    const itemsToUpload = blocks.map(block => {
      const idMatch = block.match(/id\s*:\s*(\d+|["'][^"']+["'])/);
      const id = idMatch ? idMatch[1].replace(/["']/g, '') : null;
      return { id: id, loigiai: block };
    }).filter(item => item.id !== null);

    // Cách thầy đề xuất: Đưa action lên URL cho chắc chắn
    const resp = await fetch(`${DANHGIA_URL}?action=saveLG`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(itemsToUpload) // Chỉ gửi mảng phẳng thôi
    });
    
    const result = await resp.text();
    alert(result);
    setJsonInput('');
  } catch (e) { alert("Lỗi gửi dữ liệu thầy ạ!"); }
  finally { setLoading(false); }
};

  // --- 2. XÁC MINHXỬ LÝ NHẬP CÂU HỎI & SỬA LẺ (Giữ nguyên logic của thầy) ---
  const handleVerifyAdminOTP = () => {
    if (otp === "12345@" || otp === "6688@") setIsAdminVerified(true);
    else alert("Mã OTP sai!");
  };
  if (!isAdminVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-black mb-8">ADMIN SECURITY</h2>
          <input type="text" className="w-full p-5 bg-slate-50 border-2 rounded-2xl text-center text-4xl mb-8" value={otp} onChange={e => setOtp(e.target.value)} />
          <button onClick={handleVerifyAdminOTP} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">XÁC MINH</button>
        </div>
      </div>
    );
  }

  return (
 <div className="p-4 md:p-8 bg-white rounded-[3rem] shadow-xl max-w-6xl mx-auto my-6 border border-slate-50">
      <div className="flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-md p-2 rounded-3xl w-fit shadow-sm border border-slate-200">
  {/* Nút Sửa câu hỏi */}
  <button 
    onClick={() => setCurrentTab('cauhoi')} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
      currentTab === 'cauhoi' 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
      : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <i className="fa-solid fa-pen-to-square"></i> Sửa câu hỏi
  </button>
  
  {/* Nút Import Word */}
  <button 
    onClick={() => setCurrentTab('word')} 
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
      currentTab === 'word' 
      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105' 
      : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <i className="fa-solid fa-file-word"></i> Import Word
  </button>
         {/* Nút Import LG - Thêm mới tại đây */}
<button 
  onClick={() => {setCurrentTab('lg'); setJsonInput('');}} 
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
    currentTab === 'lg' 
    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' 
    : 'text-slate-500 hover:bg-slate-100'
  }`}
>
  <i className="fa-solid fa-lightbulb"></i> Import LG
</button>

  {/* Vạch ngăn cách tinh tế */}
  <div className="w-[1px] h-6 bg-slate-300 mx-2"></div>

  {/* Nút Thoát ra - Rực rỡ và an toàn */}
  <button 
    onClick={onBack} 
    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase text-red-500 hover:bg-red-50 hover:scale-105 transition-all active:scale-95"
  >
    <i className="fa-solid fa-right-from-bracket"></i> Thoát ra
  </button>
</div>
      <div className="min-h-[500px]">
       {/* TAB 1: SỬA CÂU HỎI */}
{currentTab === 'cauhoi' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
    
    {/* CỘT TRÁI: NHẬP LIỆU & ĐIỀU KHIỂN */}
    <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Bộ lọc tìm kiếm</span>
        {editForm.idquestion && <span className="text-[10px] text-blue-500 font-bold">Đang sửa: {editForm.idquestion}</span>}
      </div>
      
      <div className="flex gap-2 bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
        <input 
          type="text" 
          placeholder="Nhập ID câu hỏi (VD: MCQ001)..." 
          className="flex-1 p-3 pl-4 rounded-2xl outline-none text-sm font-bold" 
          value={editForm.idquestion} 
          onChange={e => setEditForm({...editForm, idquestion: e.target.value})} 
        />
        <button 
          onClick={findQuestion} 
          disabled={loading}
          className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'TÌM'}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Nội dung chỉnh sửa</label>
        <textarea 
          className="w-full h-80 p-6 rounded-[2rem] outline-none shadow-sm border border-transparent focus:border-blue-300 transition-all text-sm leading-relaxed" 
          placeholder="Nội dung câu hỏi sẽ hiện ở đây để thầy chỉnh sửa..."
          value={editForm.question} 
          onChange={e => setEditForm({...editForm, question: e.target.value})} 
        />
      </div>

      {/* Nút cập nhật nhanh */}
      <button 
        onClick={handleUpdateQuestion}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 transition-all"
      >
        <i className="fa-solid fa-floppy-disk mr-2"></i> LƯU THAY ĐỔI (CỘT C)
      </button>
    </div>

    {/* CỘT PHẢI: HIỂN THỊ CHI TIẾT (PREVIEW CỘT C) */}
    <div className="bg-slate-50 p-6 rounded-[2.5rem] flex flex-col shadow-sm border border-white">
      <div className="flex items-center justify-between mb-4 px-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Nội dung chi tiết (Cột C)</p>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        </div>
      </div>

      <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-inner overflow-y-auto border border-slate-100">
        {editForm.question ? (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
             {/* Hiển thị Question với định dạng gốc */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 text-base leading-7 whitespace-pre-wrap font-medium">
                {editForm.question}
              </p>
            </div>
            
            {/* Vạch kẻ trang trí */}
            <div className="my-6 border-t border-dashed border-slate-200"></div>
            
            {/* Thông tin bổ sung - Thầy có thể mở rộng thêm đáp án ở đây */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Trạng thái</span>
                  <span className="text-xs font-bold text-emerald-600 italic">Đã đồng bộ từ Sheet</span>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Định dạng</span>
                  <span className="text-xs font-bold text-blue-600 italic">UTF-8 Standard</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
            <i className="fa-solid fa-magnifying-glass text-5xl opacity-20"></i>
            <p className="text-sm font-bold italic">Chưa có dữ liệu để hiển thị...</p>
          </div>
        )}
      </div>
      
      <p className="mt-4 text-[10px] text-center text-slate-400 font-medium">
        Hệ thống tự động canh lề và giữ nguyên định dạng xuống dòng (whitespace)
      </p>
    </div>
    
  </div>
)}

        {/* TAB 2: IMPORT WORD */}
        {currentTab === 'word' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-6 rounded-[2.5rem]">
              <textarea className="w-full h-96 p-6 bg-white rounded-[2rem] shadow-sm text-sm outline-none" placeholder="Dán nội dung Word..." onChange={(e) => handleWordParser(e.target.value)} />
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4">
              <textarea className="w-full h-80 p-6 bg-slate-900 text-emerald-400 rounded-[2rem] font-mono text-xs outline-none" value={jsonInput} readOnly />
              <button onClick={handleSaveQuestions} disabled={!jsonInput || loading} className="w-full py-5 bg-orange-600 text-white rounded-[2rem] font-black shadow-lg">
                {loading ? 'ĐANG ĐẨY DỮ LIỆU...' : 'ĐẨY LÊN SHEET'}
              </button>
            </div>
          </div>
        )}   
        {/* TAB 3: IMPORT LỜI GIẢI (CỘT E) */}
{currentTab === 'lg' && (
  <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
    <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-dashed border-emerald-200">
      <textarea 
        className="w-full h-80 p-6 bg-white rounded-[2rem] shadow-inner text-sm outline-none focus:ring-2 ring-emerald-500 font-mono mb-4" 
        placeholder="Dán JSON lời giải từ file Word vào đây..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />
      <button 
        onClick={handleUploadLG} 
        disabled={loading || !jsonInput}
        className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl"
      >
        {loading ? "ĐANG LƯU..." : "CẬP NHẬT LỜI GIẢI (CỘT E)"}
      </button>
    </div>
  </div>
)}
        {loiGiaiTraCuu && (
  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 my-2 whitespace-pre-wrap">
    <strong>Lời giải:</strong> {loiGiaiTraCuu}
  </div>
)}
      </div>
    </div>
  );
};

export default AdminPanel;
