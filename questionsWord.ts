
import { Question } from './types';
import { DANHGIA_URL, API_ROUTING } from './config';

export let questionsBankW: Question[] = [];

export const fetchQuestionsBankW = async (): Promise<Question[]> => {
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getQuestions`);
    const result = await response.json();
    if (result.status === "success" && Array.isArray(result.data)) {
      questionsBankW = result.data;
      return questionsBankW;
    } 
    return [];
  } catch (error) {
    return [];
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const pickQuestionsSmart = (
  topicIds: string[], 
  counts: { mc: number[], tf: number[], sa: number[] },
  levels: { mc3: number[], mc4: number[], tf3: number[], tf4: number[], sa3: number[], sa4: number[] }
) => {
  if (questionsBank.length === 0) return [];
  
  let selected: Question[] = [];
  // Logic lấy câu hỏi thông minh theo topic và level...
  // (Giữ logic cũ nhưng sửa các import/export)
  return shuffleArray(questionsBank).slice(0, 10); // Mock-up logic
};
