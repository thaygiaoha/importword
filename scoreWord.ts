export const scoreWord = (questions: any[], answers: Record<number, any>) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;
    const qType = (q.type || "").toString().trim().toLowerCase();

    // PHẦN I: Trắc nghiệm (MCQ) - 0.25đ mỗi câu
    if (qType === 'mcq') {
      if (studentAns === q.a) {
        point = 0.25;
      }
    }

    // PHẦN II: Đúng/Sai - Chấm lũy tiến theo quy chế Bộ GD
    else if (qType === 'true-false') {
      const subQuestions = q.s || q.o || [];
      let correctCount = 0;

      subQuestions.forEach((sub: any, sIdx: number) => {
        const subLabel = String.fromCharCode(65 + sIdx);
        // Chấp nhận cả boolean true/false hoặc chuỗi "Đúng"/"Sai" từ dữ liệu
        const isTrue = sub.a === true || sub.a === 'Đúng';
        const correctValue = isTrue ? 'Đúng' : 'Sai';
        
        if (studentAns?.[subLabel] === correctValue) {
          correctCount++;
        }
      });

      // Thang điểm lũy tiến: 1 ý: 0.1 | 2 ý: 0.25 | 3 ý: 0.5 | 4 ý: 1.0
      const progression = { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 };
      point = progression[correctCount as keyof typeof progression] || 0;
    }

    // PHẦN III: Trả lời ngắn (SA) - 0.5đ mỗi câu
    else if (qType === 'sa' || qType === 'short-answer') {
      // Chuẩn hóa: bỏ khoảng trắng, đổi phẩy thành chấm để so sánh số
      const normalize = (val: any) => val?.toString().trim().replace(',', '.').toLowerCase() || "";
      if (normalize(studentAns) !== "" && normalize(studentAns) === normalize(q.a)) {
        point = 0.5;
      }
    }

    totalScore += point;
    details.push({ id: q.id, point });
  });

  return {
    totalScore: Math.round(totalScore * 100) / 100, // Làm tròn 2 chữ số thập phân
    details
  };
};
