import { Question } from './types';
import { DANHGIA_URL } from './config';

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
  levels: { mc3: number[], mc4: number[], tf3: number[], tf4: number[], sa3: number[], sa4: number[] }
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
    
    // LỌC THÔNG MINH: Chấp nhận cả "1001" và "1001.3"
    const pool = questionsBank.filter(q => {
      const tag = q.classTag.toString();
      return tag === tidStr || tag.startsWith(tidStr + ".");
    });
    
    const getSub = (type: string, l3: number, l4: number, total: number) => {
      const typePool = pool.filter(q => q.type === type);
      
      // Lọc mức độ 3 và 4
      const p4 = typePool.filter(q => q.classTag.toString().endsWith(".4"));
      const p3 = typePool.filter(q => q.classTag.toString().endsWith(".3"));
      const pOther = typePool.filter(q => 
        !q.classTag.toString().endsWith(".3") && 
        !q.classTag.toString().endsWith(".4")
      );

      let res4 = shuffleArray(p4).slice(0, l4);
      let deficit4 = Math.max(0, l4 - res4.length); 
      let res3 = shuffleArray(p3).slice(0, l3 + deficit4);
      
      let res = [...res4, ...res3];
      const remainingNeeded = total - res.length;
      
      if (remainingNeeded > 0) {
        res = [...res, ...shuffleArray(pOther).slice(0, remainingNeeded)];
      }
      return res;
    };

    selectedPart1 = [...selectedPart1, ...getSub('mcq', levels.mc3[idx] || 0, levels.mc4[idx] || 0, counts.mc[idx] || 0)];
    selectedPart2 = [...selectedPart2, ...getSub('true-false', levels.tf3[idx] || 0, levels.tf4[idx] || 0, counts.tf[idx] || 0)];
    selectedPart3 = [...selectedPart3, ...getSub('short-answer', levels.sa3[idx] || 0, levels.sa4[idx] || 0, counts.sa[idx] || 0)];
  });

  // Trộn đáp án trước khi xuất xưởng
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
