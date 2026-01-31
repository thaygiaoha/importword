import React, { useState, useEffect } from "react";
import { DANHGIA_URL, API_ROUTING } from "../config";
import mammoth from "mammoth";

const ExamCreator_gv = ({ onBack_gv }) => {
  /* ================== STATE ================== */
  const [isVerified_gv, setIsVerified_gv] = useState(false);
  const [gvName_gv, setGvName_gv] = useState("");
  const [dsGiaoVien_gv, setDsGiaoVien_gv] = useState([]);
  const [loading_gv, setLoading_gv] = useState(true);
  const [tempId_gv, setTempId_gv] = useState(""); // Thêm state này để input ID hoạt động

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

  const [questions_gv, setQuestions_gv] = useState([]);
  const [examHtml_gv, setExamHtml_gv] = useState(""); // Lưu HTML đầy đủ để preview (tùy chọn)

  /* ================== LOAD DANH SÁCH GV ================== */
  useEffect(() => {
    const loadGV = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?action=getIdGvList`);
        const json = await res.json();
        if (json.status === "success") {
          setDsGiaoVien_gv(json.data);
        } else {
          console.error("Lỗi load GV:", json.message);
        }
      } catch (e) {
        console.error("Lỗi fetch GV:", e);
      } finally {
        setLoading_gv(false);
      }
    };
    loadGV();
  }, []);

  /* ================== VERIFY GV ================== */
  const handleVerify_gv = async () => {
    if (!tempId_gv) return alert("Vui lòng nhập ID GV");

    setLoading_gv(true);
    try {
      const res = await fetch(DANHGIA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verifyGv_gv", id: tempId_gv }), // sửa action nếu backend dùng verifyGv
      });
      const json = await res.json();

      if (json.status === "success") {
        setIsVerified_gv(true);
        setGvName_gv(json.name || "GV không tên");
        setConfig_gv((p) => ({
          ...p,
          idNumber_gv: tempId_gv,
          imgURL_gv: json.img || "",
        }));
      } else {
        alert(json.message || "ID GV không hợp lệ");
      }
    } catch (err) {
      alert("Lỗi kết nối server: " + err.message);
    } finally {
      setLoading_gv(false);
    }
  };

  /* ================== UPLOAD & PARSE WORD ================== */
  const handleFileUpload_gv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading_gv(true);
    try {
      const arrayBufferData = await file.arrayBuffer();

      const result = await mammoth.convertToHtml(
        { arrayBuffer: arrayBufferData },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const buffer = await image.read("base64");
            return { src: `data:${image.contentType};base64,${buffer}` };
          }),
          ignoreEmptyParagraphs: false,
        }
      );

      const html = result.value;
      console.log("HTML parsed từ Word:", html.substring(0, 500)); // debug

      setExamHtml_gv(html); // Lưu để preview nếu cần

      // Gọi hàm parse câu hỏi (bạn cần định nghĩa hàm này)
      // parseWordToQuestions_gv(html);  // <-- Uncomment và định nghĩa hàm bên dưới

      // Nếu chưa có hàm parse, tạm dùng placeholder
      alert("Đã parse Word thành công! (HTML dài " + html.length + " ký tự)");
    } catch (err) {
      console.error("Lỗi mammoth:", err);
      alert("Lỗi đọc file .docx: " + err.message);
    } finally {
      setLoading_gv(false);
    }
  };

  // Ví dụ hàm parse đơn giản (bạn thay bằng logic thật của mình)
  const parseWordToQuestions_gv = (html) => {
    // Logic split câu hỏi từ HTML (dùng DOMParser hoặc regex)
    // Ví dụ tạm:
    const tempQuestions = [
      { part: "I", question: "Câu mẫu 1", type: "mcq", options: ["A", "B"], answer: "A" },
    ];
    setQuestions_gv(tempQuestions);
  };

  /* ================== SAVE & PUSH ================== */
  const saveExams_gv = async () => {
    if (!isVerified_gv) return alert("Chưa xác minh GV");
    if (!config_gv.exams_gv) return alert("Nhập mã đề");

    try {
      const res = await fetch(API_ROUTING[config_gv.idNumber_gv], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveExam",
          data: config_gv,
        }),
      });
      const json = await res.json();
      alert(json.status === "success" ? "✅ Đã lưu exams" : "❌ Lỗi: " + json.message);
    } catch (err) {
      alert("Lỗi lưu exams: " + err.message);
    }
  };

  const pushExamData_gv = async () => {
    if (!questions_gv.length) return alert("Chưa có câu hỏi nào");

    try {
      const payload = questions_gv.map((q) => ({
        type: q.part === "I" ? "mcq" : q.part === "II" ? "true-false" : "short-answer",
        question: q.question,
        options: q.options?.length ? q.options : null,
        answer: q.answer,
        loigiai: q.explanation || "",
      }));

      const res = await fetch(API_ROUTING[config_gv.idNumber_gv], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pushExamData",
          examId: config_gv.exams_gv,
          data: payload,
        }),
      });
      const json = await res.json();
      alert(json.status === "success" ? "✅ Đã đẩy exam_data" : "❌ Lỗi: " + json.message);
    } catch (err) {
      alert("Lỗi đẩy exam_data: " + err.message);
    }
  };

  /* ================== UI ================== */
  if (loading_gv) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="p-8 bg-white rounded-3xl shadow-xl max-w-7xl mx-auto">
      <h2 className="font-black text-2xl mb-6 text-center">
        Hệ thống tạo đề thi (Giáo viên)
      </h2>

      {/* Phần verify GV */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Nhập ID GV"
          value={tempId_gv}
          onChange={(e) => setTempId_gv(e.target.value)}
          className="p-3 border rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isVerified_gv}
        />
        <button
          onClick={handleVerify_gv}
          disabled={loading_gv || isVerified_gv}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading_gv ? "Đang xác minh..." : "Xác minh"}
        </button>
      </div>

      {isVerified_gv && (
        <div className="space-y-4">
          <p className="text-lg font-medium">Xin chào: {gvName_gv}</p>

          <input
            placeholder="Mã đề (examId)"
            value={config_gv.exams_gv}
            onChange={(e) =>
              setConfig_gv({ ...config_gv, exams_gv: e.target.value })
            }
            className="p-3 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="file"
            accept=".docx"
            onChange={handleFileUpload_gv}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={saveExams_gv}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700"
            >
              Lưu exams
            </button>
            <button
              onClick={pushExamData_gv}
              className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black hover:bg-emerald-700"
            >
              Đẩy exam_data
            </button>
          </div>
        </div>
      )}

      {/* Preview câu hỏi tạm thời */}
      {questions_gv.length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-lg mb-3">
            Preview câu hỏi ({questions_gv.length} câu)
          </h3>
          <ul className="space-y-2">
            {questions_gv.map((q, i) => (
              <li key={i} className="text-gray-800">
                <strong>Câu {i + 1} ({q.type || "chưa xác định"})</strong>:{" "}
                {q.question?.substring(0, 120) || "Không có nội dung"}...
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nếu muốn preview HTML đầy đủ (hình ảnh, format) */}
      {examHtml_gv && (
        <div className="mt-8 p-6 bg-white border rounded-xl">
          <h3 className="font-bold text-lg mb-3">Preview đề thi (HTML)</h3>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: examHtml_gv }}
          />
        </div>
      )}
    </div>
  );
};

export default ExamCreator_gv;
