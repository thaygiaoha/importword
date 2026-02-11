export const scoreWord = (
  questions: any[], 
  answers: Record<number, any>,
  // Truyền trực tiếp scoreMCQ, scoreTF, scoreSA từ hàng dữ liệu của đề thi đó trong sheet exams
  scMCQ: number,  
  scTF: number,   
  scSA: number    
) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;
    const qType = (q.type || "").toString().trim().toLowerCase();

    // 1. MCQ (Trắc nghiệm 1 đáp án)
    if (qType === 'mcq') {
      if (String(studentAns).trim().toUpperCase() === String(q.a).trim().toUpperCase()) {
        point = Number(scMCQ);
      }
    }

    // 2. TRUE-FALSE (Trắc nghiệm Đúng/Sai nhiều ý)
    else if (qType === 'true-false') {
      const subQuestions = q.options || []; 
      let correctCount = 0;

      subQuestions.forEach((sub: any, sIdx: number) => {
        const subLabel = String.fromCharCode(65 + sIdx);
        // Chuẩn hóa đáp án từ sheet và từ học sinh để so sánh
        const correctValue = (sub.a === true || sub.a?.toString().toLowerCase() === 'true' || sub.a?.toString() === 'Đúng') ? 'Đúng' : 'Sai';
        
        if (studentAns?.[subLabel] === correctValue) {
          correctCount++;
        }
      });

      // Tính điểm theo quy định của Bộ (0.1 - 0.25 - 0.5 - 1.0 hệ số với scTF)
      const progression: Record<number, number> = {
        1: Math.round(scTF * 0.1 * 100) / 100,
        2: Math.round(scTF * 0.25 * 100) / 100,
        3: Math.round(scTF * 0.5 * 100) / 100,
        4: Number(scTF)
      };
      point = progression[correctCount] || 0;
    }

    // 3. SHORT ANSWER (Trả lời ngắn)
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
    details: JSON.stringify(details) // Chuyển sang string để lưu vào sheet dễ dàng hơn
  };
};
