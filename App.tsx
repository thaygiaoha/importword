import React, { useState, useEffect } from 'react';
import { Student, ExamResult, Question, AppUser } from './types';
import { API_ROUTING, DEFAULT_API_URL, DANHGIA_URL, fetchApiRouting, fetchAdminConfig } from './config';
// Sửa lại đoạn này trong App.tsx của thầy:
import LandingPage from '@/components/LandingPage';
import ExamPortal from '@/components/ExamPortal';
import QuizInterface from '@/components/QuizInterface';
import ResultView from '@/components/ResultView';
import Footer from '@/components/Footer';
import { getRandomQuizQuestion } from '@/questionquiz'; // Giả sử file này ở src/questionquiz
import { AppProvider } from '@/contexts/AppContext';
import AdminPanel from '@/components/AdminManager';
import TeacherWordTask from '@/components/TeacherWordTask';
// Thêm dấu ngoặc nhọn bao quanh tên hàm
import { fetchQuestionsBank } from '@/questions';
import { fetchQuestionsBankW } from '@/questionsWord';
const App: React.FC = () => {
  // 1. Quản lý các màn hình (Views)
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'quiz' | 'result' | 'admin' | 'teacher_task'>('landing');
  
  // 2. Quản lý chế độ (Mode) cho Admin hoặc Giáo viên
  const [adminMode, setAdminMode] = useState<'matran' | 'cauhoi' | 'word'>('matran'); 
  
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
 
  
  // Khởi tạo dữ liệu hệ thống
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("🚀 Hệ thống bắt đầu khởi tạo...");
        await Promise.all([
          fetchAdminConfig(),
          fetchApiRouting(),
          fetchQuestionsBank(),
          fetchQuestionsBankW()
        ]);
        console.log("✅ Tất cả dữ liệu đã nạp xong!");
      } catch (e) {
        console.error("❌ Lỗi khởi tạo:", e);
      }
    };
    initApp();
  }, []);
 // Lấy link sang web mới khi vào thi theo ma thận
 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const gradeParam = params.get("grade");

  if (gradeParam) {
    setSelectedGrade(gradeParam);
    setCurrentView("portal");   // 👈 QUAN TRỌNG
  }
}, []);



  // Xử lý bắt đầu thi (Portal)
  const handleStartExam = (config: any, student: Student, selectedQuestions: Question[]) => {
    setActiveExam(config);
    setActiveStudent(student);
    setQuestions(selectedQuestions);
    setCurrentView('quiz');
  };

  // Xử lý bắt đầu Quiz nhanh (Landing)
  const handleStartQuizMode = (num: number, pts: number, quizStudent: any) => {
    const quizQuestions: Question[] = [];
    const usedIds = new Set<string | number>();
    for(let i=0; i<num; i++) {
      const q = getRandomQuizQuestion(Array.from(usedIds) as any);
      usedIds.add(q.id);
      quizQuestions.push({...q, shuffledOptions: q.o ? [...q.o].sort(() => 0.5 - Math.random()) : undefined});
    }
    setActiveExam({ id: 'QUIZ', title: `Luyện tập Quiz (${num} câu)`, time: 15, mcqPoints: pts, tfPoints: pts, saPoints: pts, gradingScheme: 1 });
    setActiveStudent({ 
      sbd: quizStudent.phoneNumber || 'QUIZ_GUEST', 
      name: quizStudent.name || 'Khách', 
      class: quizStudent.class || 'Tự do',
      school: quizStudent.school || 'Tự do',
      phoneNumber: quizStudent.phoneNumber,
      stk: quizStudent.stk,
      bank: quizStudent.bank,
      limit: 10, 
      limittab: 10, 
      idnumber: 'QUIZ', 
      taikhoanapp: user?.isVip ? 'VIP' : 'FREE' 
    });
    setQuestions(quizQuestions);
    setCurrentView('quiz');
  };

  // Kết thúc bài thi và gửi dữ liệu
  const handleFinishExam = async (result: ExamResult) => {
    setExamResult(result);
    setCurrentView('result');
    let targetUrl = DEFAULT_API_URL;
    if (result.type === 'quiz') targetUrl = DANHGIA_URL;
    else if (activeStudent && API_ROUTING[activeStudent.idnumber]) targetUrl = API_ROUTING[activeStudent.idnumber];

    try {
      await fetch(targetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(result) });
    } catch (e) { console.error("Lỗi gửi kết quả:", e); }
  };

  const goHome = () => {
    setCurrentView('landing');
    setActiveExam(null);
    setActiveStudent(null);
    setExamResult(null);
  };

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 bg-slate-50 text-slate-900">
        <header className="bg-blue-800 text-white py-8 md:py-12 shadow-2xl text-center relative overflow-hidden border-b-8 border-blue-900 px-4">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter mb-2 drop-shadow-lg leading-tight">
              HỆ THỐNG HỌC TẬP VÀ KIỂM TRA ONLINE <br className="md:hidden" /> MÔN TOÁN THPT
            </h1>
            <p className="text-sm md:text-lg opacity-90 font-black tracking-wide max-w-2xl mx-auto uppercase">
              Học tập chuyên nghiệp - Kết quả bứt phá
            </p>
          </div>
        </header>

        <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-10">
          <div className="flex flex-col gap-6">
            
            {/* 1. Trang chủ */}
            {currentView === 'landing' && (
              <LandingPage 
                user={user} 
                onOpenAuth={() => setShowAuth(true)} 
                onOpenVip={() => user ? setShowVipModal(true) : setShowAuth(true)}
                onSelectGrade={(grade) => { setSelectedGrade(grade.toString()); setCurrentView('portal'); }} 
                onSelectQuiz={handleStartQuizMode}
                setView={(mode: any) => {
                  if (mode === 'word' || mode === 'matran') {
                    setCurrentView('teacher_task'); 
                    setAdminMode(mode);
                  } else {
                    setAdminMode(mode);
                    setCurrentView('admin');
                  }
                }} 
              />
            )}

            {/* 2. Quản lý Admin */}
            {currentView === 'admin' && (
              <AdminPanel mode={adminMode} onBack={goHome} />
            )}

            {/* 3. Nhiệm vụ Giáo viên (Từ App1) */}
            {currentView === 'teacher_task' && (
              <TeacherWordTask mode={adminMode} onBack={goHome} />
            )}

            {/* 4. Cổng chọn đề thi */}
            {currentView === 'portal' && selectedGrade && (
              <ExamPortal grade={selectedGrade} onBack={goHome} onStart={handleStartExam} />
            )}

            {/* 5. Giao diện làm bài */}
            {currentView === 'quiz' && activeExam && activeStudent && (
              <QuizInterface 
                config={activeExam} 
                student={activeStudent} 
                questions={questions} 
                onFinish={handleFinishExam} 
                isQuizMode={activeExam.id === 'QUIZ'} 
              />
            )}

            {/* 6. Kết quả bài thi */}
            {currentView === 'result' && examResult && (
              <ResultView result={examResult} questions={questions} onBack={goHome} />
            )}
          </div>
        </main>

        {/* Các Modal hỗ trợ */}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={(u) => { setUser(u); setShowAuth(false); }} />}
        {showVipModal && user && <VipModal user={user} onClose={() => setShowVipModal(false)} onSuccess={() => { setUser(prev => prev ? {...prev, isVip: true} : null); setShowVipModal(false); }} />}

        <Footer />
      </div>
    </AppProvider>
  );
};

