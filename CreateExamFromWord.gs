function parseWordExam(docId, examId) {
  const body = DocumentApp.openById(docId).getBody();
  const paras = body.getParagraphs();

  let part = "";
  let current = null;
  let questions = [];
  let qIndex = 0;

  paras.forEach(p => {
    const text = p.getText().trim();
    if (!text) return;

    // ===== PHẦN =====
    if (/^PHẦN\s*I/i.test(text)) {
      part = "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn";
      return;
    }
    if (/^PHẦN\s*II/i.test(text)) {
      part = "PHẦN II. Câu trắc nghiệm đúng sai";
      return;
    }
    if (/^PHẦN\s*III/i.test(text)) {
      part = "PHẦN III. Câu trắc nghiệm trả lời ngắn";
      return;
    }

    // ===== CÂU =====
    if (/^Câu\s+\d+/i.test(text)) {
      if (current) questions.push(current);
      qIndex++;

      current = {
        id: Number(examId) * 1000 + qIndex,
        classTag: examId + "." + qIndex,
        part,
        type: part.includes("I") ? "mcq" :
              part.includes("II") ? "true-false" :
              "short-answer",
        question: text,
        o: [],
        s: [],
        a: ""
      };
      return;
    }

    if (!current) return;

    // ===== MCQ =====
    if (current.type === "mcq" && /^[A-D]\s*/i.test(text)) {
      current.o.push(text);
      if (isUnderline_(p)) current.a = text;
      return;
    }

    // ===== TRUE / FALSE =====
    if (current.type === "true-false" && /^[a-d]\s*/i.test(text)) {
      current.s.push({
        text,
        a: isUnderline_(p)
      });
      return;
    }

    // ===== SHORT ANSWER =====
    if (current.type === "short-answer") {
      const m = text.match(/<key\s*=\s*([^>]+)>/i);
      if (m) {
        current.a = m[1].trim();
      } else {
        current.question += "\n" + text;
      }
      return;
    }

    current.question += "\n" + text;
  });

  if (current) questions.push(current);

  return questions.map(cleanQuestion_);
}
function isUnderline_(p) {
  const t = p.editAsText();
  for (let i = 0; i < t.getText().length; i++) {
    if (t.getUnderline(i)) return true;
  }
  return false;
}
function cleanQuestion_(q) {
  if (q.type === "mcq") delete q.s;
  if (q.type === "true-false") delete q.o, delete q.a;
  if (q.type === "short-answer") delete q.o, delete q.s;
  return q;
}
function test_parseWordExam() {
  const docId = "ID_FILE_WORD";
  const examId = "1001";
  const data = parseWordExam(docId, examId);
  Logger.log(JSON.stringify(data, null, 2));
}
