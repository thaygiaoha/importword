export const fetchQuestionsBankW = async (
  examCode?: string,
  idgv?: string,
  customUrl?: string
): Promise<Question[]> => {
  try {
    let targetUrl = customUrl
      ? customUrl
      : idgv && API_ROUTING[idgv]
      ? API_ROUTING[idgv]
      : DANHGIA_URL;

    const finalUrl = examCode
      ? `${targetUrl}?action=getQuestionsByCode&examCode=${examCode}`
      : `${targetUrl}?action=getQuestions`;

    const res = await fetch(finalUrl);
    const result = await res.json();

    if (result.status !== "success" || !Array.isArray(result.data))
      return [];

    // 🔥 Parse + trộn đáp án
    const parsed = result.data.map((q: any) => {
      let obj = q;

      if (typeof q.question === "string") {
        try {
          obj = JSON.parse(q.question);
        } catch {}
      }

      // 👉 Trộn đáp án MCQ
      if (obj.type === "mcq" && Array.isArray(obj.o)) {
        obj.o = shuffleArray(obj.o);
      }

      return obj;
    });

    // 🔥 Chia phần
    const part1 = parsed.filter(q => q.part?.includes("PHẦN I"));
    const part2 = parsed.filter(q => q.part?.includes("PHẦN II"));
    const part3 = parsed.filter(q => q.part?.includes("PHẦN III"));

    // 🔥 Trộn nội bộ từng phần
    const final = [
      ...shuffleArray(part1),
      ...shuffleArray(part2),
      ...shuffleArray(part3),
    ];

    // 🔥 stringify lại để giữ tương thích scoreWord
    questionsBankW = final.map(q => ({
      id: q.id,
      type: q.type,
      question: JSON.stringify(q),
    }));

    return questionsBankW;
  } catch (err) {
    console.error("Lỗi fetch:", err);
    return [];
  }
};