// --- COMPONENT CON: ĐĂNG NHẬP ---
const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (u: AppUser) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { type: 'register', phone, pass };
      await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      onSuccess({ phoneNumber: phone, isVip: false });
    } catch (e) {
      alert("Đã xảy ra lỗi kết nối!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-fade-in border border-slate-100">
        <div className="p-10">
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="tel" placeholder="Số điện thoại" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-blue-500" value={phone} onChange={e=>setPhone(e.target.value)} />
            <input required type="password" placeholder="Mật khẩu" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-blue-500" value={pass} onChange={e=>setPass(e.target.value)} />
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95 border-b-4 border-blue-800 uppercase">
              {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'VÀO HỆ THỐNG' : 'TẠO TÀI KHOẢN')}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-slate-400 font-black hover:text-blue-600 transition text-sm">
            {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">✕</button>
      </div>
    </div>
  );
};

// --- COMPONENT CON: VIP ---
const VipModal = ({ user, onClose, onSuccess }: { user: AppUser, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const handleVipRegister = async () => {
    setLoading(true);
    try {
      const payload = { type: 'vip', phone: user.phoneNumber };
      await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      alert("Đã gửi yêu cầu nâng cấp VIP!");
      onSuccess();
    } catch (e) { alert("Lỗi!"); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-fade-in relative border border-orange-100">
        <h2 className="text-3xl font-black text-orange-500 mb-2 uppercase tracking-tighter">NÂNG CẤP VIP</h2>
        <button onClick={handleVipRegister} disabled={loading} className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-orange-700">
          {loading ? "ĐANG GỬI..." : "XÁC NHẬN ĐĂNG KÝ VIP"}
        </button>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">✕</button>
      </div>
    </div>
  );
};

export default App;
