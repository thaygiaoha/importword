import { Question } from './types';
import { DANHGIA_URL, API_ROUTING } from './config';

// 1. Lưu trữ ngân hàng câu hỏi
export let questionsBank: Question[] = [];

// 2. Hàm nạp dữ liệu từ Google Sheet
export const fetchQuestionsBank = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getQuestions`);
    const result = await response.json();
    
    if (result.status === "success" && Array.isArray(result.data)) {
      questionsBank = result.data;
      console.log(`✅ Đã nạp ${questionsBank.length} câu hỏi vào hệ thống.`);
      return questionsBank;
    } 
    return [];
  } catch (error) {
    console.error("❌ Lỗi kết nối ngân hàng câu hỏi:", error);
    return [];
  }
};

// 3. Hàm trộn mảng
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 4. Hàm lấy đề thi thông minh
export const pickQuestionsSmart = (
  topicIds: string[], 
  counts: { mc: number[], tf: number[], sa: number[] },
  // Cập nhật tên biến mức độ cho đồng bộ c, d
  levels: { mcc: number[], mcd: number[], tfc: number[], tfd: number[], sac: number[], sad: number[] }
) => {
  let selectedPart1: Question[] = [];
  let selectedPart2: Question[] = [];
  let selectedPart3: Question[] = [];
  
  if (questionsBank.length === 0) {
    console.warn("⚠️ Ngân hàng câu hỏi đang trống!");
    return [];
  }
  
  topicIds.forEach((tid, idx) => {
    const tidStr = tid.toString();
    
    // Giữ nguyên logic lọc Topic của bản gốc
    const pool = questionsBank.filter(q => {
      const tag = q.classTag.toString();
      return tag === tidStr || tag.startsWith(tidStr + ".");
    });
    
    const getSub = (type: string, lc: number, ld: number, total: number) => {
      const typePool = pool.filter(q => q.type === type);
      
      // THAY ĐỔI: Chuyển .4 -> .d và .3 -> .c
      const p4 = typePool.filter(q => q.classTag.toString().endsWith(".d"));
      const p3 = typePool.filter(q => q.classTag.toString().endsWith(".c"));
      
      // Giữ nguyên logic lọc pOther (mức 1, 2)
      const pOther = typePool.filter(q => 
        !q.classTag.toString().endsWith(".c") && 
        !q.classTag.toString().endsWith(".d")
      );

      let res4 = shuffleArray(p4).slice(0, ld);
      let deficit4 = Math.max(0, ld - res4.length); 
      let res3 = shuffleArray(p3).slice(0, lc + deficit4);
      
      let res = [...res4, ...res3];
      const remainingNeeded = total - res.length;
      
      if (remainingNeeded > 0) {
        res = [...res, ...shuffleArray(pOther).slice(0, remainingNeeded)];
      }
      return res;
    };

    // THAY ĐỔI: Truyền tham số levels c, d tương ứng
    selectedPart1 = [...selectedPart1, ...getSub('mcq', levels.mcc[idx] || 0, levels.mcd[idx] || 0, counts.mc[idx] || 0)];
    selectedPart2 = [...selectedPart2, ...getSub('true-false', levels.tfc[idx] || 0, levels.tfd[idx] || 0, counts.tf[idx] || 0)];
    selectedPart3 = [...selectedPart3, ...getSub('short-answer', levels.sac[idx] || 0, levels.sad[idx] || 0, counts.sa[idx] || 0)];
  });

  // BỔ SUNG TỪ BẢN 1: Trộn đáp án/ý hỏi trước khi xuất xưởng
  return [...selectedPart1, ...selectedPart2, ...selectedPart3].map(q => {
    const newQ = { ...q };
    if (newQ.o && newQ.type === 'mcq') {
      newQ.shuffledOptions = shuffleArray(newQ.o);
    }
    if (newQ.s && newQ.type === 'true-false') {
      newQ.s = shuffleArray(newQ.s);
    }
    return newQ;
  });
};
