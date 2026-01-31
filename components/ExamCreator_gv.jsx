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
  const handleVerify_gv = (idInput) => {
    const gv = dsGiaoVien_gv.find((g) => String(g.id) === String(idInput));
    if (!gv) return alert("❌ ID GV không hợp lệ");

    setIsVerified_gv(true);
    setGvName_gv(gv.name);
    setConfig_gv((p) => ({
      ...p,
      idNumber_gv: idInput,
      imgURL_gv: gv.img || "",
    }));
  };

  /* ================== UPLOAD & PARSE WORD ================== */
  const handleFileUpload_gv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });

    parseWordToQuestions_gv(html);
  };

  const parseWordToQuestions_gv = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = [...doc.body.children];

    let part = "";
    let current = null;
    const result = [];

    nodes.forEach((n) => {
      const text = n.textContent.trim();

      if (/^Phần I/i.test(text)) return (part = "I");
      if (/^Phần II/i.test(text)) return (part = "II");
      if (/^Phần III/i.test(text)) return (part = "III");

      if (/^Câu\s*\d+/i.test(text)) {
        current = {
          part,
          question: text.replace(/^Câu\s*\d+[\.:]?\s*/i, ""),
          options: [],
          answer: part === "II" ? [] : "",
          explanation: "",
        };
        result.push(current);
        return;
      }

      if (!current) return;

      if (part === "I" && /^[A-D]\./.test(text)) {
        const correct = n.innerHTML.includes("<u>");
        current.options.push(text.replace(/^[A-D]\.\s*/, ""));
        if (correct) current.answer = text[0];
      }

      if (part === "II" && /^[a-d]\)/.test(text)) {
        const correct = n.innerHTML.includes("<u>");
        current.options.push(text.replace(/^[a-d]\)\s*/, ""));
        if (correct) current.answer.push(text[0]);
      }

      if (part === "III") {
        const m = n.innerHTML.match(/<key\s*=\s*(.+?)>/i);
        if (m) current.answer = m[1];
      }
    });

    setQuestions_gv(result);

    // auto count
    setConfig_gv((p) => ({
      ...p,
      mcqCount_gv: result.filter((q) => q.part === "I").length,
      tfCount_gv: result.filter((q) => q.part === "II").length,
      saCount_gv: result.filter((q) => q.part === "III").length,
    }));
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

      <input
        placeholder="Nhập ID GV"
        disabled={loading_gv}
        onBlur={(e) => handleVerify_gv(e.target.value)}
        className="p-3 border rounded-xl mb-4"
      />

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
    </div>
  );
};

export default ExamCreator_gv;
