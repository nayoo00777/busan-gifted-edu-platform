import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, BookOpen, Award, Compass, FolderOpen, MessageSquare, 
  Calendar, Megaphone, User, Lock, Unlock, Sparkles, Send, 
  ArrowRight, Building, CheckCircle, Download, Plus, FileText, 
  Brain, Menu, X, ChevronRight, HelpCircle, Phone, Globe, ExternalLink
} from 'lucide-react';

// ==========================================
// 1. FIREBASE CONFIG & INITIALIZATION (기획안 요구 시 활용용 프레임워크)
// * 본 플랫폼은 빠른 로컬 체험을 위해 기본적으로 메모리 상태를 사용합니다.
// ==========================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'busan-gifted-edu-platform';

// ==========================================
// 2. GEMINI AI CHATBOT CONFIG (실시간 AI 상담용)
// ==========================================
const apiKey = ""; // 런타임시 환경변수로 자동 주입됩니다.

// 지수 백오프가 적용된 Gemini API 호출 함수
async function fetchGeminiResponse(userQuery, chatHistory = []) {
  const model = "gemini-2.5-flash-preview-09-2025";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const systemPrompt = `
    당신은 "부산광역시교육청영재교육진흥원"에서 운영하는 "부산 영재교육 통합 플랫폼"의 공식 AI 상담 서비스 챗봇 '영재누리봇'입니다.
    친절하고 전문적이며 신뢰감 있는 교육 전문가의 어조로 학생, 학부모, 교원의 질문에 답변해야 합니다.
    주요 정보 범위:
    1. 부산 영재교육 안내: 영재교육의 목적, 정책, 제도 안내.
    2. 기관 프로그램: 부산지역 영재교육원(교육지원청 영재교육원, 고등학교 영재학급 등) 및 선발 정보. 보통 10~11월 선발 공고, 12월 전형 진행.
    3. 진로 및 진학: 과학고, 영재학교(한국과학영재학교 등), 이공계 진로 탐색 가이드.
    4. 상담 지원: 자녀의 관찰 방법, 영재성 판별 기준, 맞춤형 영재교육 추천.
    5. 소통마당 및 챗봇 편의기능 제공.
    
    답변 시에는 가독성이 좋게 bullet point나 번호 매기기를 적극 활용하고, 부산 교육 정책에 부합하는 올바른 격려와 지원의 메시지를 포함해주세요.
  `;

  // 대화 히스토리 포맷 구성
  const contents = [];
  chatHistory.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });
  // 새로운 사용자 질문 추가
  contents.push({
    role: 'user',
    parts: [{ text: userQuery }]
  });

  const payload = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";
      }
    } catch (error) {
      // 에러 발생 시 백오프 진행
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }
  return "현재 AI 상담실 접속자가 많아 연결이 원활하지 않습니다. 잠시 후 다시 시도해주시거나 영재교육 Q&A 게시판을 이용해주세요.";
}

// ==========================================
// 3. MOCK DATA DEFINITION (초기 콘텐츠 리소스)
// ==========================================
const INITIAL_RESOURCES = [
  {
    id: 1,
    title: "2026학년도 초등 수학/과학 영재교육원 선발 대비 관찰추천제 가이드북",
    category: "교수학습자료",
    target: "초등",
    tags: ["수학", "과학", "관찰추천", "가이드북"],
    isPublic: true,
    author: "영재교육진흥원",
    date: "2026-05-12",
    downloads: 342,
    desc: "초등학교 영재성 발굴을 위한 교사 및 학부모용 관찰 요령과 추천 절차 상세 설명서입니다.",
    content: "본 가이드북은 부산광역시 교육청 산하 영재교육원 선발을 대비하여..."
  },
  {
    id: 2,
    title: "중등 정보영재용 파이썬 인공지능 기초 프로젝트 예제집",
    category: "교수학습자료",
    target: "중등",
    tags: ["정보", "파이썬", "인공지능", "코딩"],
    isPublic: true,
    author: "부산교육연구정보원",
    date: "2026-04-29",
    downloads: 218,
    desc: "중학생 정보 영재반 수업에 최적화된 기초 AI 모델 구현 실습 자료입니다.",
    content: "실제 데이터를 활용하여 예측 모델을 코딩해보고 문제 해결 과정을 탐구합니다."
  },
  {
    id: 3,
    title: "2025학년도 부산 영재학교 우수 졸업 연구과제(R&E) 보고서 모음",
    category: "연구·연수 자료",
    target: "고등",
    tags: ["R&E", "고교영재", "연구보고서", "물리", "화학"],
    isPublic: true,
    author: "한국과학영재학교",
    date: "2026-03-15",
    downloads: 512,
    desc: "고등 영재학생들이 한 학기 동안 대학교수진과 협업해 제작한 수준 높은 연구 논문집입니다.",
    content: "각 연구 분야별 초록 및 주요 실험 설계, 결과 분석 내용이 수록되어 있습니다."
  },
  {
    id: 4,
    title: "가정에서 실천하는 창의적 문제해결력 향상 부모 대화법",
    category: "우수사례",
    target: "학부모",
    tags: ["학부모", "창의력", "의사소통", "훈육"],
    isPublic: true,
    author: "상담센터 수석연구원",
    date: "2026-05-20",
    downloads: 189,
    desc: "일상적인 질문을 통해 자녀의 확산적 사고와 비판적 사고를 촉진하는 대화 가이드입니다.",
    content: "열린 질문 던지기, 실패를 성공의 디딤돌로 바꾸는 긍정 피드백 패턴 분석."
  },
  {
    id: 5,
    title: "[비공개 내부자료] 2026년 영재지도교사 직무연수 표준 교육과정 표준안(초안)",
    category: "연구·연수 자료",
    target: "교사",
    tags: ["교사연수", "교육과정", "내부검토"],
    isPublic: false,
    author: "기획조정팀",
    date: "2026-06-01",
    downloads: 3,
    desc: "2026년 하반기 교원 연수에 시범 도입될 최첨단 AI 융합 영재 연수안 세부 구성입니다.",
    content: "본 자료는 영재교육 담당 교원 연수 설계를 위한 내부 협의 자료로 대외비입니다."
  }
];

