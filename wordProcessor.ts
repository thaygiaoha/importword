import mammoth from 'mammoth';

export const handleWordUpload = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        // Giữ lại định dạng gạch chân (u) để nhận diện đáp án
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: ["u => u"]
        });
        
        const html = result.value;
        // Tách câu dựa trên chữ "Câu X:" hoặc "Câu X."
        const chunks = html.split(/Câu\s+\d+[\.:]/g).filter(c => c.length > 10);
        let currentPart = "PHẦN I";

        const questions = chunks.map((chunk, index) => {
          // Nhận diện chuyển phần
          if (chunk.toUpperCase().includes("PHẦN I")) currentPart = "PHẦN I";
          if (chunk.toUpperCase().includes("PHẦN II")) currentPart = "PHẦN II";
          if (chunk.toUpperCase().includes("PHẦN III")) currentPart = "PHẦN III";

          // 1. Lấy mã kiến thức [abcd.z]
          const tagMatch = chunk.match(/\[(.*?)\]/);
          // 2. Lấy ảnh Base64
          const imgMatch = chunk.match(/src="data:image\/(.*?);base64,(.*?)"/);
          
       // Khởi tạo các biến đáp án
          let type = "mcq";
          let answerA = "";     // Cho a (MCQ/SA)
          let answerTF = "";    // Cho answerTF (Phần II)

          if (currentPart === "PHẦN I") {
            type = "mcq";
            const ansMatch = chunk.match(/<u>([A-D])[\.:]<\/u>/i) || chunk.match(/<u>([A-D])<\/u>/i);
            answerA = ansMatch ? ansMatch[1].toUpperCase() : "";
          } 
          else if (currentPart === "PHẦN II") {
            type = "true-false";
            // Check 4 ý a, b, c, d có gạch chân <u> hay không
            const tfArray = ['a', 'b', 'c', 'd'].map(l => {
              const reg = new RegExp(`<u>${l}[\\.\\)]`, 'i');
              return reg.test(chunk) ? "T" : "F";
            });
            answerTF = tfArray.join("-"); // Kết quả dạng: T-F-F-T
          } 
          else {
            type = "short-answer";
            const keyMatch = chunk.match(/<key=\s*(.*?)>/);
            answerA = keyMatch ? keyMatch[1] : "";
          }

          return {
            id: Date.now() + index,
            classTag: tagMatch ? tagMatch[1] : "",
            part: currentPart,
            type: type,
            question: chunk.replace(/<img[^>]*>/g, "").replace(/\[(.*?)\]/g, "").replace(/<\/?[^>]+(>|$)/g, "").trim(),
            a: answerA,       // Khớp với a trong Interface
            answerTF: answerTF, // Khớp với answerTF trong Interface
            image: imgMatch ? imgMatch[2] : "" 
          };
        });
        resolve(questions);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};
