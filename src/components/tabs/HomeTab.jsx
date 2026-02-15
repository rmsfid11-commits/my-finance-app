import { useState, useMemo, useEffect, useCallback } from 'react';
import { formatFullKRW, formatKRW, formatPercent, formatUSD } from '../../utils/formatters';
import { CATEGORY_COLORS, ECONOMIC_CALENDAR } from '../../data/initialData';
import { useStore } from '../../store/useStore';
import { SkeletonCard, SkeletonChart } from '../Skeleton';
import { haptic } from '../../utils/haptic';
import EditableNumber from '../EditableNumber';
import CountUp from '../CountUp';
import CustomTooltip from '../CustomTooltip';
import { Eye, EyeOff, TrendingDown, TrendingUp, ChevronRight, Zap, AlertTriangle, Clock, Sparkles, Flame, Trophy, Star, CheckCircle, Gift } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

const LOGO_COLORS = ['#3182F6','#00C48C','#FF9F43','#7C5CFC','#FF4757','#0ABDE3','#FF6B81','#2ED573'];
const getLogoColor = (s) => LOGO_COLORS[s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];
const importanceDotColor = (l) => l >= 4 ? 'bg-[#FF4757]' : l >= 3 ? 'bg-[#FF9F43]' : l >= 2 ? 'bg-[#FFD93D]' : 'bg-[#30363D]';

// ─── 챌린지 정의 ───
const WEEKLY_CHALLENGES = [
  { id: 'no_spend_3', name: '무지출 3일', desc: '이번주 무지출 3일 달성', xp: 50, icon: '🚫', check: (tx, today) => { const week = getWeekDates(today); const spentDays = new Set(tx.filter(t => week.includes(t.date)).map(t => t.date)); return week.filter(d => !spentDays.has(d) && d <= today).length >= 3; } },
  { id: 'under_10k', name: '만원의 행복', desc: '하루 지출 1만원 이하 5일', xp: 40, icon: '💪', check: (tx, today) => { const week = getWeekDates(today); const dailySum = {}; tx.filter(t => week.includes(t.date)).forEach(t => { dailySum[t.date] = (dailySum[t.date] || 0) + t.amount; }); return Object.values(dailySum).filter(v => v <= 10000).length >= 5; } },
  { id: 'log_every_day', name: '매일 기록', desc: '7일 연속 거래 기록', xp: 60, icon: '📝', check: (tx, today) => { const week = getWeekDates(today); return week.filter(d => d <= today).every(d => tx.some(t => t.date === d)); } },
  { id: 'coffee_save', name: '커피 절약', desc: '이번주 커피/카페 2만원 이하', xp: 30, icon: '☕', check: (tx, today) => { const week = getWeekDates(today); const coffee = tx.filter(t => week.includes(t.date) && (t.place?.includes('커피') || t.place?.includes('카페') || t.memo?.includes('커피'))); return coffee.reduce((s, t) => s + t.amount, 0) <= 20000; } },
  { id: 'budget_hero', name: '예산 수호자', desc: '모든 카테고리 예산 내 유지', xp: 80, icon: '🛡️', check: (tx, today, budget) => { const month = today.substring(0, 7); const byC = {}; tx.filter(t => t.date.startsWith(month)).forEach(t => { byC[t.category] = (byC[t.category] || 0) + t.amount; }); return Object.entries(budget).every(([cat, b]) => !b || (byC[cat] || 0) <= b); } },
  { id: 'saving_30', name: '저축왕', desc: '이번달 저축률 30% 이상', xp: 100, icon: '👑', check: (tx, today, budget, profile, fixedExp) => { const month = today.substring(0, 7); const spend = tx.filter(t => t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0) + fixedExp.reduce((s, f) => s + f.amount, 0); return profile.salary > 0 && (profile.salary - spend) / profile.salary >= 0.3; } },
];

function getWeekDates(today) {
  const d = new Date(today), dow = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd.toISOString().split('T')[0]; });
}

