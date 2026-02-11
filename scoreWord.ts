export const scoreWord = (questions: any[], answers: Record<number, any>, scMCQ: number, scTF: number, scSA: number) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;
    const qType = (q.type || "").toString().trim().toLowerCase();

    // 1. MCQ (Phần I)
    if (qType === 'mcq') {
      // Đáp án học sinh chọn là 'A', 'B', 'C', 'D'
      // Ta tìm nội dung của lựa chọn đó trong mảng q.o (nếu bạn đã map cột o1, o2, o3, o4 vào q.o)
      // Hoặc đơn giản là so sánh studentAns với đáp án đúng q.a (nếu q.a lưu chữ A, B, C, D)
      if (String(studentAns).trim().toUpperCase() === String(q.a).trim().toUpperCase()) {
        point = Number(scMCQ);
      }
    }

    // 2. TRUE-FALSE (Phần II)
    else if (qType === 'true-false') {
      let correctCount = 0;
      // Dữ liệu từ sheet exam_data nạp vào thường có dạng: 
      // sub_answers: { A: 'Đúng', B: 'Sai', ... } lấy từ các cột ans_a, ans_b...
      const labels = ['A', 'B', 'C', 'D'];
      
      labels.forEach((label) => {
        const studentChoice = studentAns?.[label]; // 'Đúng' hoặc 'Sai'
        const correctVal = q.sub_answers?.[label]; // Bạn cần map cột ans_a... vào object này
        
        if (studentChoice && correctVal && studentChoice.toString().trim() === correctVal.toString().trim()) {
          correctCount++;
        }
      });

      const progression: Record<number, number> = {
        1: Number((scTF * 0.1).toFixed(2)),
        2: Number((scTF * 0.25).toFixed(2)),
        3: Number((scTF * 0.5).toFixed(2)),
        4: Number(scTF)
      };
      point = progression[correctCount] || 0;
    }

    // 3. SHORT ANSWER (Phần III)
    else if (qType === 'sa' || qType === 'short-answer') {
      const normalize = (val: any) => val?.toString().trim().toLowerCase().replace(',', '.') || "";
      if (normalize(studentAns) !== "" && normalize(studentAns) === normalize(q.a)) {
        point = Number(scSA);
      }
    }

    totalScore += point;
    details.push({ id: q.id, point });
  });

  return { totalScore: Math.round(totalScore * 100) / 100, details };
};
