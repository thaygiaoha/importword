
export type QuestionType = 'mcq' | 'true-false' | 'short-answer';

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
  id: number;
  name: string;
}

export interface FixedConfig {
  duration: number;
  numMC: number[]; 
  scoreMC: number;
  mcL3: number[];
  mcL4: number[];
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
  topics: number[] | 'manual';
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
