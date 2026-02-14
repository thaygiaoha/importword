export type QuestionType = 'mcq' | 'true-false' | 'short-answer';

// BỔ SUNG: Khai báo để TypeScript không báo lỗi thư viện mammoth (xử lý file Word)
// @ts-ignore
declare module 'mammoth';

export interface TrueFalseStatement {
  text: string;
  a: boolean;
}

export interface Question {
  id: number | string;
  classTag: string;
  part: string;
  type: QuestionType;
  question: string;
  o?: string[];
  a?: string;
  s?: TrueFalseStatement[];
  loigiai?: string;
  shuffledOptions?: string[];
}

export interface Topic {
  id: number | string; // Bổ sung: Chấp nhận cả string cho linh hoạt
  name: string;
}

export interface FixedConfig {
  duration: number;
  numMC: number[]; 
  scoreMC: number;
  mcL3: number[]; // Ma trận mức độ C
  mcL4: number[]; // Ma trận mức độ D
  numTF: number[];
  scoreTF: number;
  tfL3: number[];
  tfL4: number[];
  numSA: number[];
  scoreSA: number;
  saL3: number[];
  saL4: number[];
}

export interface ExamCodeDefinition {
  code: string;
  name: string;
  topics: number[] | string[] | 'manual';
  fixedConfig?: FixedConfig;
}

export interface Student {
  sbd: string;
  name: string;
  class: string;
  school?: string;
  limit: number;
  limittab: number;
  idnumber: string;
  taikhoanapp: string;
  phoneNumber?: string;
  stk?: string;
  bank?: string;
}

export interface UserAnswer {
  questionId: number | string;
  answer: string | boolean[] | null;
}

export interface ExamConfig {
  id: string;
  title: string;
  time: number;
  mcqPoints: number;
  tfPoints: number;
  saPoints: number;
  gradingScheme: number;
}

export interface ExamResult {
  type?: 'exam' | 'quiz';
  timestamp: string;
  examCode: string;
  sbd: string;
  name: string;
  className: string;
  school?: string;
  phoneNumber?: string;
  score: number;
  totalTime: string;
  tabSwitches?: number;
  details: UserAnswer[];
  stk?: string;
  bank?: string;
}

export interface NewsItem {
  title: string;
  link: string;
}

export interface AppUser {
  phoneNumber: string;
  isVip: boolean;
  name?: string;
}

// ==========================================
// PHẦN BỔ SUNG MỚI: Dành cho Landing Page & AppContext
// ==========================================

export interface ClassInfo {
  id: string;
  grade: number;
  title: string;
  description: string;
  schedule: string;
  link: string;
}

export interface ScheduleGrid {
  days: string[];
  classNames: string[];
  cells: Record<string, string>;
}

export interface DocumentItem {
  id: number;
  title: string;
  type: string;
  date: string;
  downloadUrl: string;
}

export interface HeroData {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
}

export interface ContactData {
  phone: string;
  email: string;
  address: string;
}

export interface RatingData {
  average: number;
  total: number;
  breakdown: Record<number, number>;
}
