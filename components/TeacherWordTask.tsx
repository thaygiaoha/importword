
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from 'mammoth';
import { DANHGIA_URL, API_ROUTING } from '../config';

interface TeacherWordTaskProps {
  onBack: () => void;
}

const TeacherWordTask: React.FC<TeacherWordTaskProps> = ({ onBack }) => {
  const [step, setStep] = useState<'verify' | 'work'>('verify');
  const [loading, setLoading] = useState(false);
  const [gvId, setGvId] = useState('');
  const [gvData, setGvData] = useState<any>(null); 
  const [customLink, setCustomLink] = useState(''); // Link Spreadsheet riêng GV tự nhập

  const [examForm, setExamForm] = useState({
    exams: '', fulltime: 90, mintime: 30, tab: 3, dateclose: '',
    MCQ: 12, scoremcq: 0.25, 
    TF: 4, scoretf: 1.0, 
    SA: 6, scoresa: 0.5, 
    IDimglink: ''
  });
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('gemini_key') || '');
const [showKeyInput, setShowKeyInput] = useState(false);

// Hàm lưu Key vào máy để lần sau không phải nhập lại
const saveKey = (key: string) => {
  setUserApiKey(key);
  localStorage.setItem('gemini_key', key);
};

  const [questions, setQuestions] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  // ====== Ghi exam tương tự ma trận ======
  
 // ====== 1. Xác minh GV Word ======================================================================================
const handleVerifyW = async () => {
  setLoading(true);
  try {
    // Check cấu hình hệ thống tại Admin
   // Thầy sửa lại dòng fetch này cho chắc ăn nhé:
    const res = await fetch(`${DANHGIA_URL}?action=checkTeacher&idgv=${gvId}`);
    const data = await res.json();
    
    const isAuthRequired = data.data.isAuthRequired; // Lấy từ ô F2 sheet idgv

    if (isAuthRequired === false) {
      // TRƯỜNG HỢP F2 = 0: Cho phép vào luôn
      setGvData({ 
        name: data.status === 'success' ? data.data.name : "GV Tự do",
        link: API_ROUTING[gvId] || data.data.link || "" // Có link thì dùng, không thì để trống để nhập sau
      });
      setStep('work');
    } else if (data.status === 'success') {
      // TRƯỜNG HỢP F2 = 1: Phải có ID đúng
      setGvData({
        ...data.data,
        link: API_ROUTING[gvId] || data.data.link
      });
      setStep('work');
    } else {
      alert("Hệ thống yêu cầu xác minh ID chính xác! Hãy liên hệ Admin: 0988.948.882");
    }
  } catch (e) {
    alert("Lỗi kết nối!");
  } finally { setLoading(false); }
};