const LEVEL_XP = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000];
const getLevelInfo = (xp) => {
  let lvl = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) { if (xp >= LEVEL_XP[i]) lvl = i + 1; else break; }
  const cur = LEVEL_XP[lvl - 1] || 0;
  const next = LEVEL_XP[lvl] || LEVEL_XP[LEVEL_XP.length - 1] * 1.5;
  return { level: lvl, currentXP: xp - cur, neededXP: next - cur, pct: ((xp - cur) / (next - cur)) * 100 };
};

const LEVEL_TITLES = ['뉴비', '절약 입문자', '알뜰 시민', '재테크 루키', '머니 세이버', '저축 전사', '투자 탐험가', '재무 마스터', '부의 설계자', '경제적 자유인', '금융 전설', '돈의 신'];

function HomeTab() {
  const { profile, setProfile, goals, setGoals, budget, portfolio, stockPrices, exchangeRate, transactions, dividends, fixedExpenses, hideAmounts, setHideAmounts, customCategories, gamification, setGamification } = useStore();
  const [showAllTx, setShowAllTx] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const mask = (t) => hideAmounts ? '•••••' : t;
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);
  const todayObj = new Date();
  const dayOfMonth = todayObj.getDate();
  const daysInMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const todayTx = useMemo(() => transactions.filter(t => t.date === today), [transactions, today]);
  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth) && !t.refunded), [transactions, currentMonth]);
  const todaySpending = todayTx.reduce((s, t) => s + t.amount, 0);
  const monthSpending = monthTx.reduce((s, t) => s + t.amount, 0);
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalExpense = monthSpending + fixedTotal;
  const savings = profile.salary - totalExpense;
  const savingRate = profile.salary > 0 ? ((savings / profile.salary) * 100) : 0;
  const totalBudget = Object.values(budget).reduce((s, v) => s + v, 0);
  const rate = exchangeRate || 1450;
  const budgetPct = totalBudget > 0 ? Math.min((monthSpending / totalBudget) * 100, 150) : 0;

  // 지출 속도
  const spendingPace = useMemo(() => {
    const expected = totalBudget * monthProgress;
    const pace = expected > 0 ? (monthSpending / expected) * 100 : 0;
    const projected = monthProgress > 0 ? Math.round(monthSpending / monthProgress) : 0;
    const status = pace <= 90 ? '여유' : pace <= 110 ? '적정' : pace <= 130 ? '주의' : '위험';
    const color = pace <= 90 ? '#00C48C' : pace <= 110 ? '#3182F6' : pace <= 130 ? '#FF9F43' : '#FF4757';
    return { pace: Math.round(pace), projected, status, color };
  }, [monthSpending, totalBudget, monthProgress]);

  // 카테고리 breakdown
  const categoryData = useMemo(() => {
    const b = {};
    monthTx.forEach(t => { b[t.category] = (b[t.category] || 0) + t.amount; });
    return Object.entries(b).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || customCategories?.find(c => c.name === name)?.color || '#8B95A1',
      pct: monthSpending > 0 ? (value / monthSpending * 100).toFixed(1) : 0,
      budgetAmt: budget[name] || 0,
      txs: monthTx.filter(t => t.category === name)
    }));
  }, [monthTx, monthSpending, budget, customCategories]);

  // 포트폴리오
  const portfolioSummary = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    const items = portfolio.map(stock => {
      const price = stockPrices[stock.symbol]?.price || stock.avgPrice;
      const value = stock.shares * price * rate;
      const cost = stock.shares * stock.avgPrice * rate;
      totalValue += value; totalCost += cost;
      return { ...stock, currentPrice: price, value, cost, pnl: value - cost, pnlPercent: cost > 0 ? ((value - cost) / cost * 100) : 0 };
    });
    return { items, totalValue, totalCost, totalPnl: totalValue - totalCost, totalPnlPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0 };
  }, [portfolio, stockPrices, rate]);

  const totalMonthlyDividend = useMemo(() => {
    const r = dividends.slice(-3);
    return r.length > 0 ? r.reduce((s, d) => s + d.amount, 0) / r.length : 0;
  }, [dividends]);

  const netWorth = portfolioSummary.totalValue;
  const isProfit = portfolioSummary.totalPnl > 0;

  // 6개월 트렌드
  const trendData = useMemo(() => {
    const m = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const spend = transactions.filter(t => t.date.startsWith(mo) && !t.refunded).reduce((s, t) => s + t.amount, 0) + fixedTotal;
      m.push({ month: `${d.getMonth() + 1}월`, 지출: spend || Math.round(profile.salary * 0.6), 수입: profile.salary });
    }
    return m;
  }, [transactions, profile.salary, fixedTotal]);

  // 최근 거래
  const recentTx = transactions.slice(0, showAllTx ? 10 : 5);

  // 예산 초과 카테고리
  const overBudget = useMemo(() => {
    return categoryData.filter(c => c.budgetAmt > 0 && c.value > c.budgetAmt * 0.8);
  }, [categoryData]);

  // 인사이트
  const insights = useMemo(() => {
    const tips = [];
    if (savingRate >= 30) tips.push({ text: `저축률 ${savingRate.toFixed(0)}% — 훌륭해요!`, color: '#00C48C', icon: Sparkles });
    else if (savingRate < 10) tips.push({ text: `저축률이 ${savingRate.toFixed(0)}%로 낮아요. 지출을 줄여보세요`, color: '#FF4757', icon: AlertTriangle });
    if (spendingPace.pace > 120) tips.push({ text: `지출 속도가 빨라요. 월말 ${formatKRW(spendingPace.projected)} 예상`, color: '#FF9F43', icon: Zap });
    if (overBudget.length > 0) tips.push({ text: `${overBudget[0].name} 예산 ${((overBudget[0].value / overBudget[0].budgetAmt) * 100).toFixed(0)}% 사용`, color: '#FF4757', icon: AlertTriangle });
    if (todaySpending === 0 && todayObj.getHours() >= 18) tips.push({ text: '오늘 무지출 성공 중!', color: '#00C48C', icon: Sparkles });
    if (tips.length === 0) tips.push({ text: '꾸준히 관리하고 있어요. 좋은 습관!', color: '#3182F6', icon: Sparkles });
    return tips;
  }, [savingRate, spendingPace, overBudget, todaySpending, todayObj]);

  // ─── 게이미피케이션 ───
  const gam = gamification || { xp: 0, level: 1, streak: 0, lastCheckIn: null, challenges: [], completedChallenges: [] };
  const levelInfo = getLevelInfo(gam.xp);
  const levelTitle = LEVEL_TITLES[Math.min(levelInfo.level - 1, LEVEL_TITLES.length - 1)];

  // 출석 체크인 (하루 1회)
  useEffect(() => {
    if (!setGamification) return;
    const lastDate = gam.lastCheckIn;
    if (lastDate === today) return;
    const yesterday = new Date(todayObj); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const newStreak = lastDate === yesterdayStr ? gam.streak + 1 : 1;
    const streakBonus = newStreak >= 7 ? 20 : newStreak >= 3 ? 10 : 5;
    const prevLevel = getLevelInfo(gam.xp).level;
    const newXP = gam.xp + streakBonus;
    const newLevel = getLevelInfo(newXP).level;
    setGamification(prev => ({ ...prev, lastCheckIn: today, streak: newStreak, xp: newXP }));
    if (newLevel > prevLevel) setTimeout(() => setShowLevelUp(true), 500);
  }, [today]);

  // 챌린지 진행 체크
  const activeChallenges = useMemo(() => {
    const completed = new Set(gam.completedChallenges || []);
    return WEEKLY_CHALLENGES.map(ch => ({
      ...ch,
      done: completed.has(ch.id),
      progress: ch.check(transactions, today, budget, profile, fixedExpenses)
    }));
  }, [transactions, today, budget, profile, fixedExpenses, gam.completedChallenges]);

  const claimChallenge = useCallback((ch) => {
    if (!ch.progress || ch.done || !setGamification) return;
    const prevLevel = getLevelInfo(gam.xp).level;
    const newXP = gam.xp + ch.xp;
    const newLevel = getLevelInfo(newXP).level;
    setGamification(prev => ({
      ...prev,
      xp: newXP,
      completedChallenges: [...(prev.completedChallenges || []), ch.id]
    }));
    if (newLevel > prevLevel) setTimeout(() => setShowLevelUp(true), 500);
  }, [gam.xp, setGamification]);

  // 경제 일정
  const todayEvents = ECONOMIC_CALENDAR.filter(e => e.date === today);
  const upcomingEvents = ECONOMIC_CALENDAR.filter(e => e.date > today).slice(0, 3);

  // 원형 게이지 SVG
  const GaugeCircle = ({ pct, color, size = 72, stroke = 5 }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = Math.min(pct, 100) / 100 * c;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--c-border)" strokeWidth={stroke} opacity={0.3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col animate-slide">
      <div className="glass flex-1 flex flex-col">

        {/* ━━━ 스트릭 + 레벨 ━━━ */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {/* 스트릭 */}
            <div className="flex items-center gap-2 glass-inner rounded-2xl px-3.5 py-2.5">
              <Flame size={18} className={gam.streak >= 7 ? 'text-[#FF4757]' : gam.streak >= 3 ? 'text-[#FF9F43]' : 'text-c-text3'} />
              <div>
                <div className="text-lg font-extrabold text-c-text leading-none">{gam.streak}</div>
                <div className="text-[9px] text-c-text3">연속 출석</div>
              </div>
            </div>
            {/* 레벨 + XP */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-[#FFD93D]" />
                  <span className="text-xs font-bold text-c-text">Lv.{levelInfo.level}</span>
                  <span className="text-[10px] text-c-text2">{levelTitle}</span>
                </div>
                <span className="text-[10px] text-c-text3">{gam.xp} XP</span>
              </div>
              <div className="h-2 glass-inner rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(levelInfo.pct, 100)}%`, background: 'linear-gradient(90deg, #FFD93D, #FF9F43)' }} />
              </div>
              <div className="text-[9px] text-c-text3 mt-0.5 text-right">{Math.round(levelInfo.currentXP)} / {Math.round(levelInfo.neededXP)} XP</div>
            </div>
          </div>

          {/* 챌린지 미니 */}
          <button onClick={() => setShowChallenges(!showChallenges)} className="w-full mt-2.5 flex items-center gap-2 glass-inner rounded-xl px-3.5 py-2.5 active:scale-[0.98] transition-transform">
            <Trophy size={15} className="text-[#7C5CFC]" />
            <span className="text-xs font-bold text-c-text flex-1 text-left">주간 챌린지</span>
            <span className="text-[10px] font-bold text-[#00C48C]">{activeChallenges.filter(c => c.done).length}/{activeChallenges.length} 완료</span>
            <ChevronRight size={14} className={`text-c-text3 transition-transform ${showChallenges ? 'rotate-90' : ''}`} />
          </button>

          {showChallenges && (
            <div className="mt-2 space-y-1.5 animate-fade">
              {activeChallenges.map(ch => (
                <div key={ch.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${ch.done ? 'bg-[#00C48C]/8' : ch.progress ? 'bg-[#FFD93D]/8' : 'glass-inner'}`}>
                  <span className="text-lg">{ch.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-c-text">{ch.name}</div>
                    <div className="text-[10px] text-c-text3">{ch.desc}</div>
                  </div>
                  {ch.done ? (
                    <span className="text-[10px] font-bold text-[#00C48C] flex items-center gap-0.5"><CheckCircle size={12} /> 완료</span>
                  ) : ch.progress ? (
                    <button onClick={() => claimChallenge(ch)} className="text-[10px] font-bold text-[#FFD93D] bg-[#FFD93D]/15 px-2.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"><Gift size={11} /> +{ch.xp}XP</button>
                  ) : (
                    <span className="text-[10px] text-c-text3">+{ch.xp}XP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 레벨업 모달 */}
        {showLevelUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 animate-fade" onClick={() => setShowLevelUp(false)}>
            <div className="text-center animate-slide" onClick={e => e.stopPropagation()}>
              <div className="text-6xl mb-3">🎉</div>
              <div className="text-2xl font-extrabold text-[#FFD93D] mb-1">레벨 업!</div>
              <div className="text-lg font-bold text-white mb-0.5">Lv.{levelInfo.level}</div>
              <div className="text-sm text-white/70 mb-4">{levelTitle}</div>
              <button onClick={() => setShowLevelUp(false)} className="px-6 py-2.5 bg-[#FFD93D] text-black font-bold rounded-2xl text-sm active:scale-95 transition-transform">확인</button>
            </div>
          </div>
        )}

        {/* ━━━ 총 자산 헤더 ━━━ */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-c-text2">내 총 자산</span>
            <button onClick={() => setHideAmounts(!hideAmounts)} className="p-1.5 -mr-1.5 text-c-text3 active:text-c-text2 transition-colors">
              {hideAmounts ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="text-2xl font-extrabold text-c-text tracking-tight">
            {hideAmounts ? '•••••' : <CountUp value={netWorth} format={formatFullKRW} />}
          </div>
          {portfolio.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${isProfit ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
                {hideAmounts ? '•••••' : <CountUp value={portfolioSummary.totalPnl} format={v => `${v >= 0 ? '+' : ''}${formatFullKRW(v)}`} />}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isProfit ? 'bg-[#00C48C]/12 text-[#00C48C]' : 'bg-[#FF4757]/12 text-[#FF4757]'}`}>
                {hideAmounts ? '•••' : formatPercent(portfolioSummary.totalPnlPct)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 인사이트 배너 ━━━ */}
        <div className="px-5 py-3">
          <div className="space-y-2">
            {insights.map((tip, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: tip.color + '12', borderLeft: `3px solid ${tip.color}` }}>
                <tip.icon size={14} style={{ color: tip.color }} className="shrink-0" />
                <span className="text-xs font-medium text-c-text">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 지출 속도 게이지 + 핵심 지표 ━━━ */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-5">
            {/* 원형 게이지 */}
            <div className="relative shrink-0">
              <GaugeCircle pct={budgetPct} color={spendingPace.color} size={88} stroke={6} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold" style={{ color: spendingPace.color }}>{mask(`${Math.round(budgetPct)}%`)}</span>
                <span className="text-[9px] text-c-text3">예산 소진</span>
              </div>
            </div>
            {/* 핵심 수치 */}
            <div className="flex-1 space-y-2.5">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
                  <span className="text-[11px] text-c-text2">오늘 지출</span>
                </div>
                <div className="text-base font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={todaySpending} format={formatFullKRW} />}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9F43]" />
                  <span className="text-[11px] text-c-text2">이번달 지출</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-auto" style={{ backgroundColor: spendingPace.color + '18', color: spendingPace.color }}>{spendingPace.status}</span>
                </div>
                <div className="text-base font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={totalExpense} format={formatFullKRW} />}</div>
              </div>
            </div>
          </div>
          {/* 예산 진행 바 */}
          <div className="mt-3">
            <div className="h-1.5 glass-inner rounded-full overflow-hidden relative">
              <div className="absolute top-0 h-full w-px bg-c-text2 opacity-50 z-10" style={{ left: `${Math.min(monthProgress * 100, 100)}%` }} />
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: spendingPace.color }} />
            </div>
            <div className="flex justify-between text-[10px] text-c-text3 mt-1">
              <span>{dayOfMonth}일차 / {daysInMonth}일</span>
              <span>월말 예상 {mask(formatKRW(spendingPace.projected))}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 수입 · 저축 ━━━ */}
        <div className="grid grid-cols-2 divide-x divide-c-border">
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
              <span className="text-[11px] text-c-text2">수입</span>
            </div>
            <div className="text-lg font-extrabold text-c-text">
              {hideAmounts ? '•••••' : <EditableNumber value={profile.salary} onSave={(v) => setProfile({...profile, salary: Math.round(v)})} format={formatFullKRW} />}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC]" />
              <span className="text-[11px] text-c-text2">저축</span>
              <span className={`text-[10px] font-bold ml-auto ${savingRate >= 20 ? 'text-[#00C48C]' : 'text-[#FF9F43]'}`}>{mask(`${savingRate.toFixed(0)}%`)}</span>
            </div>
            <div className="text-lg font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={savings} format={formatFullKRW} />}</div>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 이번주 미니 리포트 ━━━ */}
        <WeeklyMini transactions={transactions} hideAmounts={hideAmounts} />

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 카테고리 도넛 차트 ━━━ */}
        {categoryData.length > 0 && (<>
          <div className="px-5 py-4">
            <h2 className="text-sm font-bold text-c-text mb-3">카테고리별 지출</h2>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" paddingAngle={2} strokeWidth={0} onClick={(_, i) => setSelectedCat(selectedCat === categoryData[i]?.name ? null : categoryData[i]?.name)}>
                      {categoryData.map((c, i) => <Cell key={i} fill={c.color} opacity={selectedCat && selectedCat !== c.name ? 0.3 : 1} className="cursor-pointer transition-opacity" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {categoryData.slice(0, 5).map(c => (
                  <button key={c.name} onClick={() => setSelectedCat(selectedCat === c.name ? null : c.name)} className={`w-full flex items-center gap-2 py-1 transition-opacity ${selectedCat && selectedCat !== c.name ? 'opacity-40' : ''}`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-c-text font-medium flex-1 text-left truncate">{c.name}</span>
                    <span className="text-[11px] font-bold text-c-text">{mask(formatKRW(c.value))}</span>
                    <span className="text-[10px] text-c-text3 w-9 text-right">{c.pct}%</span>
                  </button>
                ))}
                {categoryData.length > 5 && <div className="text-[10px] text-c-text3 pl-4">외 {categoryData.length - 5}개</div>}
              </div>
            </div>
            {/* 선택된 카테고리 상세 */}
            {selectedCat && (() => {
              const cat = categoryData.find(c => c.name === selectedCat);
              if (!cat) return null;
              return (
                <div className="mt-3 glass-inner rounded-xl p-3 animate-fade">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-c-text">{cat.name}</span>
                    <span className="text-xs text-c-text2">{cat.budgetAmt > 0 ? `예산 ${mask(formatKRW(cat.budgetAmt))}` : '예산 미설정'}</span>
                  </div>
                  {cat.budgetAmt > 0 && (
                    <div className="h-1.5 glass-inner rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(cat.value / cat.budgetAmt * 100, 100)}%`, backgroundColor: cat.value > cat.budgetAmt ? '#FF4757' : cat.color }} />
                    </div>
                  )}
                  <div className="space-y-1">
                    {cat.txs.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="text-c-text3 w-12">{t.date.substring(5)}</span>
                        <span className="text-c-text flex-1 truncate">{t.place || t.memo || '-'}</span>
                        <span className="font-bold text-c-text">{mask(formatKRW(t.amount))}</span>
                      </div>
                    ))}
                    {cat.txs.length > 5 && <div className="text-[10px] text-c-text3 text-center">외 {cat.txs.length - 5}건</div>}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 6개월 수입/지출 트렌드 ━━━ */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-c-text mb-3">6개월 추이</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3182F6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3182F6" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <YAxis width={45} tick={{ fontSize: 9, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                <Area type="monotone" dataKey="수입" stroke="#00C48C" fill="none" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Area type="monotone" dataKey="지출" stroke="#3182F6" fill="url(#homeGrad)" strokeWidth={2} dot={{ r: 3, fill: '#3182F6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[11px] text-c-text2">
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#00C48C] inline-block" style={{ borderTop: '1px dashed #00C48C' }} /> 수입</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#3182F6] inline-block" /> 지출</span>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 최근 거래 ━━━ */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-c-text">최근 거래</h2>
            <button onClick={() => setShowAllTx(!showAllTx)} className="text-[11px] text-[#3182F6] font-medium flex items-center gap-0.5">
              {showAllTx ? '접기' : '더보기'} <ChevronRight size={12} className={showAllTx ? 'rotate-90' : ''} />
            </button>
          </div>
          {recentTx.length > 0 ? (
            <div className="space-y-0.5">
              {recentTx.map((t, i) => (
                <div key={t.id || i} className="flex items-center gap-2.5 py-2 border-b border-c-border last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: (CATEGORY_COLORS[t.category] || '#8B95A1') + '18', color: CATEGORY_COLORS[t.category] || '#8B95A1' }}>
                    {t.category?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-c-text truncate">{t.place || t.category}</div>
                    <div className="text-[10px] text-c-text3">{t.date.substring(5)} {t.time || ''} · {t.payment || ''}</div>
                  </div>
                  <div className="text-sm font-bold text-c-text shrink-0">{mask(formatKRW(t.amount))}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-c-text3 text-center py-4">거래 내역이 없습니다</div>}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 포트폴리오 ━━━ */}
        {portfolio.length > 0 && (<>
          <div className="px-5 py-4">
            <h2 className="text-sm font-bold text-c-text mb-2">포트폴리오</h2>
            {portfolioSummary.items.map(stock => (
              <div key={stock.symbol} className="flex items-center gap-3 py-2.5 border-b border-c-border last:border-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: getLogoColor(stock.symbol) }}>
                  {stock.symbol.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-c-text">{stock.symbol}</div>
                  <div className="text-[11px] text-c-text3">{formatUSD(stock.currentPrice)} x {stock.shares.toLocaleString()}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-c-text">{mask(formatKRW(stock.value))}</div>
                  <div className={`text-[11px] font-semibold ${stock.pnl >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
                    {mask(`${stock.pnl >= 0 ? '+' : ''}${formatKRW(stock.pnl)} (${formatPercent(stock.pnlPercent)})`)}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-end justify-between">
              <div><div className="text-xs text-c-text2 mb-0.5">총 평가액</div><div className="font-extrabold text-[#3182F6] text-xl">{hideAmounts ? '•••••' : <CountUp value={portfolioSummary.totalValue} format={formatFullKRW} />}</div></div>
              <div className="text-right"><div className="text-xs text-c-text2 mb-0.5">월 배당</div><div className="font-bold text-[#00C48C] text-base">{mask(formatKRW(totalMonthlyDividend))}</div></div>
            </div>
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 목표 진행도 ━━━ */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-c-text mb-3">목표 진행도</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-inner rounded-2xl p-3.5 text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <GaugeCircle pct={goals.dividendGoal > 0 ? (totalMonthlyDividend / goals.dividendGoal * 100) : 0} color="#00C48C" size={56} stroke={4} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#00C48C]">{mask(`${(goals.dividendGoal > 0 ? totalMonthlyDividend / goals.dividendGoal * 100 : 0).toFixed(0)}%`)}</div>
              </div>
              <div className="text-[11px] text-c-text3 mb-0.5">배당 목표</div>
              <div className="text-sm font-bold text-c-text">{mask(formatKRW(totalMonthlyDividend))}</div>
              <div className="text-[10px] text-c-text3">/ <EditableNumber value={goals.dividendGoal} onSave={(v) => setGoals({...goals, dividendGoal: Math.round(v)})} format={formatKRW} /></div>
            </div>
            <div className="glass-inner rounded-2xl p-3.5 text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <GaugeCircle pct={goals.netWorthGoal > 0 ? (netWorth / goals.netWorthGoal * 100) : 0} color="#3182F6" size={56} stroke={4} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#3182F6]">{mask(`${(goals.netWorthGoal > 0 ? netWorth / goals.netWorthGoal * 100 : 0).toFixed(0)}%`)}</div>
              </div>
              <div className="text-[11px] text-c-text3 mb-0.5">순자산 목표</div>
              <div className="text-sm font-bold text-c-text">{mask(formatKRW(netWorth))}</div>
              <div className="text-[10px] text-c-text3">/ <EditableNumber value={goals.netWorthGoal} onSave={(v) => setGoals({...goals, netWorthGoal: Math.round(v)})} format={formatKRW} /></div>
            </div>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 경제 일정 ━━━ */}
        <div className="px-5 pt-4 pb-5">
          <h2 className="text-sm font-bold text-c-text mb-2">경제 일정</h2>
          {todayEvents.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-[#FF4757] mb-1.5 tracking-widest uppercase">Today</div>
              {todayEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-c-border">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${importanceDotColor(e.importance)}`} />
                  <span className="text-[11px] text-c-text3 shrink-0">{e.time}</span>
                  <span className="text-sm flex-1 text-c-text font-medium">{e.name}</span>
                </div>
              ))}
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-c-text3 mb-1.5 tracking-widest uppercase">Upcoming</div>
              {upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-c-border last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${importanceDotColor(e.importance)}`} />
                  <span className="text-[11px] text-c-text3 shrink-0">{e.date.substring(5)} {e.time}</span>
                  <span className="text-sm flex-1 text-c-text2">{e.name}</span>
                </div>
              ))}
            </div>
          )}
          {todayEvents.length === 0 && upcomingEvents.length === 0 && <div className="text-sm text-c-text3 text-center py-4">예정된 일정이 없습니다</div>}
          {portfolio.length > 0 && (todayEvents.length > 0 || upcomingEvents.length > 0) && (
            <div className="mt-2 bg-[#3182F6]/8 border border-[#3182F6]/15 rounded-xl p-3">
              <div className="text-[11px] font-bold text-[#3182F6] mb-1">내 포트폴리오 영향</div>
              <div className="text-xs text-c-text2">보유 종목({portfolio.map(s => s.symbol).join(', ')})에 영향을 줄 수 있는 지표입니다.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function WeeklyMini({ transactions, hideAmounts }) {
  const data = useMemo(() => {
    const now = new Date(), dow = now.getDay(), mon = new Date(now);
    mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const lastMon = new Date(mon); lastMon.setDate(lastMon.getDate() - 7);
    let thisW = 0, lastW = 0;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const amt = transactions.filter(t => t.date === ds && !t.refunded).reduce((s, t) => s + t.amount, 0);
      thisW += amt;
      days.push({ d: ['월','화','수','목','금','토','일'][i], v: amt });
      const ld = new Date(lastMon); ld.setDate(lastMon.getDate() + i);
      lastW += transactions.filter(t => t.date === ld.toISOString().split('T')[0] && !t.refunded).reduce((s, t) => s + t.amount, 0);
    }
    const diff = lastW > 0 ? ((thisW - lastW) / lastW * 100) : 0;
    return { days, thisW, lastW, diff };
  }, [transactions]);

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-c-text">이번주 지출</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-c-text">{hideAmounts ? '•••••' : formatKRW(data.thisW)}</span>
          {data.lastW > 0 && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${data.diff <= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
              {data.diff <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {hideAmounts ? '•••' : `${data.diff > 0 ? '+' : ''}${data.diff.toFixed(0)}%`}
            </span>
          )}
        </div>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data.days}><Bar dataKey="v" fill="#3182F6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[9px] text-c-text3 mt-0.5">{data.days.map(d => <span key={d.d}>{d.d}</span>)}</div>
    </div>
  );
}

export default HomeTab;