const INITIAL_INSTITUTIONS = [
  { id: 1, name: "부산광역시교육청영재교육진흥원", type: "직속기관", loc: "연제구", tel: "051-507-XXXX", web: "https://www.gifted.busan.kr", desc: "부산 영재교육의 정책 연구, 맞춤형 통합 정보 허브 운영 및 진로 특강 지원 총괄" },
  { id: 2, name: "서부교육지원청 영재교육원", type: "지역교육청", loc: "서구", tel: "051-240-XXXX", web: "https://seobu.pen.go.kr", desc: "초·중학생 대상 수학, 과학, 창의융합 영역 영재반 운영" },
  { id: 3, name: "해운대교육지원청 영재교육원", type: "지역교육청", loc: "해운대구", tel: "051-709-XXXX", web: "https://haeundae.pen.go.kr", desc: "초·중학생 발명 및 인문 예술, 수학과학 연계 교육과정 운영" },
  { id: 4, name: "부산과학고등학교 영재학급", type: "단위학교", loc: "금정구", tel: "051-510-XXXX", web: "https://school.pen.go.kr/bs-science-h", desc: "고등학교 연계 심화 과학/정보 프로그램 운영" },
  { id: 5, name: "부산예술고등학교 예술영재학급", type: "단위학교", loc: "금정구", tel: "051-514-XXXX", web: "https://school.pen.go.kr/pusanarts-h", desc: "미술, 음악, 무용 분야 우수 감성 역량을 갖춘 예술 영재 육성" }
];

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resources State (자료실)
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [filterTarget, setFilterTarget] = useState('전체');
  
  // Resource Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('교수학습자료');
  const [newTarget, setNewTarget] = useState('초등');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newTagsString, setNewTagsString] = useState('');
  const [uploadMessage, setUploadMessage] = useState(null);

  // Recommended Resources (자동추천 결과)
  const [recommended, setRecommended] = useState([]);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요! 부산 영재교육 통합 플랫폼의 인공지능 상담원 \'영재누리봇\'입니다. 선발 전형, 기관 정보, 진로 등 궁금한 점을 편하게 말씀해주세요! 💡', time: '오전 9:00' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Q&A / Community State
  const [qnaList, setQnaList] = useState([
    { id: 1, title: "올해 초등 수학영재원 관찰추천 제출 마감일이 정확히 언제인가요?", author: "박민선 (학부모)", status: "답변완료", content: "아이 담임 선생님 추천서 제출 일정이 궁금합니다.", answer: "보통 10월 중순까지 학부모 신청서가 접수되며, 담임교사 관찰 및 추천서 입력은 11월 초에 마감됩니다. 정확한 시기는 학교 공문이나 플랫폼 공지글을 참조해 주세요." },
    { id: 2, title: "기초 컴퓨터 코딩 영재를 위한 교원 연수 프로그램은 어디서 볼 수 있나요?", author: "이성호 (교사)", status: "답변 대기중", content: "파이썬 연계 정보 영재 수업 지도안을 함께 구하고 싶습니다.", answer: null }
  ]);
  const [newQnaTitle, setNewQnaTitle] = useState('');
  const [newQnaContent, setNewQnaContent] = useState('');
  const [newQnaAuthor, setNewQnaAuthor] = useState('일반시민');

  // Active resource detail modal
  const [selectedResource, setSelectedResource] = useState(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBotLoading]);

  // Handle Automatic Recommendation whenever active tab or resources change
  useEffect(() => {
    // 임의로 다운로드가 높고 신규 등록된 인기 자료 2개 자동선택추천
    const sorted = [...resources]
      .filter(r => r.isPublic)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 3);
    setRecommended(sorted);
  }, [resources]);

  // 1. 자료실 업로드 핸들러 (자동 분류 기능 탑재)
  const handleResourceUpload = (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) {
      alert("자료명과 상세 설명을 모두 입력해주세요.");
      return;
    }

    // [기획안 요청] "수요자가 원하는 자료를 쉽게 검색·활용할 수 있도록 자료 자동 분류 기능 도입"
    // Heuristic Auto-Classifier based on keywords in title/description
    let autoTarget = newTarget;
    let textToAnalyze = (newTitle + " " + newDesc).toLowerCase();
    
    if (textToAnalyze.includes("초등") || textToAnalyze.includes("어린이") || textToAnalyze.includes("저학년")) {
      autoTarget = "초등";
    } else if (textToAnalyze.includes("중등") || textToAnalyze.includes("중학교") || textToAnalyze.includes("청소년")) {
      autoTarget = "중등";
    } else if (textToAnalyze.includes("고등") || textToAnalyze.includes("고등학교") || textToAnalyze.includes("r&e")) {
      autoTarget = "고등";
    } else if (textToAnalyze.includes("학부모") || textToAnalyze.includes("부모") || textToAnalyze.includes("엄마") || textToAnalyze.includes("아빠")) {
      autoTarget = "학부모";
    } else if (textToAnalyze.includes("교사") || textToAnalyze.includes("연수") || textToAnalyze.includes("지도안") || textToAnalyze.includes("교수학습")) {
      autoTarget = "교사";
    }

    // Auto tag extraction
    const derivedTags = newTagsString 
      ? newTagsString.split(',').map(t => t.trim())
      : ["자동생성", newCategory, autoTarget];

    const newRes = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      target: autoTarget,
      tags: derivedTags,
      isPublic: newIsPublic,
      author: "업로드 교원(비공개용)",
      date: new Date().toISOString().split('T')[0],
      downloads: 0,
      desc: newDesc,
      content: newContent || "상세 교수학습자료 전문이 첨부되어 있습니다."
    };

    setResources([newRes, ...resources]);
    setUploadMessage({
      status: 'success',
      text: `자료가 안전하게 데이터베이스에 등록되었습니다! [AI 자동분류 시스템] 분석 결과, 본 자료는 대상군 "${autoTarget}" 카테고리로 자동 지정되었습니다.`
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewContent('');
    setNewTagsString('');
    
    setTimeout(() => {
      setUploadMessage(null);
    }, 6000);
  };

  // 2. AI 챗봇 전송 핸들러
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const inputToQuery = userInput;
    setUserInput('');
    setIsBotLoading(true);

    try {
      // 챗봇 답변 획득
      const botReplyText = await fetchGeminiResponse(inputToQuery, chatMessages);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBotLoading(false);
    }
  };

  // Quick Questions for AI
  const handleQuickQuestion = (question) => {
    setUserInput(question);
  };

  // 3. 소통마당 Q&A 작성 핸들러
  const handleQnaSubmit = (e) => {
    e.preventDefault();
    if (!newQnaTitle || !newQnaContent) return;

    const newQna = {
      id: Date.now(),
      title: newQnaTitle,
      author: newQnaAuthor,
      status: "답변 대기중",
      content: newQnaContent,
      answer: null
    };

    setQnaList([newQna, ...qnaList]);
    setNewQnaTitle('');
    setNewQnaContent('');
    alert("Q&A가 등록되었습니다. 곧 부산영재진흥원 전문가가 성심성의껏 답변드리겠습니다.");
  };

  // 필터링된 자료실 목록
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === '전체' || res.category === filterCategory;
    const matchesTarget = filterTarget === '전체' || res.target === filterTarget;
    return matchesSearch && matchesCategory && matchesTarget;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* HEADER & NAV */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">부산광역시교육청영재교육진흥원</span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">부산 영재교육 통합 플랫폼</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {[
                { id: 'home', label: '홈' },
                { id: 'intro', label: '영재교육 안내' },
                { id: 'institutions', label: '기관 및 선발' },
                { id: 'career', label: '진로·진학' },
                { id: 'resources', label: '스마트 자료실' },
                { id: 'community', label: '소통·일정' },
                { id: 'ai-chat', label: 'AI 상담소', highlight: true }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? tab.highlight 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-blue-50 text-blue-700'
                      : tab.highlight
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg transition-all">
            {[
              { id: 'home', label: '홈' },
              { id: 'intro', label: '영재교육 안내' },
              { id: 'institutions', label: '기관 및 선발 정보' },
              { id: 'career', label: '진로·진학 가이드' },
              { id: 'resources', label: '스마트 자료실' },
              { id: 'community', label: '소통마당 / 일정 캘린더' },
              { id: 'ai-chat', label: 'AI 상담소 (챗봇)', highlight: true }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
                  activeTab === tab.id
                    ? tab.highlight
                      ? 'bg-indigo-600 text-white'
                      : 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* BODY CONTENT BASED ON ACTIVE TAB */}
      <main className="flex-grow">
        {activeTab === 'home' && (
          <div className="pb-16">
            {/* HERO BANNER SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-20 px-4 sm:px-6 lg:px-8">
              {/* Background patterns */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Sparkles className="w-3.5 h-3.5" /> 2026 부산 영재교육 허브 신규 오픈
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    잠재된 재능을 깨우는<br />
                    <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">부산 영재교육의 미래</span>
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                    부산광역시 내 흩어져 있던 모든 영재교육 정책, 교육과정, 선발 정보 및 소통 채널을 하나로 연결하여 맞춤형 성장을 지원하는 스마트 통합 플랫폼입니다.
                  </p>
                  
                  {/* Search Bar */}
                  <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 flex items-center gap-2 max-w-lg shadow-xl backdrop-blur-md">
                    <Search className="text-slate-400 ml-3 w-5 h-5 flex-shrink-0" />
                    <input 
                      type="text" 
                      placeholder="수학, 과학, AI, 2026 선발 전형 등 검색..." 
                      className="bg-transparent border-none outline-none text-white w-full placeholder-slate-400 text-sm focus:ring-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setActiveTab('resources');
                        }
                      }}
                    />
                    <button 
                      onClick={() => setActiveTab('resources')}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex-shrink-0"
                    >
                      자료 통합 검색
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>💡 추천 검색어:</span>
                    <button onClick={() => { setSearchQuery('관찰추천'); setActiveTab('resources'); }} className="hover:text-blue-300 underline">#관찰추천</button>
                    <button onClick={() => { setSearchQuery('정보영재'); setActiveTab('resources'); }} className="hover:text-blue-300 underline">#정보영재</button>
                    <button onClick={() => { setSearchQuery('학부모'); setActiveTab('resources'); }} className="hover:text-blue-300 underline">#학부모 특강</button>
                  </div>
                </div>

                {/* Main Visual Panels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => setActiveTab('ai-chat')}>
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1">AI 챗봇 상담소</h3>
                    <p className="text-xs text-slate-400">전문 상담사 수준의 영재 맞춤형 답변 제공</p>
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-bold mt-4 hover:underline">상담 시작하기 <ChevronRight className="w-3 h-3" /></span>
                  </div>

                  <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl hover:border-teal-500/50 transition-all cursor-pointer group" onClick={() => setActiveTab('resources')}>
                    <div className="w-10 h-10 bg-teal-500/20 text-teal-300 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1">스마트 자료실</h3>
                    <p className="text-xs text-slate-400">인공지능 자동 분류 및 맞춤형 교수학습자료 추천</p>
                    <span className="inline-flex items-center gap-1 text-xs text-teal-400 font-bold mt-4 hover:underline">자료 구경하기 <ChevronRight className="w-3 h-3" /></span>
                  </div>

                  <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-all cursor-pointer group" onClick={() => setActiveTab('institutions')}>
                    <div className="w-10 h-10 bg-amber-500/20 text-amber-300 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Building className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1">기관 및 선발 정보</h3>
                    <p className="text-xs text-slate-400">부산시내 영재교육기관 통합 현황 및 선발 요강</p>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold mt-4 hover:underline">정보 조회 <ChevronRight className="w-3 h-3" /></span>
                  </div>

                  <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl hover:border-pink-500/50 transition-all cursor-pointer group" onClick={() => setActiveTab('community')}>
                    <div className="w-10 h-10 bg-pink-500/20 text-pink-300 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1">연간 학사 캘린더</h3>
                    <p className="text-xs text-slate-400">학부모 특강, 설명회 및 영재원 주요 일정 연동</p>
                    <span className="inline-flex items-center gap-1 text-xs text-pink-400 font-bold mt-4 hover:underline">일정 확인 <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </div>
            </section>

            {/* KEY ANNOUNCEMENTS & NEWS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. 홍보 카드뉴스 (홍보관 연동) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-3">
                      <Megaphone className="w-4 h-4" /> 영재교육 우수 이야기
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">부산 청소년, 세계 무대에서 꿈을 설계하다</h3>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      부산광역시교육청영재교육진흥원 수료생인 김OO 군이 글로벌 국제 과학 박람회에서 한국 대표로 선정된 영재 교육 우수 극복기를 전해드립니다.
                    </p>
                    <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">NEW</div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">제12회 부산 영재 페스티벌 개최</p>
                        <p className="text-slate-500">2026.10월 운영 예정</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('career')} className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                    홍보자료 전체보기 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. 실시간 AI 상담소 (바로가기 & 사용 팁) */}
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-blue-100 font-bold text-xs uppercase tracking-wider mb-3">
                      <Sparkles className="w-4 h-4" /> AI 영재 도우미 24시간 개방
                    </div>
                    <h3 className="text-lg font-bold mb-2">무엇이든 바로 물어보세요</h3>
                    <p className="text-xs text-blue-100 leading-relaxed mb-4">
                      영재 학급 선발 일정, 맞춤형 영재성 발견 팁, 부모님 특강 일정까지 AI 챗봇이 친절하게 분석 및 답변해 드립니다.
                    </p>
                    <div className="space-y-2">
                      <button 
                        onClick={() => { setUserInput("초등학교 영재교육원 선발 방식은?"); setActiveTab('ai-chat'); }} 
                        className="w-full text-left bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border border-white/10 truncate block"
                      >
                        🙋 "초등학교 영재교육원 선발 방식은?"
                      </button>
                      <button 
                        onClick={() => { setUserInput("자녀가 수학에 깊은 관심을 보입니다."); setActiveTab('ai-chat'); }} 
                        className="w-full text-left bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border border-white/10 truncate block"
                      >
                        🙋 "자녀가 수학에 관심이 많은데 좋은 진로 로드맵은?"
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('ai-chat')} className="mt-6 w-full py-2.5 bg-white text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-50 transition-all text-center shadow-md">
                    지금 무료상담 시작
                  </button>
                </div>

                {/* 3. 기획안 핵심 추진 일정 현황 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-3">
                      <Calendar className="w-4 h-4" /> 플랫폼 추진 마일스톤 (안)
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">현재 플랫폼 구축 현황</h3>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="flex gap-3 items-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 flex-shrink-0 ring-4 ring-green-100"></span>
                        <div>
                          <p className="font-bold text-slate-800">통합 플랫폼 기획 및 예산 신청</p>
                          <p className="text-slate-500">2026. 06. (진행 완료)</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 flex-shrink-0 animate-pulse ring-4 ring-blue-100"></span>
                        <div>
                          <p className="font-bold text-slate-800">수요자(학부모/교사) 요구 조사 & 개발</p>
                          <p className="text-slate-500">2026. 07. ~ 12. (진행 중)</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 mt-1 flex-shrink-0"></span>
                        <div>
                          <p className="font-bold text-slate-400">대국민 대화형 시범 운영 및 오픈</p>
                          <p className="text-slate-400">2027. 02. (예정)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('community')} className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                    상세 추진단계 열람 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* AI AUTO RECOMMENDATION SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">실시간 지능형 연동</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">오늘의 AI 추천 우수 영재 교육자료</h3>
                </div>
                <button onClick={() => setActiveTab('resources')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  자료실 바로가기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommended.map(res => (
                  <div 
                    key={res.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() => setSelectedResource(res)}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                          {res.category}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                          {res.target}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors mb-2">
                        {res.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                        {res.desc}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                      <span>👤 {res.author}</span>
                      <span className="flex items-center gap-1 font-bold text-indigo-600">
                        <Sparkles className="w-3.5 h-3.5" /> 추천 자료
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 1. 영재교육 안내 TAB */}
        {activeTab === 'intro' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">영재교육 이해 및 제도</h2>
            <p className="text-slate-600 mb-8">잠재력 높은 인재를 창의적 글로벌 융합인재로 키우기 위한 부산 영재교육의 핵심 철학을 안내합니다.</p>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" /> 영재교육의 목적 및 비전
                </h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  개인별 타고난 창의성과 잠재능력을 조기에 발굴하여, 자아실현을 돕고 미래 국가 지성 발전에 기여하는 안전하고 창조적인 학습 생태계를 만듭니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-2xl">🧠</span>
                    <h4 className="font-bold text-slate-900 mt-2 text-sm">잠재력 발굴</h4>
                    <p className="text-xs text-slate-500 mt-1">다면적 진단과 관찰로 사각지대 없는 인재 탐색</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-2xl">⚡</span>
                    <h4 className="font-bold text-slate-900 mt-2 text-sm">창의성 촉진</h4>
                    <p className="text-xs text-slate-500 mt-1">인공지능, 융합 과학 기반의 창의 프로젝트 수행</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-2xl">🤝</span>
                    <h4 className="font-bold text-slate-900 mt-2 text-sm">바른 품성 함양</h4>
                    <p className="text-xs text-slate-500 mt-1">공동체 가치와 인격을 겸비한 사회적 리더 양성</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> 부산 영재교육 주요 추진 정책
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">교사 관찰추천제의 질적 내실화</h4>
                      <p className="text-xs text-slate-600 mt-1">시험 중심의 획일화된 선발에서 탈피해, 학교생활 속 잠재적 학습 능력을 입체적으로 모니터링하여 공정하고 세밀한 선발 보장.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">영재교육 소외계층 맞춤형 기회 확대</h4>
                      <p className="text-xs text-slate-600 mt-1">소외 지역 및 취약계층 학생들에게 특별 배정 정원을 설정하고, 온라인 멘토링 매칭 시스템을 통한 완벽한 격차 해소.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">지역 대학 연계형 첨단 융합 교육</h4>
                      <p className="text-xs text-slate-600 mt-1">부산대, 한국해양대 등 풍부한 고등 교육기관의 고정밀 장비 인프라와 석박사급 교수 인력을 연동하는 전문 R&E 과제 전격 보급.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. 기관 및 선발 정보 TAB */}
        {activeTab === 'institutions' && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">영재교육기관 현황 & 선발 전형</h2>
                <p className="text-slate-600">부산 시내 흩어져 있는 20여 개 핵심 영재기관의 네트워크 현황을 원클릭으로 비교하십시오.</p>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> 2026학년도 최신 동기화 완료
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INITIAL_INSTITUTIONS.map(inst => (
                <div key={inst.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-bold text-slate-900 text-lg">{inst.name}</h3>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex-shrink-0">
                      {inst.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{inst.desc}</p>
                  
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>📍 위치: {inst.loc}</div>
                    <div>📞 문의: {inst.tel}</div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a href={inst.web} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5">
                      공식 홈페이지 방문 <ExternalLink className="w-3 h-3" />
                    </a>
                    <button 
                      onClick={() => { setUserInput(`${inst.name}의 올해 구체적인 입학 전형 일정을 알려주세요.`); setActiveTab('ai-chat'); }} 
                      className="py-2 px-3 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      AI 전형상담
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* General Recruitment Process Flowcard */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl mt-12 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="text-yellow-400 w-5 h-5" /> 연간 일반 영재교육 대상자 선발 과정 모형
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                  <div className="text-2xl font-black text-blue-400 mb-2">01</div>
                  <h4 className="font-bold mb-1 text-sm">지원서 접수</h4>
                  <p className="text-[11px] text-slate-300">GED 온라인 시스템에 희망 학생 원서 접수 (9~10월)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-indigo-400 mb-2">02</div>
                  <h4 className="font-bold mb-1 text-sm">관찰 및 학교추천</h4>
                  <p className="text-[11px] text-slate-300">체계적인 수업 및 생활 관찰을 통해 대표 교사 추천 (11월)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-teal-400 mb-2">03</div>
                  <h4 className="font-bold mb-1 text-sm">영재성 검사</h4>
                  <p className="text-[11px] text-slate-300">창의적 문제해결력 검사 전국 동시 실시 (12월 초)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-pink-400 mb-2">04</div>
                  <h4 className="font-bold mb-1 text-sm">최종 선발 확정</h4>
                  <p className="text-[11px] text-slate-300">선발심의위원회 검토 후 영재원 대상 합격 발표 (12월 말)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 진로·진학 TAB */}
        {activeTab === 'career' && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">진로 탐색 및 명사 특강관</h2>
            <p className="text-slate-600 mb-8">영재 수료생을 이공계 과학 인재, 인공지능 엔지니어, 미래 발명 학자로 이끄는 정보 마당입니다.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 특강 소개 카드 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-video bg-gradient-to-br from-indigo-500 to-indigo-800 text-white p-4 flex flex-col justify-between">
                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 w-fit">
                      특강 자료집 수록
                    </span>
                    <div>
                      <h4 className="font-bold text-sm">인공지능 융합 시대의 미래 영재 진로 지도 전략</h4>
                      <p className="text-[10px] text-slate-300 mt-1">강사: KAIST 이OO 박사</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      AI의 급속한 발달이 영재 인재상에 주는 변화를 짚어보고, 부모님이 길러야 하는 진짜 미래 핵심 역량을 다룹니다.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button 
                    onClick={() => { setSearchQuery('특강'); setActiveTab('resources'); }}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                  >
                    특강 강의록 다운로드
                  </button>
                </div>
              </div>

              {/* 특강 소개 카드 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-video bg-gradient-to-br from-teal-500 to-emerald-800 text-white p-4 flex flex-col justify-between">
                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 w-fit">
                      카드뉴스 열람
                    </span>
                    <div>
                      <h4 className="font-bold text-sm">과고·영재학교 수료생들이 말하는 공부비결</h4>
                      <p className="text-[10px] text-slate-300 mt-1">부산시교육청영재교육진흥원 발행</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      멘토들이 솔직하게 고백하는 자기주도 학습 습관 형성 방법과, 슬럼프를 지혜롭게 이겨낸 현실 조언 카드뉴스입니다.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button 
                    onClick={() => { setSearchQuery('우수사례'); setActiveTab('resources'); }}
                    className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-all"
                  >
                    전체 카드뉴스 보기
                  </button>
                </div>
              </div>

              {/* 특강 소개 카드 3 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-video bg-gradient-to-br from-pink-500 to-amber-700 text-white p-4 flex flex-col justify-between">
                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 w-fit">
                      입시 분석집
                    </span>
                    <div>
                      <h4 className="font-bold text-sm">이공계 최고 인재 영재학교 입학 전략 및 문항 분석</h4>
                      <p className="text-[10px] text-slate-300 mt-1">강사: 전 영재교 선발 총괄 위원</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      학생기록물의 올바른 작성 방안, 다면 면접 및 탐구 평가 시 평가단이 집중해 보는 태도 지표에 관한 전방위 분석 가이드.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button 
                    onClick={() => { setSearchQuery('진학'); setActiveTab('resources'); }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all"
                  >
                    입시 트렌드 자료 열람
                  </button>
                </div>
              </div>
            </div>

            {/* Q&A section with AI inside Career guidance */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="bg-indigo-200 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">진로 무료 코칭</span>
                <h3 className="text-lg font-bold text-indigo-900">영재 학습 진로 고민, 혼자서만 앓지 마세요.</h3>
                <p className="text-xs text-indigo-700">진흥원 연구 데이터를 학습한 AI 전문가가 입학 장벽 및 학습 슬럼프에 대해 든든하게 실시간 조언해드립니다.</p>
              </div>
              <button onClick={() => { setUserInput("자녀가 영재학교 진학 시 어떤 자율 탐구를 준비하는게 좋을까요?"); setActiveTab('ai-chat'); }} className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-colors shadow-md flex-shrink-0">
                실시간 AI 상담원 호출
              </button>
            </div>
          </div>
        )}

        {/* 4. 스마트 자료실 TAB (공개/비공개 및 자동추천의 꽃) */}
        {activeTab === 'resources' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 왼쪽: 자료 검색 및 필터, 업로드 기능 */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" /> 자료 세부 필터링
                  </h3>
                  
                  {/* 통합 검색 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">키워드 검색</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="자료 제목, 저자, 태그 검색..." 
                          className="w-full text-xs p-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* 카테고리 분류 */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">자료 유형</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['전체', '교수학습자료', '연구·연수 자료', '우수사례'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterCategory === cat
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 학년별 분류 */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">교육 대상</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['전체', '초등', '중등', '고등', '학부모', '교사'].map(t => (
                          <button
                            key={t}
                            onClick={() => setFilterTarget(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterTarget === t
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* [기획안 요청] "기관 자료 업로드 시 공개·비공개 선택 체크 항목 필수 구현" */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full pointer-events-none"></div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-indigo-600" /> 자료 간편 등록소 (교원용)
                  </h3>

                  {uploadMessage && (
                    <div className={`p-3.5 mb-4 rounded-xl text-xs font-medium leading-relaxed ${
                      uploadMessage.status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {uploadMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleResourceUpload} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">자료 및 문헌 제목 *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="예: 초등 과학 창의 설계 수업안" 
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">대분류</label>
                        <select 
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        >
                          <option value="교수학습자료">교수학습자료</option>
                          <option value="연구·연수 자료">연구·연수 자료</option>
                          <option value="우수사례">우수사례</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">대상</label>
                        <select 
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                          value={newTarget}
                          onChange={(e) => setNewTarget(e.target.value)}
                        >
                          <option value="초등">초등</option>
                          <option value="중등">중등</option>
                          <option value="고등">고등</option>
                          <option value="학부모">학부모</option>
                          <option value="교사">교사</option>
                        </select>
                      </div>
                    </div>

                    {/* [기획안 요청] "공개·비공개 체크 항목 추가 요청" */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {newIsPublic ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-rose-600" />}
                        <div>
                          <p className="text-xs font-bold text-slate-800">공개 여부 제어</p>
                          <p className="text-[10px] text-slate-400">비공개 자료는 관리자와 승인된 교원만 접근 가능</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={newIsPublic}
                          onChange={(e) => setNewIsPublic(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">소개 요약 설명 *</label>
                      <textarea 
                        required 
                        rows="2" 
                        placeholder="자료 검색 결과 노출을 돕기 위해 상세히 기술해 주세요." 
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">해시태그 (쉼표로 구분)</label>
                      <input 
                        type="text" 
                        placeholder="수학, 코딩, AI, 자이로, 추천교원" 
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        value={newTagsString}
                        onChange={(e) => setNewTagsString(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> AI 분류 예측 및 자료 등록
                    </button>
                  </form>
                </div>
              </div>

              {/* 오른쪽: 자료 목록 결과 */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <p className="text-xs text-slate-500">
                    통합 검색 매칭 결과: <strong className="text-slate-800">{filteredResources.length}개</strong>의 문서가 분석되었습니다.
                  </p>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded">
                    ⚡ 실시간 지능형 연동 가동 중
                  </span>
                </div>

                <div className="space-y-4">
                  {filteredResources.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm text-slate-500">
                      <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold">검색 매칭 결과가 존재하지 않습니다.</p>
                      <p className="text-xs text-slate-400 mt-1">다른 키워드로 검색하거나 상세 필터를 초기화해 보세요.</p>
                    </div>
                  ) : (
                    filteredResources.map(res => (
                      <div 
                        key={res.id} 
                        className={`bg-white p-6 rounded-2xl border ${res.isPublic ? 'border-slate-200 hover:border-blue-300' : 'border-rose-200 bg-rose-50/10 hover:border-rose-400'} shadow-sm transition-all flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                                {res.category}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                                {res.target}
                              </span>
                              
                              {/* 공개 / 비공개 배지 */}
                              {res.isPublic ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-100">
                                  <Unlock className="w-3 h-3" /> 공개자료
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-semibold rounded border border-rose-200">
                                  <Lock className="w-3 h-3" /> 비공개 (기관 전용)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{res.date}</span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => setSelectedResource(res)}>
                            {res.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                            {res.desc}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {res.tags.map(tag => (
                              <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500">✍️ 제공: {res.author}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedResource(res)} 
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              전문 보기
                            </button>
                            <button 
                              onClick={() => { alert(`${res.title} 다운로드가 완료되었습니다.`); }} 
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> 다운로드
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. 소통마당 & 연간 캘린더 TAB */}
        {activeTab === 'community' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">소통마당 & 영재 학사일정</h2>
            <p className="text-slate-600 mb-8">부산 영재교육의 공지사항 및 영재상담 Q&A 게시판을 만나보세요.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: Q&A 소통글 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-indigo-600" /> 영재학부모 & 교사 소통 게시판
                  </h3>

                  <form onSubmit={handleQnaSubmit} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700">질문 올리기</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="이름 혹은 별칭" 
                        required
                        className="text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                        value={newQnaAuthor}
                        onChange={(e) => setNewQnaAuthor(e.target.value)}
                      />
                      <span className="text-[10px] text-slate-400 flex items-center">실명 혹은 학부모/교사 표시 권장</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="질문 제목" 
                      required
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                      value={newQnaTitle}
                      onChange={(e) => setNewQnaTitle(e.target.value)}
                    />
                    <textarea 
                      placeholder="자유롭게 질문이나 의견을 적어주세요." 
                      required
                      rows="3"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                      value={newQnaContent}
                      onChange={(e) => setNewQnaContent(e.target.value)}
                    ></textarea>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors">
                      질문 등록 완료
                    </button>
                  </form>

                  {/* Q&A List */}
                  <div className="space-y-4">
                    {qnaList.map(q => (
                      <div key={q.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === '답변완료' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {q.status}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1">{q.title}</h4>
                          </div>
                          <span className="text-xs text-slate-400">{q.author}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">{q.content}</p>

                        {q.answer && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 text-xs text-slate-700">
                            <strong className="text-blue-700">🎓 진흥원 운영자 답변:</strong> {q.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 영재교육 주요 추진 캘린더 */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" /> 부산 영재교육 공식 스케줄러
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-2 border-blue-500 pl-3">
                      <p className="text-[10px] text-blue-400 font-bold">2026. 07월 중순</p>
                      <h4 className="font-bold text-xs text-white">학부모 아카데미 연계 요구 조사</h4>
                      <p className="text-[10px] text-slate-400">플랫폼 개선 관련 현장 의견 수렴회 진행</p>
                    </div>

                    <div className="border-l-2 border-indigo-500 pl-3">
                      <p className="text-[10px] text-indigo-400 font-bold">2026. 10월 초</p>
                      <h4 className="font-bold text-xs text-white">부산 전체 영재학급 통합 원서 접수</h4>
                      <p className="text-[10px] text-slate-400">온라인 GED 접수창 자동 연동</p>
                    </div>

                    <div className="border-l-2 border-emerald-500 pl-3">
                      <p className="text-[10px] text-emerald-400 font-bold">2026. 12. 05 (토)</p>
                      <h4 className="font-bold text-xs text-white">정기 영재성 선발 고사 전국 동시 시행</h4>
                      <p className="text-[10px] text-slate-400">지정된 12개 검사장(장소 추후 발표)</p>
                    </div>

                    <div className="border-l-2 border-rose-500 pl-3">
                      <p className="text-[10px] text-rose-400 font-bold">2027. 02월 중순</p>
                      <h4 className="font-bold text-xs text-white">부산 영재교육 통합 플랫폼 정식 대민 오픈</h4>
                      <p className="text-[10px] text-slate-400">대국민 AI 챗봇 실시간 카카오톡 연계 홍보 시작</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500">💡 일정을 휴대폰 구글 캘린더나 캘린더 앱에 연동하고 싶으십니까?</p>
                  <button onClick={() => alert('구글 캘린더 연동 프로토콜을 성공적으로 호출했습니다.')} className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors">
                    📆 내 스마트폰 캘린더에 일정 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. AI 챗봇 상담실 TAB */}
        {activeTab === 'ai-chat' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px]">
              
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-1.5">
                      부산 영재 상담 AI '영재누리봇'
                    </h3>
                    <p className="text-xs text-blue-200">부산광역시교육청영재교육진흥원 인공지능 지원</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                  ● 실시간 온라인
                </span>
              </div>

              {/* Chat Message Window */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[80%]">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none whitespace-pre-wrap'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block text-right">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isBotLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs text-slate-500">부산 영재교육 기획안 분석 중...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Suggester */}
              <div className="bg-slate-100 p-3 border-t border-slate-200 flex gap-2 overflow-x-auto">
                <span className="text-xs text-slate-400 self-center font-bold flex-shrink-0">🚀 빠른 추천 질문:</span>
                {[
                  "초등 영재 선발 일정이 궁금해요.",
                  "교사용 관찰추천 지도 요령이 뭔가요?",
                  "수학 과학 영재학교 목록 알려줘.",
                  "온라인 플랫폼 추진 배경이 어떻게 되나요?"
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 flex-shrink-0 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" 
                  placeholder="영재교육 선발 전형, 교안 분류, 기관 상담 등 질문을 입력하세요..." 
                  className="flex-grow text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isBotLoading}
                />
                <button 
                  type="submit" 
                  disabled={isBotLoading || !userInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <span className="text-white font-bold text-base">부산 영재교육 통합 플랫폼</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              부산광역시의 학생, 학부모, 교원의 교육 권리 강화와 정보 격차 해소를 위해 교육연구정보원의 통합 홈페이지 신규 구축 자원을 활용해 맞춤형 지성 인프라를 만듭니다.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">플랫폼 주요 항목</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('intro')} className="hover:text-white transition-colors">영재교육 정책 이해</button></li>
              <li><button onClick={() => setActiveTab('institutions')} className="hover:text-white transition-colors">기관 및 선발 정보</button></li>
              <li><button onClick={() => setActiveTab('resources')} className="hover:text-white transition-colors">스마트 자료실</button></li>
              <li><button onClick={() => setActiveTab('ai-chat')} className="hover:text-white transition-colors">AI 챗봇 상담소</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">관련 공인 링크</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="https://www.pen.go.kr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">부산광역시교육청 <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="https://www.gifted.busan.kr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">영재교육진흥원 <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="https://www.gerid.or.kr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">부산교육연구정보원 <ExternalLink className="w-2.5 h-2.5" /></a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 font-mono">Platform Center</h4>
            <p className="text-xs text-slate-500">운영 기관: 부산광역시교육청영재교육진흥원</p>
            <p className="text-xs text-slate-500 mt-1">구축 기간: 2026. 7. ~ 2027. 2.</p>
            <div className="flex gap-4 mt-4">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">Responsive Web</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">Gemini 2.5 inside</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          <p>© 2026 부산광역시교육청영재교육진흥원. All Rights Reserved. 본 통합 플랫폼은 교육행정기관 통합홈페이지 신규 구축 사양을 따릅니다.</p>
        </div>
      </footer>

      {/* RESOURCE DETAIL MODAL */}
      {selectedResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg">
                  {selectedResource.category}
                </span>
                {selectedResource.isPublic ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> 공개자료
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-semibold rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 비공개
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedResource(null)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug mb-3">
                  {selectedResource.title}
                </h3>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>저작권자: <strong>{selectedResource.author}</strong></span>
                  <span>등록일: {selectedResource.date}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed">
                <h4 className="font-bold text-slate-900 mb-1">소개 개요</h4>
                {selectedResource.desc}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">문서 전문 / 핵심 미리보기</h4>
                <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {selectedResource.content}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {selectedResource.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-2 bg-slate-50 rounded-b-3xl">
              <button 
                onClick={() => setSelectedResource(null)} 
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                닫기
              </button>
              <button 
                onClick={() => { alert(`${selectedResource.title} 다운로드가 완료되었습니다.`); setSelectedResource(null); }} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> 문서 다운로드 받기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}