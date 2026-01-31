
import { Topic, ExamCodeDefinition, NewsItem, FixedConfig } from './types';
export const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbzKUxIb-pmb5zFZBgS9b0oJC-iptzA9Lmh9w1H4pXoEING0lGTDpqngdLaZNQceHlUS/exec";
export const DANHGIA_URL = DEFAULT_API_URL;
// Khởi tạo rỗng, chúng ta sẽ lấp đầy nó sau khi App chạy
export let API_ROUTING: Record<string, string> = {};
export let TOPICS_DATA: Record<string, Topic[]> = {
  "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": []
};
export const GRADES = [10, 11, 12];
// Hàm này sẽ gọi lên Script Admin để lấy danh sách link
export const fetchApiRouting = async () => {
  try {
    const response = await fetch(`${DEFAULT_API_URL}?action=getRouting`);
    const result = await response.json();
    if (result.status === "success") {
      const mapping: Record<string, string> = {};
      result.data.forEach((item: any) => {
        if (item.idNumber && item.link) {
          mapping[item.idNumber.toString().trim()] = item.link.trim();
        }
      });
      API_ROUTING = mapping;
      return mapping;
    }
  } catch (e) {
    console.error("Lỗi nạp Routing:", e);
  }
  return {};
};
// Nạp chuyên đề
// config.ts
export const fetchAdminConfig = async () => {
  try {
    const response = await fetch(`${DANHGIA_URL}?action=getAppConfig`);
    const result = await response.json();

    if (result.status === "success" && result.data) {
      const { topics } = result.data;
      const newTopics: Record<string, Topic[]> = { 
        "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": [] 
      };
      
      topics.forEach((t: any) => {
        const gradeStr = t.grade.toString().trim(); // Ép Khối về String
        const idStr = t.id.toString().trim();       // Ép ID về String

        if (newTopics[gradeStr]) {
          newTopics[gradeStr].push({
            id: idStr,
            name: t.name.toString()
          });
        }
      });

      TOPICS_DATA = newTopics;
      return true;
    }
  } catch (e) { console.error(e); }
  return false;
};

export const CLASS_ID = ["9A", "10A1", "11A1", "12A1", "Lớp khác"];
export const ADMIN_CONFIG = {  
  quizPassword: "6688",
  schools: [
    "THPT Yên Dũng số 2",
    "THPT Yên Dũng số 1",
    "THPT Lạng Giang số 1",
    "Trường khác"
  ],
  banks: ["Vietcombank", "Agribank", "MB Bank", "Ngân hàng khác"],
  CLASS_ID: CLASS_ID
};
export const OTHER_APPS = [
  { label: "Nhóm Zalo hỗ trợ", icon: "fab fa-comment", link: "https://zalo.me/0988948882" },
  { label: "Kênh Youtube Toán", icon: "fab fa-youtube", link: "https://youtube.com/..." },
  { label: "Máy tính Online", icon: "fas fa-calculator", link: "https://www.desmos.com/scientific" },
  { label: "Từ điển Toán học", icon: "fas fa-language", link: "https://..." }
];

// Loại 45 phút : MCQ = 12 (0.5đ); TF = 2 (1đ, 1 câu mức 3); SA = 4 (0.5đ, 1 câu mức 3, 1 câu mức 4)
const CONFIG_45P: FixedConfig = {
  duration: 45,
  numMC: [12], scoreMC: 0.5, mcL3: [0], mcL4: [0],
  numTF: [2], scoreTF: 1, tfL3: [1], tfL4: [0],
  numSA: [4], scoreSA: 0.5, saL3: [1], saL4: [1]
};

// Loại 90 phút : MCQ = 12 (0.25đ); TF = 4 (1đ, 2 câu mức 3); SA = 6 (0.5đ, 1 câu mức 3, 1 câu mức 4)
const CONFIG_90P: FixedConfig = {
  duration: 90,
  numMC: [12], scoreMC: 0.25, mcL3: [0], mcL4: [0],
  numTF: [4], scoreTF: 1, tfL3: [2], tfL4: [0],
  numSA: [6], scoreSA: 0.5, saL3: [1], saL4: [1]
};

export const EXAM_CODES: Record<number, ExamCodeDefinition[]> = {
 
  10: [
    { code: "TD_45_K10", name: "Tự do 45 phút (Khối 10)", topics: 'manual', fixedConfig: CONFIG_45P },
    { code: "TD_90_K10", name: "Tự do 90 phút (Khối 10)", topics: 'manual', fixedConfig: CONFIG_90P }
  ],
  11: [
    { code: "TD_45_K11", name: "Tự do 45 phút (10+11)", topics: 'manual', fixedConfig: CONFIG_45P },
    { code: "TD_90_K11", name: "Tự do 90 phút (10+11)", topics: 'manual', fixedConfig: CONFIG_90P }
  ],
  12: [
    { code: "TD_45_K12", name: "Tự do 45 phút (10+11+12)", topics: 'manual', fixedConfig: CONFIG_45P },
    { code: "TD_90_K12", name: "Tự do 90 phút (10+11+12)", topics: 'manual', fixedConfig: CONFIG_90P }
  ]
};
