export const scoreWord = (
  questions: any[], 
  answers: Record<number, any>,
  scMCQ: number = 0.25, // Điểm mặc định nếu sheet trống
  scTF: number = 1.0,   // Điểm tối đa câu Đúng/Sai
  scSA: number = 0.5    // Điểm câu trả lời ngắn
) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;
    const qType = (q.type || "").toString().trim().toLowerCase();

    // 1. PHẦN I: Trắc nghiệm (MCQ) - Lấy điểm từ cột D
    if (qType === 'mcq') {
      if (studentAns === q.a) {
        point = scMCQ;
      }
    }

    // 2. PHẦN II: Đúng/Sai - Lấy điểm tối đa từ cột F và chia lũy tiến
    else if (qType === 'true-false') {
      const subQuestions = q.s || q.o || [];
      let correctCount = 0;

      subQuestions.forEach((sub: any, sIdx: number) => {
        const subLabel = String.fromCharCode(65 + sIdx);
        const correctValue = (sub.a === true || sub.a === 'Đúng') ? 'Đúng' : 'Sai';
        if (studentAns?.[subLabel] === correctValue) {
          correctCount++;
        }
      });

      // Quy chế lũy tiến dựa trên mức điểm tối đa (scTF)
      // Thường là: 1 ý (1/10 điểm tối đa), 2 ý (1/4), 3 ý (1/2), 4 ý (điểm tối đa)
      const progression: Record<number, number> = {
        1: Math.round(scTF * 0.1 * 100) / 100,
        2: Math.round(scTF * 0.25 * 100) / 100,
        3: Math.round(scTF * 0.5 * 100) / 100,
        4: scTF
      };
      point = progression[correctCount] || 0;
    }

    // 3. PHẦN III: Trả lời ngắn (SA) - Lấy điểm từ cột H
    else if (qType === 'sa' || qType === 'short-answer') {
      const normalize = (val: any) => val?.toString().trim().replace(',', '.').toLowerCase() || "";
      if (normalize(studentAns) !== "" && normalize(studentAns) === normalize(q.a)) {
        point = scSA;
      }
    }

    totalScore += point;
    details.push({ id: q.id, point });
  });

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    details
  };
};
