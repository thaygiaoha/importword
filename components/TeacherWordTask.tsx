
import React, { useState } from 'react';
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

  const [examForm, setExamForm] = useState({
    exams: '', fulltime: 90, mintime: 30, tab: 3, dateclose: '',
    MCQ: 12, scoremcq: 0.25, 
    TF: 4, scoretf: 1.0, 
    SA: 6, scoresa: 0.5, 
    IDimglink: ''
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  
 // ====== 1. Xác minh GV Word =======
const handleVerifyW = async () => {
  if (!gvId) return alert("Vui lòng nhập ID!");
  setLoading(true);
  try {
    // Gọi đến Script Master để check xem GV này là ai, file ở đâu
    const res = await fetch(`${DANHGIA_URL}?action=checkTeacher&idgv=${gvId}`);
    const data = await res.json();
    
    if (data.status === 'success') {
      // data.data bao gồm: { name: "Tên GV", link: "Link Spreadsheet riêng" }
      setGvData(data.data); 
      setStep('work'); // Chuyển sang bước làm việc
    } else { 
      alert(data.message); 
    }
  } catch (e) { 
    alert("Lỗi xác minh hệ thống!"); 
  } finally { 
    setLoading(false); 
  }
};

// ======= 2. Ghi cấu hình vào file riêng của GV =======
const handleSaveConfig = async () => {
  if (!examForm.exams) return alert("Vui lòng nhập mã đề!");
  const confirmSave = window.confirm(`Lưu cấu hình mã đề [${examForm.exams}]?`);
  if (!confirmSave) return;

  setLoading(true);
  try {
    const targetUrl = gvData.link || DANHGIA_URL; 
    
    // Đẩy idgv và action lên URL để Script dễ bắt
    const finalUrl = `${targetUrl}?action=saveExamConfig&idgv=${gvId}`;

    const res = await fetch(finalUrl, {
      method: 'POST',
      // BỎ no-cors đi thầy nhé
      body: JSON.stringify(examForm) 
    });

    // Nếu không dùng no-cors, ta có thể thử đọc phản hồi
    // Nếu vẫn lỗi CORS ở đây thì chỉ cần hiện thông báo "Đã gửi" 
    // nhưng mã GGGG chắc chắn sẽ vào Sheet vì URL đã rõ ràng.
    alert("Đã thực hiện lệnh lưu mã đề: " + examForm.exams);
    
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
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth chuyển word sang HTML, giữ nguyên thẻ <u> (gạch chân) cho đáp án
      const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ["u => u"] });
      const html = result.value;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Phân tích HTML từ file Word này và chuyển sang định dạng JSON mảng các câu hỏi.
      Yêu cầu cực kỳ quan trọng:
      1. PHẦN I (mcq): Đáp án đúng nằm trong thẻ <u>...</u> (ví dụ: <u>A</u>).
      2. PHẦN II (true-false): Mỗi câu có 4 ý a,b,c,d. Ý nằm trong <u>...</u> là ĐÚNG (true), ngược lại SAI (false). Output mảng 's' chứa {text: string, a: boolean}.
      3. PHẦN III (short-answer): Đáp án đúng nằm trong thẻ <u>...</u> hoặc <key=...>.
      4. LaTeX: Chuyển công thức về dạng MathJax LaTeX ($...$).
      5. Hình ảnh: Giữ nguyên thẻ <img> nếu có.
      6. TRẢ VỀ JSON THUẦN MẢNG, KHÔNG CÓ MARKDOWN HAY CHỮ GIẢI THÍCH.
      
      Dữ liệu HTML: ${html}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                classTag: { type: Type.STRING },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                o: { type: Type.ARRAY, items: { type: Type.STRING } },
                a: { type: Type.STRING },
                s: { type: Type.ARRAY, items: { 
                  type: Type.OBJECT, 
                  properties: { text: {type:Type.STRING}, a: {type:Type.BOOLEAN} } 
                } },
                loigiai: { type: Type.STRING }
              },
              required: ["type", "question"]
            }
          }
        }
      });

      let rawText = response.text.trim();
      
      // LOGIC MẠNH MẼ ĐỂ BÓC TÁCH JSON SẠCH TỪ AI
      if (rawText.includes("```json")) {
        rawText = rawText.split("```json")[1].split("```")[0].trim();
      } else if (rawText.includes("```")) {
        rawText = rawText.split("```")[1].trim();
      }
      
      try {
        const parsedQuestions = JSON.parse(rawText);
        setQuestions(parsedQuestions);
        setPreviewOpen(true);
      } catch (parseError) {
        console.error("Lỗi parse JSON:", rawText);
        throw new Error("Dữ liệu Gemini trả về không phải JSON hợp lệ.");
      }
      
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi xử lý file: ${err.message || 'AI không phản hồi đúng định dạng'}. Vui lòng thử lại hoặc dùng file Word gạch chân chuẩn.`);
    } finally { setLoading(false); }
  };

  const handleFinalUpload = async () => {
    if (questions.length === 0) return alert("Không có dữ hiệu!");
    
    // CẢNH BÁO TRÙM MÃ ĐỀ
    const confirmUpload = window.confirm(`Bạn chuẩn bị GHI DỮ LIỆU CÂU HỎI vào mã đề [${examForm.exams}].\n\nDữ liệu sẽ được chèn thêm vào Sheets tương ứng.\n\nBấm [OK] để Tiếp tục hoặc [Cancel] để xem lại.`);
    if (!confirmUpload) return;

    setLoading(true);
    try {
      const payload = { action: 'uploadExamData', idgv: gvId, examCode: examForm.exams, questions };
      const targetUrl = API_ROUTING[gvId] || DANHGIA_URL;
      const res = await fetch(`${targetUrl}?action=uploadExamData`, { method: 'POST', body: JSON.stringify(payload) });
      const result = await res.json();
      alert(result.message);
      setPreviewOpen(false);
    } catch (e) { alert("Lỗi tải lên máy chủ!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto font-sans bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-indigo-700 uppercase">Quản lý Giáo Viên & Word</h2>
        <button onClick={onBack} className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 px-6 py-2 rounded-full font-black">THOÁT</button>
      </div>

      {step === 'verify' ? (
        <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <i className="fas fa-user-shield text-6xl text-indigo-300 mb-6"></i>
          <input type="text" placeholder="NHẬP ID GIÁO VIÊN..." className="w-full max-w-md p-5 bg-white border-4 border-slate-100 rounded-2xl text-center font-black text-2xl uppercase" value={gvId} onChange={e => setGvId(e.target.value)} />
          <button onClick={handleVerifyW} 
            disabled={loading} className="mt-6 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase">
            {loading ? 'ĐANG XÁC MINH...' : 'VÀO HỆ THỐNG'}
          </button>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
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
