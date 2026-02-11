console.log("===== DEBUG CHẤM ĐIỂM =====");
console.log("Questions:", questions);
console.log("Answers:", answers);
console.log("ScoreMCQ:", scoreMCQ);
console.log("ScoreTF:", scoreTF);
console.log("ScoreSA:", scoreSA);

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
  const labels = ["A", "B", "C", "D"];
  const selectedIndex = labels.indexOf(studentAns);

  if (selectedIndex !== -1 && original.o) {
    const selectedContent = original.o[selectedIndex];

    if (
      selectedContent?.toString().trim() ===
      original.a?.toString().trim()
    ) {
      point = Number(scMCQ);
    }
  }
}


    // =======================
    // 2️⃣ TRUE FALSE
    // =======================
   else if (qType === "true-false") {
  let correctCount = 0;

  if (Array.isArray(original.s)) {
    original.s.forEach((sub: any, i: number) => {
      const label = String.fromCharCode(65 + i); // A B C D
      const studentChoice = studentAns?.[label]; // "Đúng" / "Sai"

      const correctVal = sub.a === true ? "Đúng" : "Sai";

      if (studentChoice === correctVal) {
        correctCount++;
      }
    });
  }

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
