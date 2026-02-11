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
  ? `${targetUrl}?action=getQuestionsByCode&examCode=${examCode}&t=${Date.now()}`
  : `${targetUrl}?action=getQuestions&t=${Date.now()}`;


    const res = await fetch(finalUrl);
    const result = await res.json();

    if (result.status !== "success" || !Array.isArray(result.data))
      return [];

    const parsed = result.data.map((q: any) => {
      let obj = typeof q.question === "string"
        ? JSON.parse(q.question)
        : q;

      // 🔥 TRỘN MCQ
      if (obj.type === "mcq" && Array.isArray(obj.o)) {
        obj.o = shuffleArray([...obj.o]); // clone trước khi trộn
      }

      return obj;
    });

    // 🔥 Chia phần
    const part1 = parsed.filter(q => q.part?.includes("PHẦN I"));
    const part2 = parsed.filter(q => q.part?.includes("PHẦN II"));
    const part3 = parsed.filter(q => q.part?.includes("PHẦN III"));

    const final = [
      ...shuffleArray(part1),
      ...shuffleArray(part2),
      ...shuffleArray(part3),
    ];

    // 🔥 LƯU LUÔN JSON ĐÃ TRỘN
    questionsBankW = final.map(q => ({
      id: q.id,
      type: q.type,
      question: JSON.stringify(q),
    }));

    console.log("🎲 Đã trộn xong:", final);

    return questionsBankW;
  } catch (err) {
    console.error("Lỗi fetch:", err);
    return [];
  }
};
