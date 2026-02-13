import { Question } from './types';
import { DANHGIA_URL, API_ROUTING } from './config'; // Nhập API_ROUTING vào đây

export let questionsBankW: Question[] = [];

const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * Lấy câu hỏi linh hoạt:
 * 1. Nếu có customUrl (GV tự nhập link file riêng) -> Dùng luôn.
 * 2. Nếu có idgv -> Tra cứu trong API_ROUTING.
 * 3. Nếu không có gì -> Dùng DANHGIA_URL (Admin).
 */
export const fetchQuestionsBankW = async (
  examCode?: string, 
  idgv?: string, 
  customUrl?: string
): Promise<Question[]> => {
  try {
    // Logic xác định "đầu nguồn" dữ liệu
    let targetUrl = DANHGIA_URL;
    
    if (customUrl) {
      targetUrl = customUrl; // Ưu tiên 1: Link GV tự dán vào
    } else if (idgv && API_ROUTING[idgv]) {
      targetUrl = API_ROUTING[idgv]; // Ưu tiên 2: Link định tuyến theo ID
    }

    // Xây dựng URL cuối cùng
    const finalUrl = examCode 
      ? `${targetUrl}?action=getQuestionsByCode&examCode=${examCode}`
      : `${targetUrl}?action=getQuestions`;

    const response = await fetch(finalUrl);
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      questionsBankW = shuffleArray(result.data);
      return questionsBankW;
    } 
    return [];
  } catch (error) {
    console.error("Lỗi fetch questions:", error);
    return [];
  }
};