// ======= 2. Ghi cấu hình vào file riêng của GV =======
const handleSaveConfig = async () => {
  if (!examForm.exams) return alert("Vui lòng nhập mã đề!");
  
  // Ưu tiên Link GV tự nhập, nếu không có mới dùng link hệ thống
  const targetUrl = customLink || gvData?.link || DANHGIA_URL;

  if (!targetUrl) {
    return alert("Thầy ơi, GV tự do thì phải dán link App Script vào đã nhé! Kaka.");
  }

  const confirmSave = window.confirm(`Lưu cấu hình mã đề [${examForm.exams}] vào hệ thống?`);
  if (!confirmSave) return;

  setLoading(true);
  try {
    // Truyền idgv và action để Script biết đường mà xử lý
    const finalUrl = `${targetUrl}?action=saveExamConfig&idgv=${gvId || "GUEST"}`;

    const res = await fetch(finalUrl, {
      method: 'POST',
      body: JSON.stringify(examForm) 
    });

    alert("✅ Đã gửi lệnh lưu mã đề: " + examForm.exams);
  } catch (e) { 
    alert("Lỗi kết nối: " + e.toString()); 
  } finally { 
    setLoading(false); 
  }
};
// ========== xử lý file Word =====
 const processWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 1. Kiểm tra Key ngay và luôn
  if (!userApiKey) {
    setShowKeyInput(true);
    alert("Thầy chưa nhập API Key kìa! Kaka.");
    return;
  }

  setLoading(true);
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Chuyển Word sang HTML, giữ thẻ <u> (gạch chân)
    const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ["u => u"] });
    const html = result.value;

    // 2. Khởi tạo AI (Cấu hình chuẩn 2026)
    const genAI = new GoogleGenAI(userApiKey.trim());
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Ép AI trả về JSON
    });

    const prompt = `Bạn là chuyên gia số hóa đề thi. Hãy bóc tách HTML này thành mảng JSON.
QUY TẮC BÓC TÁCH:
1. "type": 
   - "mcq": Phần I hoặc có 4 đáp án A,B,C,D.
   - "true-false": Phần II hoặc có các ý a,b,c,d hoặc có cả hai từ đúng sai trong lời dẫn câu hỏi.
   - "short-answer": Phần III hoặc có chứa thẻ <key=...>.

2. Nhận diện đáp án ("a" hoặc "s"):
   - mcq: Lấy chữ cái (A, B, C hoặc D) nằm trong thẻ <u> (gạch chân).
   - true-false: Với mỗi ý a,b,c,d, ý nào nằm trong thẻ <u> thì "a": true, còn lại là false.
   - short-answer: Trích xuất nội dung nằm giữa cụm <key= và >. 
     Ví dụ: "<key=21.5>" thì đáp án "a" là "21.5".
3. "question": Nội dung câu hỏi, giữ nguyên thẻ <img> và chuyển công thức về $...$. 
   Lưu ý: Loại bỏ thẻ <key=...> ra khỏi nội dung câu hỏi để học sinh không thấy đáp án.
4. "loigiai": Lấy nội dung sau "Hướng dẫn giải" hoặc "Lời giải".

TRẢ VỀ JSON THUẦN MẢNG, KHÔNG GIẢI THÍCH THEO ĐỊNH DẠNG SAU
DỮ LIỆU HTML: ${html}`;

    // 3. Gọi AI thái thịt
    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    const text = response.text();
    
    // Làm sạch JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    setQuestions(parsed);
    setPreviewOpen(true); // Hiện cửa sổ xem trước
  } catch (err: any) {
    console.error("Lỗi bóc tách:", err);
    alert("Lỗi: " + (err.message.includes("API_KEY_INVALID") ? "API Key sai rồi thầy ơi!" : err.message));
  } finally {
    setLoading(false);
  }
};
  const handleFinalUpload = async () => {
  if (questions.length === 0) return alert("Chưa có câu hỏi để lưu!");
  
  // Ưu tiên link riêng của GV, nếu không có mới dùng link Master
  const finalTargetUrl = customLink || gvData?.link || DANHGIA_URL;

  if (!finalTargetUrl) return alert("Thiếu link kết nối hệ thống!");

  setLoading(true);
  try {
    const payload = { 
      action: 'uploadExamData', 
      idgv: gvId || "GUEST", 
      examCode: examForm.exams, 
      questions 
    };

    const res = await fetch(`${finalTargetUrl}?action=uploadExamData`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    alert(result.status === "success" ? "✅ " + result.message : "❌ " + result.message);
    setPreviewOpen(false);
  } catch (e) {
    alert("Lỗi ghi dữ liệu! Thầy kiểm tra lại Link Script nhé.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto font-sans bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-indigo-700 uppercase">Nhập bất kỳ hoặc liên hệ Admin nhé   </h2>
        <button 
        onClick={onBack} 
        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-8 py-2 rounded-full font-black border border-red-100 transition-all shadow-sm active:scale-95"
>
  <i className="fas fa-sign-out-alt mr-2"></i>
  THOÁT
</button>
      </div>

      {step === 'verify' ? (
        <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <i className="fas fa-user-shield text-6xl text-indigo-300 mb-6"></i>
          <input type="text" placeholder="NHẬP ID GIÁO VIÊN..." className="w-full max-w-md p-5 bg-white border-4 border-slate-100 rounded-2xl text-center font-black text-2xl uppercase" value={gvId} onChange={e => setGvId(e.target.value)} />
          <button onClick={handleVerifyW} 
            disabled={loading} className="mt-6 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase">
            {loading ? 'ĐANG XÁC MINH...' : 'VÀO HỆ THỐNG VÀ NHẬP API_KEY'}
          </button>
        </div>
      ) : (
       <div className="space-y-10 animate-fade-in"> 
          {/* === CHÈN Ô NHẬP LINK VÀO ĐÂY (Nếu GV tự do) === */}
          {!gvData?.link && (
            <div className="bg-amber-50 p-6 rounded-[2.5rem] border-2 border-dashed border-amber-200 shadow-sm mb-6">
               <h4 className="text-sm font-black text-amber-800 uppercase mb-2">
                 <i className="fas fa-link mr-2"></i> Kết nối WebApp riêng (Dành cho GV tự do)
               </h4>
               <input 
                 className="w-full p-4 rounded-2xl border-none shadow-inner font-bold text-blue-700" 
                 placeholder="Dán link App Script (exec) của thầy/cô vào đây..."
                 value={customLink}
                 onChange={e => setCustomLink(e.target.value)}
               />
               <p className="text-[10px] text-amber-600 mt-2 italic px-2">
                 * Lưu ý: Nếu thầy/cô đã có ID trong hệ thống, link sẽ tự động được nhận diện.
               </p>
            </div>
          )}
         <div className="mb-6 flex items-center justify-between bg-slate-100 p-4 rounded-2xl">
  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-full ${userApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
    <span className="text-sm font-bold text-slate-700">
      {userApiKey ? 'Gemini AI: Sẵn sàng' : 'Gemini AI: Chưa kết nối'}
    </span>
  </div>
  <button 
    onClick={() => setShowKeyInput(!showKeyInput)}
    className="text-xs font-black text-indigo-600 underline"
  >
    {showKeyInput ? 'Đóng' : 'Cấu hình API Key'}
  </button>
</div>

{showKeyInput && (
  <div className="mb-6 p-6 bg-white border-2 border-indigo-500 rounded-[2.5rem] shadow-xl">
    <h4 className="text-sm font-black text-indigo-900 uppercase mb-3">Google Gemini API Key</h4>
    <input 
      type="password"
      className="w-full p-4 rounded-2xl bg-indigo-50 border-none focus:ring-2 focus:ring-indigo-500 font-mono"
      placeholder="Dán AIzaSy... vào đây"
      value={userApiKey}
      onChange={(e) => saveKey(e.target.value)}
    />
    <p className="text-[10px] text-slate-500 mt-2 italic">
      * Key được lưu an toàn trên trình duyệt của riêng thầy/cô. 
      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 underline ml-1">Lấy key tại đây</a>
    </p>
  </div>
)}
          {/* CẤU HÌNH ĐỀ THI - HÀNG 1 ĐẦY ĐỦ MCQ, TF, SA */}
          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-black text-indigo-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-cog"></i> Cấu hình đề thi (Sheet Exams)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mã đề (exams)</label>
                <input className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.exams} onChange={e=>setExamForm({...examForm, exams: e.target.value})} placeholder="VD: GK1_TOAN12" />
              </div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">T.Gian (phút)</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.fulltime} onChange={e=>setExamForm({...examForm, fulltime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Nộp tối thiểu</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.mintime} onChange={e=>setExamForm({...examForm, mintime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">G.Hạn Tab</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.tab} onChange={e=>setExamForm({...examForm, tab: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Ngày đóng</label><input type="date" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.dateclose} onChange={e=>setExamForm({...examForm, dateclose: e.target.value})} /></div>
              
              <div className="bg-blue-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2">MCQ (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.MCQ} onChange={e=>setExamForm({...examForm, MCQ: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-blue-400 uppercase ml-2">Điểm/câu</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoremcq} onChange={e=>setExamForm({...examForm, scoremcq: parseFloat(e.target.value)})} />
              </div>

              <div className="bg-orange-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">TF (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.TF} onChange={e=>setExamForm({...examForm, TF: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-orange-400 uppercase ml-2">Điểm tối đa</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoretf} onChange={e=>setExamForm({...examForm, scoretf: parseFloat(e.target.value)})} />
              </div>

              <div className="bg-purple-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-purple-600 uppercase ml-2">SA (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.SA} onChange={e=>setExamForm({...examForm, SA: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-purple-400 uppercase ml-2">Điểm/câu</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoresa} onChange={e=>setExamForm({...examForm, scoresa: parseFloat(e.target.value)})} />
              </div>

              <div className="col-span-3">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">ID Thư mục Drive (Lưu ảnh)</label>
                <input className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.IDimglink} onChange={e=>setExamForm({...examForm, IDimglink: e.target.value})} placeholder="Chỉ dán mã ID ví dụ: 1abc...2def" />
              </div>
            </div>
            <button onClick={handleSaveConfig} className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all">Lưu cấu hình & Kiểm tra mã đề</button>
          </div>

          {/* NHẬP FILE WORD - TỰ ĐỘNG CHUYỂN JSON */}
          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-black text-emerald-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-file-word"></i> Chuyển đổi Word sang JSON và Ghi Sheet
            </h3>
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-emerald-200 rounded-[2.5rem] p-10 bg-white relative hover:bg-emerald-50 transition-all">
              <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={processWordFile} disabled={loading} />
              <i className="fas fa-cloud-upload-alt text-6xl text-emerald-300 mb-4"></i>
              <p className="font-black text-emerald-600 uppercase text-center">
                {loading ? 'AI ĐANG PHÂN TÍCH FILE WORD...' : 'CHỌN FILE ĐỀ THI (.DOCX) ĐỂ TỰ ĐỘNG CHUYỂN JSON'}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 italic">Hệ thống sẽ bóc tách LaTeX và Lời giải tự động</p>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-7xl rounded-[3rem] flex flex-col overflow-hidden animate-fade-in shadow-2xl">
            <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Kiểm tra {questions.length} câu hỏi đã bóc tách (Mã đề: {examForm.exams})</h3>
              <div className="flex gap-4">
                <button onClick={() => setPreviewOpen(false)} className="px-6 py-2 bg-slate-200 rounded-xl font-bold uppercase text-xs">Hủy</button>
                <button onClick={handleFinalUpload} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs">Xác nhận ghi vào Sheets</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 font-mono text-[11px]">
                  <p className="text-indigo-600 font-black mb-1 uppercase">CÂU {idx + 1} - [{q.type?.toUpperCase()}]</p>
                  <pre className="whitespace-pre-wrap text-blue-900">{JSON.stringify(q, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWordTask;
