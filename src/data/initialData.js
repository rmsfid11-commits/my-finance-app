export const DEFAULT_PROFILE = { name: '', age: 30, job: '', salary: 3000000, housing: '월세' };

export const DEFAULT_GOALS = { savingGoal: 1000000, dividendGoal: 500000, netWorthGoal: 100000000 };

export const DEFAULT_BUDGET = { 식비: 400000, 교통: 150000, 생활: 200000, 의료: 100000, 여가: 150000, 강아지: 0, 기타: 100000 };

export const DEFAULT_PORTFOLIO = [];

export const DEFAULT_DIVIDENDS = [];

export const DEFAULT_FIXED_EXPENSES = [];

export const DEFAULT_TRANSACTIONS = [];

export const CATEGORIES = ['식비', '교통', '생활', '의료', '여가', '강아지', '기타', '주거'];
export const CATEGORY_ICONS = { '식비': '🍜', '교통': '🚇', '생활': '🏠', '의료': '💊', '여가': '🎮', '강아지': '🐕', '기타': '📦', '주거': '🏢' };
export const CATEGORY_COLORS = { '식비': '#FF4757', '교통': '#3182F6', '생활': '#00C48C', '의료': '#7C5CFC', '여가': '#FF9F43', '강아지': '#FF6B81', '기타': '#8B95A1', '주거': '#0ABDE3' };

export const QUICK_INPUTS = [
  { label: '점심', amount: 8000, category: '식비', icon: '🍚' },
  { label: '커피', amount: 5000, category: '식비', icon: '☕' },
  { label: '지하철', amount: 3000, category: '교통', icon: '🚇' },
  { label: '저녁', amount: 15000, category: '식비', icon: '🍽️' },
  { label: '강아지', amount: 10000, category: '강아지', icon: '🐕' },
  { label: '주유', amount: 70000, category: '교통', icon: '⛽' }
];

export const BADGE_DEFINITIONS = [
  { id: 'first_save', name: '첫 저축', desc: '10만원 이상 저축', category: '저축', icon: '💰' },
  { id: 'save_start', name: '저축 시작', desc: '50만원 이상 저축', category: '저축', icon: '💰' },
  { id: 'millionaire', name: '백만장자', desc: '100만원 이상 저축', category: '저축', icon: '💎' },
  { id: 'ten_million', name: '천만장자', desc: '1000만원 이상 저축', category: '저축', icon: '👑' },
  { id: 'hundred_million', name: '억대부자', desc: '1억원 이상 순자산', category: '저축', icon: '🏆' },
  { id: 'goal_first', name: '목표 달성', desc: '월간 목표 1회 달성', category: '목표', icon: '🎯' },
  { id: 'goal_streak3', name: '연속 달성', desc: '월간 목표 3회 연속', category: '목표', icon: '🔥' },
  { id: 'goal_perfect', name: '완벽 달성', desc: '6개월 연속 달성', category: '목표', icon: '⭐' },
  { id: 'goal_year', name: '1년 달성', desc: '12개월 연속 달성', category: '목표', icon: '🏅' },
  { id: 'save_10', name: '절약 입문', desc: '월 10만원 절약', category: '절약', icon: '💸' },
  { id: 'save_50', name: '절약 달인', desc: '월 50만원 절약', category: '절약', icon: '💪' },
  { id: 'save_100', name: '절약 마스터', desc: '월 100만원 절약', category: '절약', icon: '🥇' },
  { id: 'transit_user', name: '대중교통 이용자', desc: '대중교통 10회 이용', category: '교통', icon: '🚇' },
  { id: 'transit_save', name: '교통비 절약', desc: '월 교통비 2만원 이하', category: '교통', icon: '🚴' },
  { id: 'transit_zero', name: '교통비 제로', desc: '1주일 교통비 0원', category: '교통', icon: '🏃' },
  { id: 'food_start', name: '식비 관리 시작', desc: '식비 기록 시작', category: '식비', icon: '🍜' },
  { id: 'food_save', name: '식비 절약왕', desc: '월 식비 50만원 이하', category: '식비', icon: '🥗' },
  { id: 'food_lunch', name: '도시락왕', desc: '도시락 20회', category: '식비', icon: '🍱' },
  { id: 'invest_start', name: '투자 입문', desc: '첫 매수 완료', category: '투자', icon: '📈' },
  { id: 'invest_long', name: '장기 투자자', desc: '3개월 이상 보유', category: '투자', icon: '🏦' },
  { id: 'invest_profit', name: '수익 달성', desc: '+10% 수익률', category: '투자', icon: '💹' },
  { id: 'dividend_10', name: '배당 왕', desc: '월 배당 10만원', category: '투자', icon: '💵' },
  { id: 'dividend_100', name: '배당 제왕', desc: '월 배당 100만원', category: '투자', icon: '🤑' },
  { id: 'record_7', name: '꾸준이', desc: '7일 연속 기록', category: '기록', icon: '📊' },
  { id: 'record_30', name: '성실이', desc: '30일 연속 기록', category: '기록', icon: '📅' },
  { id: 'record_100', name: '전설', desc: '100일 연속 기록', category: '기록', icon: '🌟' },
  { id: 'record_365', name: '완벽', desc: '365일 연속 기록', category: '기록', icon: '👑' },
  { id: 'app_join', name: '앱 가입', desc: '앱 가입 완료', category: '특별', icon: '🎁' },
  { id: 'first_input', name: '첫 입력', desc: '첫 가계부 입력', category: '특별', icon: '✏️' },
  { id: 'invite_5', name: '초대왕', desc: '친구 5명 초대', category: '특별', icon: '👥' },
  { id: 'review', name: '리뷰왕', desc: '앱 리뷰 작성', category: '특별', icon: '⭐' },
  { id: 'new_year', name: '신년 결심', desc: '1월 목표 설정', category: '시즌', icon: '🎆' },
  { id: 'valentine', name: '발렌타인 절약', desc: '2월 절약 챌린지', category: '시즌', icon: '💝' },
  { id: 'christmas', name: '크리스마스 저축', desc: '12월 저축 목표', category: '시즌', icon: '🎄' },
  { id: 'budget_master', name: '예산 달인', desc: '3개월 연속 예산 내', category: '목표', icon: '📋' },
  { id: 'no_coffee', name: '커피 절약', desc: '1주일 커피 0원', category: '절약', icon: '☕' },
  { id: 'walk_week', name: '걷기왕', desc: '1주일 교통비 0', category: '교통', icon: '🚶' },
  { id: 'cook_master', name: '요리왕', desc: '외식 0회 1주일', category: '식비', icon: '👨‍🍳' },
  { id: 'diversity', name: '분산 투자', desc: '3종목 이상 보유', category: '투자', icon: '🎯' },
  { id: 'early_bird', name: '아침형 인간', desc: '7시 전 기록 7회', category: '기록', icon: '🌅' },
  { id: 'night_owl', name: '올빼미', desc: '22시 후 기록 7회', category: '기록', icon: '🦉' },
  { id: 'pet_lover', name: '반려동물 사랑', desc: '강아지 지출 관리', category: '특별', icon: '🐾' },
  { id: 'summer_save', name: '여름 절약', desc: '7월 절약 챌린지', category: '시즌', icon: '☀️' },
  { id: 'autumn_harvest', name: '가을 수확', desc: '10월 투자 수익', category: '시즌', icon: '🍂' },
  { id: 'streak_master', name: '연속 기록 달인', desc: '50일 연속', category: '기록', icon: '🔥' },
  { id: 'zero_day', name: '무지출의 날', desc: '하루 0원 지출', category: '절약', icon: '🙌' },
  { id: 'half_year', name: '반년 사용자', desc: '6개월 사용', category: '특별', icon: '📆' },
  { id: 'one_year', name: '1년 사용자', desc: '1년 사용', category: '특별', icon: '🎂' },
  { id: 'smart_spender', name: '현명한 소비', desc: '카테고리별 예산 준수', category: '목표', icon: '🧠' },
  { id: 'dividend_start', name: '배당 첫수령', desc: '첫 배당금 수령', category: '투자', icon: '🎉' },
];

