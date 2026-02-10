export const scoreWord = (
  questions: any[], 
  answers: Record<number, any>,
  scMCQ: number = 0.25, 
  scTF: number = 1.0,   
  scSA: number = 0.5    
) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;
    const qType = (q.type || "").toString().trim().toLowerCase();

    // 1. MCQ
    if (qType === 'mcq') {
      if (String(studentAns).trim().toUpperCase() === String(q.a).trim().toUpperCase()) {
        point = Number(scMCQ);
      }
    }

    // 2. TRUE-FALSE (Sửa chỗ này để khớp với sheet exam_data)
    else if (qType === 'true-false') {
      const subQuestions = q.options || []; // Sheet dùng 'options'
      let correctCount = 0;

      subQuestions.forEach((sub: any, sIdx: number) => {
        const subLabel = String.fromCharCode(65 + sIdx);
        // Đáp án đúng từ sheet: true/false -> Chuyển về 'Đúng'/'Sai'
        const correctValue = (sub.a === true || sub.a?.toString().toLowerCase() === 'true') ? 'Đúng' : 'Sai';
        
        if (studentAns?.[subLabel] === correctValue) {
          correctCount++;
        }
      });

      const progression: Record<number, number> = {
        1: Math.round(scTF * 0.1 * 100) / 100,
        2: Math.round(scTF * 0.25 * 100) / 100,
        3: Math.round(scTF * 0.5 * 100) / 100,
        4: Number(scTF)
      };
      point = progression[correctCount] || 0;
    }

    // 3. SHORT ANSWER
    else if (qType === 'sa' || qType === 'short-answer') {
      const normalize = (val: any) => val?.toString().trim().toLowerCase().replace(',', '.') || "";
      if (normalize(studentAns) !== "" && normalize(studentAns) === normalize(q.a)) {
        point = Number(scSA);
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
