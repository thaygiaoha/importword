import React, { useState, useEffect } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";

const ExamCreator_gv = ({ onBack_gv }) => {
  /* ================== STATE ================== */
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvName_gv, setGvName_gv] = useState("");
  const [dsGiaoVien_gv, setDsGiaoVien_gv] = useState([]);
  const [loading_gv, setLoading_gv] = useState(true);

  /* ===== exams (Sheet Exams) ===== */
  const [config_gv, setConfig_gv] = useState({
    exams_gv: "",
    idNumber_gv: "",
    fulltime_gv: 90,
    mintime_gv: 15,
    tab_gv: 3,
    close_gv: 1,
    imgURL_gv: "",
    mcqCount_gv: 0,
    mcqScore_gv: 0,
    tfCount_gv: 0,
    tfScore_gv: 0,
    saCount_gv: 0,
    saScore_gv: 0,
  });
   /* ===== exams (Sheet Exams) ===== */
  mammoth.convertToHtml(
  { arrayBuffer },
  {
    convertImage: mammoth.images.imgElement(async (image) => {
      const buffer = await image.read("base64");
      return { src: `data:${image.contentType};base64,${buffer}` };
    })
  }
)

  /* ===== exam_data ===== */
  const [questions_gv, setQuestions_gv] = useState([]);

  /* ================== LOAD DANH SÁCH GV ================== */
  useEffect(() => {
    const loadGV = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?action=getIdGvList`);
        const json = await res.json();
        if (json.status === "success") setDsGiaoVien_gv(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading_gv(false);
      }
    };
    loadGV();
  }, []);

  /* ================== VERIFY GV ================== */
  const handleVerify_gv = async (idInput) => {
  if (!idInput) return;
  setLoading_gv(true);
  
  try {
    const res = await fetch(DANHGIA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verifyGv_gv', id: idInput }),
    });
    const json = await res.json();
    
    if (json.status === 'success') {
      setIsVerified_gv(true);
      setGvName_gv(json.name);
      setConfig_gv(p => ({ ...p, idNumber_gv: idInput, imgURL_gv: json.img || '' }));
    } else {
      alert(json.message || 'ID GV không hợp lệ');
    }
  } catch (err) {
    alert('Lỗi kết nối');
  } finally {
    setLoading_gv(false);
  }
};
  /* ================== UPLOAD & PARSE WORD ================== */
 const handleFileUpload_gv = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading_gv(true); // Nếu bạn có state loading

  try {
    // Bước 1: Đọc file thành ArrayBuffer đúng cách
    const arrayBufferData = await file.arrayBuffer();  // <-- dùng tên biến rõ ràng

    // Bước 2: Convert với mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBufferData });

    // result.value là HTML string
    const html = result.value || result.html || ''; // fallback nếu version khác
    console.log('HTML từ Word:', html.substring(0, 300)); // debug để kiểm tra

    // Gọi hàm parse của bạn
    parseWordToQuestions_gv(html);

    // Optional: Lưu HTML để preview sau
    // setExamHtml_gv(html);
  } catch (err) {
    console.error('Lỗi parse Word:', err);
    alert('Lỗi khi đọc file .docx: ' + (err.message || 'Không xác định'));
  } finally {
    setLoading_gv(false);
  }
};

  /* ================== SAVE EXAMS ================== */
  const saveExams_gv = async () => {
    if (!isVerified_gv) return alert("Chưa xác minh GV");

    const res = await fetch(API_ROUTING[config_gv.idNumber_gv], {
      method: "POST",
      body: JSON.stringify({
        action: "saveExam",
        data: config_gv,
      }),
    }).then((r) => r.json());

    res.status === "success"
      ? alert("✅ Đã lưu exams")
      : alert("❌ Lỗi lưu exams");
  };

  /* ================== PUSH EXAM_DATA ================== */
  const pushExamData_gv = async () => {
    if (!questions_gv.length) return alert("Chưa có câu hỏi");

    const payload = questions_gv.map((q) => ({
      type:
        q.part === "I"
          ? "mcq"
          : q.part === "II"
          ? "true-false"
          : "short-answer",
      question: q.question,
      options: q.options.length ? q.options : null,
      answer: q.answer,
      loigiai: q.explanation || "",
    }));

    const res = await fetch(API_ROUTING[config_gv.idNumber_gv], {
      method: "POST",
      body: JSON.stringify({
        action: "pushExamData",
        examId: config_gv.exams_gv,
        data: payload,
      }),
    }).then((r) => r.json());

    res.status === "success"
      ? alert("✅ Đã đẩy exam_data")
      : alert("❌ Lỗi exam_data");
  };

  /* ================== UI ================== */
  return (
    <div className="p-8 bg-white rounded-3xl shadow-xl max-w-7xl mx-auto">
      <h2 className="font-black text-xl mb-4">
        Hệ thống tạo đề thi (GV)
      </h2>

      <div className="flex gap-2 mb-4">
  <input
    placeholder="Nhập ID GV"
    onChange={(e) => setTempId_gv(e.target.value)}  // thêm state tempId_gv = ''
    className="p-3 border rounded-xl flex-1"
  />
  <button
    onClick={() => handleVerify_gv(tempId_gv)}
    disabled={loading_gv}
    className="bg-green-600 text-white px-6 py-3 rounded-xl"
  >
    Xác minh
  </button>
</div>
      {isVerified_gv && (
        <>
          <input
            placeholder="Mã đề (examId)"
            className="p-3 border rounded-xl w-full mb-2"
            onChange={(e) =>
              setConfig_gv({ ...config_gv, exams_gv: e.target.value })
            }
          />

          <input type="file" accept=".docx" onChange={handleFileUpload_gv} />

          <div className="flex gap-4 mt-6">
            <button
              onClick={saveExams_gv}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black"
            >
              Lưu exams
            </button>
            <button
              onClick={pushExamData_gv}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black"
            >
              Đẩy exam_data
            </button>
          </div>
        </>
      )}
      {questions_gv.length > 0 && (
  <div className="mt-4 p-4 bg-white/10 rounded">
    <h3>Preview câu hỏi ({questions_gv.length} câu)</h3>
    <ul>
      {questions_gv.map((q, i) => (
        <li key={i}>
          <strong>Câu {i+1} ({q.type})</strong>: {q.question.substring(0, 100)}...
        </li>
      ))}
    </ul>
    {/* Nếu có html đầy đủ: <div dangerouslySetInnerHTML={{ __html: examHtml_gv }} /> */}
  </div>
)}
    </div>
  );
};

export default ExamCreator_gv;
