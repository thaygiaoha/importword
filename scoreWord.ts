export const scoreWord = (
  questions: any[],
  answers: Record<number, any>,
  scMCQ: number,
  scTF: number,
  scSA: number
) => {
  let totalScore = 0;
  const details: any[] = [];

  questions.forEach((q, idx) => {
    const studentAns = answers[idx];
    let point = 0;

    // 🔥 PARSE JSON GỐC
    let original = {};
    try {
      original = JSON.parse(q.question);
    } catch (e) {
      console.error("Lỗi parse question JSON:", q.question);
    }

    const qType = (original.type || "").toString().trim().toLowerCase();

    // =======================
    // 1️⃣ MCQ
    // =======================
    if (qType === "mcq") {
      if (
        String(studentAns).trim().toUpperCase() ===
        String(original.a).trim().toUpperCase()
      ) {
        point = Number(scMCQ);
      }
    }

    // =======================
    // 2️⃣ TRUE FALSE
    // =======================
    else if (qType === "true-false") {
      let correctCount = 0;
      const labels = ["A", "B", "C", "D"];

      labels.forEach((label) => {
        const studentChoice = studentAns?.[label];
        const correctVal = original.sub_answers?.[label];

        if (
          studentChoice &&
          correctVal &&
          studentChoice.toString().trim() ===
            correctVal.toString().trim()
        ) {
          correctCount++;
        }
      });

      const progression: Record<number, number> = {
        1: Number((scTF * 0.1).toFixed(2)),
        2: Number((scTF * 0.25).toFixed(2)),
        3: Number((scTF * 0.5).toFixed(2)),
        4: Number(scTF),
      };

      point = progression[correctCount] || 0;
    }

    // =======================
    // 3️⃣ SHORT ANSWER
    // =======================
    else if (qType === "sa" || qType === "short-answer") {
      const normalize = (val: any) =>
        val?.toString().trim().toLowerCase().replace(",", ".") || "";

      if (
        normalize(studentAns) !== "" &&
        normalize(studentAns) === normalize(original.a)
      ) {
        point = Number(scSA);
      }
    }

    totalScore += point;
    details.push({ id: original.id || idx, point });
  });

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    details,
  };
};