export const LEVEL_THRESHOLDS = [
  { name: '브론즈', min: 0, max: 14, color: '#CD7F32' },
  { name: '실버', min: 15, max: 29, color: '#C0C0C0' },
  { name: '골드', min: 30, max: 44, color: '#FFD700' },
  { name: '다이아', min: 45, max: 49, color: '#B9F2FF' },
  { name: '마스터', min: 50, max: 50, color: '#FF6B6B' }
];

export const BADGE_REWARDS = [
  { count: 5, reward: '특별 테마 해금' },
  { count: 10, reward: '프리미엄 기능 1주' },
  { count: 15, reward: '리포트 고급 통계' },
  { count: 30, reward: '커스텀 카테고리' },
  { count: 50, reward: '평생 프리미엄' }
];

export const PEER_DATA = generatePeerData();
function generatePeerData() {
  const data = [];
  for (let i = 0; i < 600; i++) {
    const salary = 5000000 + Math.random() * 3000000;
    const savingRate = 15 + Math.random() * 40;
    const totalExpense = salary * (1 - savingRate / 100);
    data.push({ id: i, salary: Math.round(salary), savingRate: Math.round(savingRate * 10) / 10, totalExpense: Math.round(totalExpense),
      food: Math.round(totalExpense * (0.25 + Math.random() * 0.15)), transport: Math.round(totalExpense * (0.05 + Math.random() * 0.1)),
      living: Math.round(totalExpense * (0.1 + Math.random() * 0.1)), medical: Math.round(totalExpense * (0.02 + Math.random() * 0.05)),
      leisure: Math.round(totalExpense * (0.05 + Math.random() * 0.1)), pet: Math.round(Math.random() > 0.5 ? totalExpense * (0.03 + Math.random() * 0.05) : 0),
      netWorth: Math.round(10000000 + Math.random() * 150000000) });
  }
  return data;
}

export const ECONOMIC_CALENDAR = [
  { date: '2026-02-14', time: '22:30', name: 'CPI (소비자물가지수)', importance: 5, forecast: '2.8%', previous: '2.9%' },
  { date: '2026-02-14', time: '22:30', name: 'Core CPI', importance: 4, forecast: '3.1%', previous: '3.2%' },
  { date: '2026-02-18', time: '22:30', name: 'PPI (생산자물가지수)', importance: 4, forecast: '0.3%', previous: '0.2%' },
  { date: '2026-02-19', time: '04:00', name: 'FOMC 의사록', importance: 5, forecast: '-', previous: '-' },
  { date: '2026-02-20', time: '22:30', name: '신규 실업수당 청구건수', importance: 3, forecast: '215K', previous: '218K' },
  { date: '2026-02-21', time: '23:45', name: 'PMI (구매관리자지수)', importance: 4, forecast: '51.5', previous: '51.2' },
  { date: '2026-02-25', time: '00:00', name: 'CB 소비자 신뢰지수', importance: 4, forecast: '105.0', previous: '104.1' },
  { date: '2026-02-27', time: '22:30', name: 'GDP (2차 추정)', importance: 5, forecast: '3.2%', previous: '3.3%' },
  { date: '2026-02-28', time: '22:30', name: 'PCE 물가지수', importance: 5, forecast: '2.5%', previous: '2.6%' }
];
