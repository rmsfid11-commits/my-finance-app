import { useState, useMemo } from 'react';
import { formatKRW, formatFullKRW } from '../../utils/formatters';
import { PEER_DATA, CATEGORY_COLORS } from '../../data/initialData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from 'recharts';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Flame, Calendar, Target, Shield, Zap, PieChart as PieIcon, Activity, BarChart3, Users, Wallet, AlertTriangle, Sparkles } from 'lucide-react';

const LINE_COLORS = ['#3182F6','#00C48C','#FF9F43','#7C5CFC','#FF4757','#0ABDE3'];
const getCatColor = (cats, name) => cats?.find(c => c.name === name)?.color || CATEGORY_COLORS?.[name] || '#8B95A1';

function StatsTab({ profile, goals, setGoals, budget, transactions, portfolio, stockPrices, exchangeRate, dividends, fixedExpenses, hideAmounts, customCategories }) {
  const [expanded, setExpanded] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [selectedBudgetCat, setSelectedBudgetCat] = useState(null);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedWaste, setSelectedWaste] = useState(null);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const rate = exchangeRate || 1450;
  const today = new Date();
  const currentMonth = today.toISOString().substring(0, 7);
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth) && !t.refunded), [transactions, currentMonth]);
  const monthSpending = monthTx.reduce((s, t) => s + t.amount, 0);
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalExpense = monthSpending + fixedTotal;
  const totalBudget = Object.values(budget).reduce((s, v) => s + v, 0);
  const savings = profile.salary - totalExpense;
  const savingRate = profile.salary > 0 ? savings / profile.salary * 100 : 0;

  const portfolioValue = portfolio.reduce((s, stock) => s + stock.shares * (stockPrices[stock.symbol]?.price || stock.avgPrice) * rate, 0);
  const portfolioCost = portfolio.reduce((s, stock) => s + stock.shares * stock.avgPrice * rate, 0);
  const portfolioPnlPct = portfolioCost > 0 ? ((portfolioValue - portfolioCost) / portfolioCost * 100) : 0;
  const netWorth = portfolioValue;

  const totalMonthlyDiv = useMemo(() => { const r = dividends.slice(-3); return r.length > 0 ? r.reduce((s, d) => s + d.amount, 0) / r.length : 0; }, [dividends]);
  const divGoalYears = totalMonthlyDiv >= goals.dividendGoal ? 0 : ((goals.dividendGoal - totalMonthlyDiv) / (totalMonthlyDiv || 10000) * 2).toFixed(1);
  const nwGoalMonths = useMemo(() => { if (netWorth >= goals.netWorthGoal) return 0; const g = savings + portfolioValue * 0.008; return g <= 0 ? 999 : Math.ceil((goals.netWorthGoal - netWorth) / g); }, [netWorth, goals.netWorthGoal, savings, portfolioValue]);

  // ─── 재무 건강 점수 ───
  const healthDetail = useMemo(() => {
    const items = [];
    const savS = Math.min(Math.max(savingRate, 0) / 40 * 30, 30);
    items.push({ label: '저축률', score: savS, max: 30, desc: `${savingRate.toFixed(1)}% (권장 20-40%)`, tip: savingRate >= 20 ? '좋은 저축 습관이에요!' : '저축률을 높여보세요' });
    const bc = totalBudget > 0 ? Math.max(0, 1 - monthSpending / totalBudget) * 100 : 50;
    const budS = Math.min(bc / 100 * 25, 25);
    items.push({ label: '예산 준수', score: budS, max: 25, desc: `예산 대비 ${totalBudget > 0 ? ((monthSpending / totalBudget) * 100).toFixed(0) : 0}% 사용`, tip: monthSpending <= totalBudget ? '예산 내 지출 중!' : '예산을 초과했어요' });
    const invS = Math.min(Math.max(portfolioPnlPct + 10, 0) / 30 * 20, 20);
    items.push({ label: '투자 수익', score: invS, max: 20, desc: `수익률 ${portfolioPnlPct.toFixed(1)}%`, tip: portfolioPnlPct >= 0 ? '수익 중입니다' : '손실 중이에요' });
    const fr = profile.salary > 0 ? fixedTotal / profile.salary * 100 : 50;
    const fixS = Math.min(Math.max(0, (50 - fr) / 50) * 15, 15);
    items.push({ label: '고정비 효율', score: fixS, max: 15, desc: `수입의 ${fr.toFixed(1)}%`, tip: fr <= 30 ? '효율적인 고정비!' : '고정비 줄이기를 고려하세요' });
    const divS = Math.min(portfolio.length / 5 * 10, 10);
    items.push({ label: '포트폴리오 다양성', score: divS, max: 10, desc: `${portfolio.length}종목 보유`, tip: portfolio.length >= 5 ? '분산 투자 굿!' : '종목을 더 늘려보세요' });
    return items;
  }, [savingRate, totalBudget, monthSpending, portfolioPnlPct, fixedTotal, profile.salary, portfolio.length]);
  const healthScore = Math.round(healthDetail.reduce((s, i) => s + i.score, 0));
  const healthGrade = healthScore >= 90 ? 'S' : healthScore >= 75 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D';
  const gradeColor = healthScore >= 90 ? '#00C48C' : healthScore >= 75 ? '#3182F6' : healthScore >= 60 ? '#FF9F43' : '#FF4757';

  // ─── 지출 속도 게이지 ───
  const spendingPace = useMemo(() => {
    const expected = totalBudget * monthProgress;
    const pace = expected > 0 ? (monthSpending / expected) * 100 : 0;
    const projected = monthProgress > 0 ? Math.round(monthSpending / monthProgress) : 0;
    const status = pace <= 90 ? '여유' : pace <= 110 ? '적정' : pace <= 130 ? '주의' : '위험';
    const color = pace <= 90 ? '#00C48C' : pace <= 110 ? '#3182F6' : pace <= 130 ? '#FF9F43' : '#FF4757';
    // daily breakdown
    const daily = [];
    for (let d = 1; d <= dayOfMonth; d++) {
      const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const amt = monthTx.filter(t => t.date === ds).reduce((s, t) => s + t.amount, 0);
      daily.push({ day: `${d}일`, amount: amt, expected: Math.round(totalBudget / daysInMonth) });
    }
    return { pace: Math.round(pace), projected, status, color, daily };
  }, [monthSpending, totalBudget, monthProgress, monthTx, dayOfMonth, daysInMonth, today]);

  // ─── 예산 초과 예측 ───
  const budgetPredictions = useMemo(() => {
    const cs = {}; monthTx.forEach(t => { cs[t.category] = (cs[t.category] || 0) + t.amount; });
    return Object.entries(budget).filter(([, b]) => b > 0).map(([cat, b]) => {
      const spent = cs[cat] || 0;
      const proj = monthProgress > 0 ? Math.round(spent / monthProgress) : 0;
      const txList = monthTx.filter(t => t.category === cat).sort((a, b) => b.amount - a.amount);
      return { cat, budget: b, spent, projected: proj, overflow: proj > b, pct: Math.round(spent / b * 100), txList };
    }).filter(p => p.pct > 50).sort((a, b) => b.pct - a.pct);
  }, [monthTx, budget, monthProgress]);

  // ─── 레이더 차트 ───
  const radarData = useMemo(() => {
    const bc = totalBudget > 0 ? Math.min(Math.max(0, (1 - (monthSpending - totalBudget) / totalBudget)) * 100, 100) : 50;
    const fe = profile.salary > 0 ? Math.min(Math.max(0, (1 - fixedTotal / (profile.salary * 0.5))) * 100, 100) : 50;
    const ir = Math.min(Math.max(portfolioPnlPct + 50, 0), 100);
    const div = Math.min(portfolio.length / 5 * 100, 100);
    return [
      { subject: '저축률', value: Math.min(Math.max(savingRate * 2, 0), 100) },
      { subject: '예산준수', value: bc },
      { subject: '투자수익', value: ir },
      { subject: '고정비효율', value: fe },
      { subject: '다양성', value: div },
    ];
  }, [savingRate, totalBudget, monthSpending, fixedTotal, profile.salary, portfolioPnlPct, portfolio.length]);

  // ─── 히트맵 캘린더 ───
  const heatmap = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const dailyT = {}; monthTx.forEach(t => { if (!dailyT[t.date]) dailyT[t.date] = []; dailyT[t.date].push(t); });
    const dailySum = {}; Object.entries(dailyT).forEach(([d, txs]) => { dailySum[d] = txs.reduce((s, t) => s + t.amount, 0); });
    const maxS = Math.max(...Object.values(dailySum), 1);
    const cells = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const amt = dailySum[ds] || 0;
      const txs = dailyT[ds] || [];
      cells.push({ day: d, date: ds, amount: amt, intensity: amt / maxS, txs });
    }
    return { cells, maxS, dailyT };
  }, [monthTx, today]);

  const getHeatColor = (i) => i === 0 ? 'var(--c-subtle)' : i < 0.25 ? 'rgba(49,130,246,0.25)' : i < 0.5 ? 'rgba(255,159,67,0.4)' : i < 0.75 ? 'rgba(255,71,87,0.5)' : 'rgba(255,71,87,0.8)';

  // ─── 저축 스트릭 ───
  const savingStreakData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const moSpend = transactions.filter(t => t.date.startsWith(mo) && !t.refunded).reduce((s, t) => s + t.amount, 0) + fixedTotal;
      const moSave = profile.salary - moSpend;
      const achieved = moSave >= goals.savingGoal;
      months.push({ month: `${d.getMonth() + 1}월`, savings: moSave, goal: goals.savingGoal, achieved });
    }
    let streak = 0;
    for (const m of months) { if (m.achieved) streak++; else break; }
    return { streak, months: months.reverse() };
  }, [transactions, profile.salary, fixedTotal, goals.savingGoal]);

  // ─── 연간 저축 진행도 ───
  const yearSavings = useMemo(() => {
    const year = today.getFullYear();
    const monthlyData = [];
    let total = 0;
    for (let m = 0; m <= today.getMonth(); m++) {
      const mo = `${year}-${String(m + 1).padStart(2, '0')}`;
      const moSpend = transactions.filter(t => t.date.startsWith(mo) && !t.refunded).reduce((s, t) => s + t.amount, 0) + fixedTotal;
      const s = profile.salary - moSpend;
      total += s;
      monthlyData.push({ month: `${m + 1}월`, savings: s, cumulative: total });
    }
    const goal = goals.savingGoal * 12;
    return { total, goal, pct: goal > 0 ? Math.min(total / goal * 100, 100) : 0, monthlyData };
  }, [transactions, profile.salary, fixedTotal, goals.savingGoal, today]);

  // ─── 이번달 하이라이트 ───
  const highlights = useMemo(() => {
    const byDate = {}; monthTx.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.amount; });
    const dates = Object.entries(byDate);
    const maxDay = dates.length > 0 ? dates.reduce((a, b) => a[1] > b[1] ? a : b) : null;
    const minDay = dates.length > 0 ? dates.reduce((a, b) => a[1] < b[1] ? a : b) : null;
    const maxSingle = monthTx.length > 0 ? monthTx.reduce((a, b) => a.amount > b.amount ? a : b) : null;
    const noSpend = dayOfMonth - new Set(monthTx.map(t => t.date)).size;
    const maxDayTxs = maxDay ? monthTx.filter(t => t.date === maxDay[0]) : [];
    const minDayTxs = minDay ? monthTx.filter(t => t.date === minDay[0]) : [];
    return { maxDay, minDay, maxSingle, noSpend, txCount: monthTx.length, maxDayTxs, minDayTxs };
  }, [monthTx, dayOfMonth]);

  // ─── 카테고리별 월간 트렌드 ───
  const categoryTrend = useMemo(() => {
    const cats = [...new Set(monthTx.map(t => t.category))].slice(0, 5);
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const moTx = transactions.filter(t => t.date.startsWith(mo) && !t.refunded);
      const entry = { month: `${d.getMonth() + 1}월` };
      cats.forEach(cat => { entry[cat] = moTx.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0); });
      data.push(entry);
    }
    return { data, cats };
  }, [transactions, monthTx]);

  // ─── 또래 비교 ───
  const peer = useMemo(() => {
    const bt = PEER_DATA.filter(p => p.savingRate < savingRate).length;
    const avgSR = PEER_DATA.reduce((s, p) => s + p.savingRate, 0) / PEER_DATA.length;
    const dist = [
      { range: '10-15%', count: PEER_DATA.filter(p => p.savingRate >= 10 && p.savingRate < 15).length },
      { range: '15-20%', count: PEER_DATA.filter(p => p.savingRate >= 15 && p.savingRate < 20).length },
      { range: '20-25%', count: PEER_DATA.filter(p => p.savingRate >= 20 && p.savingRate < 25).length },
      { range: '25-30%', count: PEER_DATA.filter(p => p.savingRate >= 25 && p.savingRate < 30).length },
      { range: '30-35%', count: PEER_DATA.filter(p => p.savingRate >= 30 && p.savingRate < 35).length },
      { range: '35-40%', count: PEER_DATA.filter(p => p.savingRate >= 35 && p.savingRate < 40).length },
      { range: '40-45%', count: PEER_DATA.filter(p => p.savingRate >= 40 && p.savingRate < 45).length },
      { range: '45%+', count: PEER_DATA.filter(p => p.savingRate >= 45).length },
    ];
    const avgExp = PEER_DATA.reduce((s, p) => s + p.totalExpense, 0) / PEER_DATA.length;
    return { myRank: 600 - bt, betterThan: bt, avgSR: avgSR.toFixed(1), dist, avgExp };
  }, [savingRate]);

  // ─── 또래 순위 변화 ───
  const rankTrend = useMemo(() => {
    const r = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const moSpend = transactions.filter(t => t.date.startsWith(mo) && !t.refunded).reduce((s, t) => s + t.amount, 0) + fixedTotal;
      const moSR = profile.salary > 0 ? (profile.salary - moSpend) / profile.salary * 100 : 0;
      r.push({ month: `${d.getMonth() + 1}월`, rank: 600 - PEER_DATA.filter(p => p.savingRate < moSR).length, savingRate: moSR.toFixed(1) });
    }
    return r;
  }, [transactions, fixedTotal, profile.salary]);

  // ─── 카테고리별 또래 비교 ───
  const catPeerCompare = useMemo(() => {
    const cs = {}; monthTx.forEach(t => { cs[t.category] = (cs[t.category] || 0) + t.amount; });
    const peerAvg = peer.avgExp;
    const totalCat = Object.values(cs).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(cs).map(([cat, amt]) => {
      const pa = Math.round(peerAvg * (amt / totalCat) * 0.95);
      const txList = monthTx.filter(t => t.category === cat).sort((a, b) => b.amount - a.amount);
      return { cat, mine: amt, peer: pa, diff: amt - pa, txList };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [monthTx, peer.avgExp]);

  // ─── 월별 분석 ───
  const monthlyTrend = useMemo(() => {
    const m = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const spending = transactions.filter(t => t.date.startsWith(mo) && !t.refunded).reduce((s, t) => s + t.amount, 0) + fixedTotal;
      const actual = spending || Math.round(profile.salary * 0.6);
      m.push({ month: `${d.getMonth() + 1}월`, 수입: profile.salary, 지출: actual, 저축: profile.salary - actual });
    }
    return m;
  }, [transactions, profile, fixedTotal]);

  // ─── 순자산 추이 ───
  const netWorthTrend = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { month: `${d.getMonth() + 1}월`, value: Math.round(portfolioValue * (1 - (5 - i) * 0.05) + savings * (i + 1)) };
  }), [portfolioValue, savings]);

  // ─── 투자 수익률 추이 ───
  const investReturnTrend = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { month: `${d.getMonth() + 1}월`, 수익률: Math.round(portfolioPnlPct * ((i + 1) / 6) * 10) / 10 };
  }), [portfolioPnlPct]);

  // ─── 배당 성장 ───
  const dividendTrend = useMemo(() => {
    const m = {}; dividends.forEach(d => { const mo = d.date.substring(0, 7); m[mo] = (m[mo] || 0) + d.amount; });
    return Object.entries(m).slice(-6).map(([month, amount]) => ({ month: month.substring(5) + '월', amount }));
  }, [dividends]);

  // ─── 자산 배분 ───
  const assetAlloc = useMemo(() => {
    const cash = Math.max(0, savings * 3);
    const stocks = {};
    portfolio.forEach(s => { stocks[s.symbol] = { name: s.name || s.symbol, value: s.shares * (stockPrices[s.symbol]?.price || s.avgPrice) * rate, shares: s.shares }; });
    return {
      summary: [
        { name: '투자자산', value: portfolioValue, color: '#3182F6' },
        { name: '현금성', value: cash, color: '#00C48C' },
        { name: '고정비', value: fixedTotal * 12, color: '#FF9F43' },
      ].filter(a => a.value > 0),
      stocks
    };
  }, [portfolioValue, savings, fixedTotal, portfolio, stockPrices, rate]);

  // ─── 고정지출 비율 ───
  const fixedRatio = profile.salary > 0 ? (fixedTotal / profile.salary * 100) : 0;

  // ─── 불필요 지출 감지 ───
  const wasteful = useMemo(() => {
    const pc = {}; monthTx.forEach(t => { if (t.place) { if (!pc[t.place]) pc[t.place] = { count: 0, total: 0, txs: [] }; pc[t.place].count++; pc[t.place].total += t.amount; pc[t.place].txs.push(t); } });
    return Object.entries(pc).filter(([, v]) => v.count >= 3).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([place, d]) => ({ place, ...d, avg: Math.round(d.total / d.count) }));
  }, [monthTx]);

  // ─── FIRE 달성률 ───
  const fire = useMemo(() => {
    const annExp = totalExpense * 12;
    const fireNum = annExp * 25;
    let cur = netWorth, months = 0;
    const mSave = savings, mRet = 0.007;
    const milestones = [];
    if (mSave <= 0 && cur < fireNum) return { fireNum, pct: fireNum > 0 ? (netWorth / fireNum * 100) : 0, months: 999, years: '∞', milestones };
    while (cur < fireNum && months < 600) {
      cur = cur * (1 + mRet) + mSave; months++;
      if (months % 60 === 0) milestones.push({ year: months / 12, amount: Math.round(cur) });
    }
    milestones.push({ year: Math.round(months / 12 * 10) / 10, amount: Math.round(fireNum) });
    return { fireNum, pct: Math.min(fireNum > 0 ? netWorth / fireNum * 100 : 0, 100), months, years: (months / 12).toFixed(1), milestones };
  }, [totalExpense, savings, netWorth]);

  // ─── 월간 리포트 카드 ───
  const reportCard = useMemo(() => {
    const getGrade = (score) => score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const getColor = (g) => g === 'S' ? '#00C48C' : g === 'A' ? '#3182F6' : g === 'B' ? '#FF9F43' : '#FF4757';
    const savScore = Math.min(Math.max(savingRate * 2, 0), 100);
    const budScore = totalBudget > 0 ? Math.min(Math.max((1 - monthSpending / totalBudget) * 100 + 50, 0), 100) : 50;
    const invScore = Math.min(Math.max(portfolioPnlPct * 2 + 50, 0), 100);
    const fixScore = Math.min(Math.max((1 - fixedRatio / 50) * 100, 0), 100);
    const items = [
      { label: '저축', score: savScore, grade: getGrade(savScore), detail: `저축률 ${savingRate.toFixed(1)}% · 월 ${formatKRW(savings)}`, advice: savingRate >= 30 ? '훌륭한 저축 습관!' : savingRate >= 20 ? '평균 이상이에요' : '저축을 더 늘려보세요' },
      { label: '예산관리', score: budScore, grade: getGrade(budScore), detail: `예산의 ${totalBudget > 0 ? ((monthSpending / totalBudget) * 100).toFixed(0) : 0}% 사용`, advice: monthSpending <= totalBudget ? '예산 내 잘 관리 중!' : '예산 초과 주의' },
      { label: '투자', score: invScore, grade: getGrade(invScore), detail: `수익률 ${portfolioPnlPct.toFixed(1)}% · ${portfolio.length}종목`, advice: portfolioPnlPct >= 5 ? '좋은 수익률!' : portfolioPnlPct >= 0 ? '안정적 수익' : '손실 관리 필요' },
      { label: '고정비', score: fixScore, grade: getGrade(fixScore), detail: `수입의 ${fixedRatio.toFixed(1)}% · ${formatKRW(fixedTotal)}`, advice: fixedRatio <= 25 ? '효율적 고정비!' : fixedRatio <= 40 ? '적정 수준' : '고정비 구조개선 필요' },
    ];
    return items.map(i => ({ ...i, color: getColor(i.grade) }));
  }, [savingRate, totalBudget, monthSpending, portfolioPnlPct, fixedRatio, savings, fixedTotal, portfolio.length]);

  const H = (v) => hideAmounts ? '•••••' : v;

  // ─── 트랜잭션 리스트 렌더 ───
  const renderTxList = (txs, max = 10) => (
    <div className="space-y-1 mt-2">
      {txs.slice(0, max).map((t, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-c-subtle transition-colors">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCatColor(customCategories, t.category) }} />
          <span className="text-xs text-c-text2 w-12">{t.time || t.date.substring(5)}</span>
          <span className="text-xs text-c-text font-medium flex-1 truncate">{t.place || t.category}</span>
          <span className="text-xs font-bold text-c-text">{H(formatKRW(t.amount))}</span>
        </div>
      ))}
      {txs.length > max && <div className="text-[11px] text-c-text3 text-center pt-1">외 {txs.length - max}건</div>}
      {txs.length === 0 && <div className="text-[11px] text-c-text3 text-center py-2">거래 내역 없음</div>}
    </div>
  );

  // ─── 섹션 헤더 ───
  const SectionHeader = ({ id, icon: Icon, title, badge, badgeColor }) => (
    <button onClick={() => toggle(id)} className="w-full flex items-center justify-between px-5 py-4 transition-colors active:bg-c-subtle">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#3182F6]" />
        <h2 className="text-sm font-bold text-c-text">{title}</h2>
        {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (badgeColor || '#3182F6') + '18', color: badgeColor || '#3182F6' }}>{badge}</span>}
      </div>
      {expanded === id ? <ChevronUp size={16} className="text-c-text3" /> : <ChevronDown size={16} className="text-c-text3" />}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col animate-slide">
      <div className="glass flex-1 flex flex-col">

        {/* ━━━ 재무 건강 점수 ━━━ */}
        <button onClick={() => toggle('health')} className="px-5 pt-5 pb-4 text-left active:bg-c-subtle transition-colors">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--c-border)" strokeWidth="6" opacity="0.3" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={gradeColor} strokeWidth="6" strokeDasharray={`${healthScore * 2.136} 999`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-extrabold" style={{ color: gradeColor }}>{healthGrade}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-c-text2 mb-0.5">재무 건강 점수</div>
              <div className="text-3xl font-extrabold text-c-text">{H(healthScore)}<span className="text-sm font-medium text-c-text2"> / 100</span></div>
              <div className="text-[11px] text-c-text3 mt-0.5">{healthScore >= 75 ? '건강한 재무 상태입니다' : healthScore >= 50 ? '개선의 여지가 있어요' : '재무 관리에 신경 써주세요'} <span className="text-[#3182F6]">상세보기 →</span></div>
            </div>
          </div>
        </button>
        {expanded === 'health' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="space-y-3">
              {healthDetail.map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-c-text">{item.label}</span>
                    <span className="text-xs font-bold" style={{ color: gradeColor }}>{item.score.toFixed(1)} / {item.max}</span>
                  </div>
                  <div className="h-1.5 glass-inner rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.score / item.max) * 100}%`, backgroundColor: gradeColor }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-c-text3">{item.desc}</span>
                    <span className="text-c-text2">{item.tip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 이번달 하이라이트 ━━━ */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-c-text mb-3">이번달 하이라이트</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSelectedHighlight(selectedHighlight === 'max' ? null : 'max')} className={`glass-inner rounded-xl p-3 text-left transition-all ${selectedHighlight === 'max' ? 'ring-1 ring-[#FF4757]' : 'active:scale-[0.97]'}`}>
              <div className="text-[11px] text-c-text3">가장 많이 쓴 날</div>
              <div className="text-sm font-bold text-[#FF4757]">{H(highlights.maxDay ? `${highlights.maxDay[0].substring(5)} · ${formatKRW(highlights.maxDay[1])}` : '-')}</div>
            </button>
            <button onClick={() => setSelectedHighlight(selectedHighlight === 'min' ? null : 'min')} className={`glass-inner rounded-xl p-3 text-left transition-all ${selectedHighlight === 'min' ? 'ring-1 ring-[#00C48C]' : 'active:scale-[0.97]'}`}>
              <div className="text-[11px] text-c-text3">가장 아낀 날</div>
              <div className="text-sm font-bold text-[#00C48C]">{H(highlights.minDay ? `${highlights.minDay[0].substring(5)} · ${formatKRW(highlights.minDay[1])}` : '-')}</div>
            </button>
            <button onClick={() => setSelectedHighlight(selectedHighlight === 'single' ? null : 'single')} className={`glass-inner rounded-xl p-3 text-left transition-all ${selectedHighlight === 'single' ? 'ring-1 ring-[#7C5CFC]' : 'active:scale-[0.97]'}`}>
              <div className="text-[11px] text-c-text3">최대 단건 지출</div>
              <div className="text-sm font-bold text-c-text">{H(highlights.maxSingle ? `${highlights.maxSingle.place || highlights.maxSingle.category} ${formatKRW(highlights.maxSingle.amount)}` : '-')}</div>
            </button>
            <div className="glass-inner rounded-xl p-3">
              <div className="text-[11px] text-c-text3">무지출 일수</div>
              <div className="text-sm font-bold text-[#7C5CFC]">{highlights.noSpend}일 / {dayOfMonth}일</div>
            </div>
          </div>
          {selectedHighlight === 'max' && highlights.maxDayTxs.length > 0 && (
            <div className="mt-2 glass-inner rounded-xl p-3 animate-fade">
              <div className="text-xs font-bold text-c-text mb-1">{highlights.maxDay[0]} 지출 내역</div>
              {renderTxList(highlights.maxDayTxs)}
            </div>
          )}
          {selectedHighlight === 'min' && highlights.minDayTxs.length > 0 && (
            <div className="mt-2 glass-inner rounded-xl p-3 animate-fade">
              <div className="text-xs font-bold text-c-text mb-1">{highlights.minDay[0]} 지출 내역</div>
              {renderTxList(highlights.minDayTxs)}
            </div>
          )}
          {selectedHighlight === 'single' && highlights.maxSingle && (
            <div className="mt-2 glass-inner rounded-xl p-3 animate-fade">
              <div className="text-xs font-bold text-c-text mb-1">최대 단건 상세</div>
              <div className="text-xs text-c-text2">
                <div>카테고리: {highlights.maxSingle.category}</div>
                <div>장소: {highlights.maxSingle.place || '-'}</div>
                <div>금액: {H(formatFullKRW(highlights.maxSingle.amount))}</div>
                <div>일시: {highlights.maxSingle.date} {highlights.maxSingle.time || ''}</div>
                {highlights.maxSingle.memo && <div>메모: {highlights.maxSingle.memo}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 지출 속도 게이지 ━━━ */}
        <SectionHeader id="pace" icon={Activity} title="지출 속도" badge={spendingPace.status} badgeColor={spendingPace.color} />
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl font-extrabold" style={{ color: spendingPace.color }}>{H(`${spendingPace.pace}%`)}</div>
            <div className="text-xs text-c-text3">예산 대비 소진율 ({dayOfMonth}일차 / {daysInMonth}일)</div>
          </div>
          <div className="h-3 glass-inner rounded-full overflow-hidden relative">
            <div className="absolute top-0 h-full w-px bg-c-text2 opacity-40" style={{ left: `${monthProgress * 100}%` }} />
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(spendingPace.pace, 100)}%`, backgroundColor: spendingPace.color }} />
          </div>
          <div className="flex justify-between text-[11px] text-c-text3 mt-1">
            <span>현재 {H(formatKRW(monthSpending))}</span>
            <span>예상 월말 {H(formatKRW(spendingPace.projected))}</span>
          </div>
        </div>
        {expanded === 'pace' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">일별 지출 추이</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingPace.daily}>
                  <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis width={40} tick={{ fontSize: 9, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                  <Bar dataKey="amount" fill={spendingPace.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 예산 초과 예측 ━━━ */}
        {budgetPredictions.length > 0 && (<>
          <SectionHeader id="budget" icon={AlertTriangle} title="예산 초과 예측" badge={`${budgetPredictions.filter(p => p.overflow).length}개 초과`} badgeColor="#FF4757" />
          <div className="px-5 pb-4">
            <div className="space-y-2.5">
              {budgetPredictions.map(p => (
                <div key={p.cat}>
                  <button onClick={() => setSelectedBudgetCat(selectedBudgetCat === p.cat ? null : p.cat)} className="w-full text-left active:opacity-70 transition-opacity">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-c-text">{p.cat}</span>
                      <span className={`text-xs font-bold ${p.overflow ? 'text-[#FF4757]' : 'text-c-text2'}`}>{H(`${formatKRW(p.spent)} / ${formatKRW(p.budget)}`)}</span>
                    </div>
                    <div className="h-1.5 glass-inner rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.overflow ? 'bg-[#FF4757]' : p.pct > 80 ? 'bg-[#FF9F43]' : 'bg-[#00C48C]'}`} style={{ width: `${Math.min(p.pct, 100)}%` }} />
                    </div>
                    {p.overflow && <div className="text-[11px] text-[#FF4757] mt-0.5">월말 예상 {H(formatKRW(p.projected))} → 초과 예상!</div>}
                  </button>
                  {selectedBudgetCat === p.cat && (
                    <div className="mt-1 glass-inner rounded-xl p-3 animate-fade">
                      <div className="text-xs font-bold text-c-text mb-1">{p.cat} 지출 내역</div>
                      {renderTxList(p.txList)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {expanded === 'budget' && <div className="px-5 pb-4 animate-fade"><div className="text-[11px] text-c-text2 bg-c-subtle rounded-xl p-3">예산 대비 50% 이상 사용한 카테고리를 표시합니다. 월말 예상 금액은 현재 소비 속도 기준입니다.</div></div>}
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 레이더 차트 ━━━ */}
        <SectionHeader id="radar" icon={Shield} title="재무 역량 분석" />
        <div className="px-5 pb-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="var(--c-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--c-text2)' }} />
                <Radar dataKey="value" stroke="#3182F6" fill="#3182F6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {expanded === 'radar' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="space-y-2">
              {radarData.map(d => (
                <div key={d.subject} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-c-text w-16">{d.subject}</span>
                  <div className="flex-1 h-2 glass-inner rounded-full overflow-hidden">
                    <div className="h-full bg-[#3182F6] rounded-full" style={{ width: `${d.value}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#3182F6] w-10 text-right">{Math.round(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 히트맵 캘린더 ━━━ */}
        <SectionHeader id="heatmap" icon={Calendar} title="지출 히트맵" />
        <div className="px-5 pb-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="text-[10px] font-bold text-c-text3">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmap.cells.map((c, i) => c ? (
              <button key={i} onClick={() => setSelectedDay(selectedDay === c.date ? null : c.date)} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-all active:scale-90 ${selectedDay === c.date ? 'ring-2 ring-[#3182F6] scale-110' : ''}`} style={{ backgroundColor: getHeatColor(c.intensity), color: c.intensity > 0.5 ? '#fff' : 'var(--c-text3)' }}>
                {c.day}
              </button>
            ) : <div key={i} />)}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[10px] text-c-text3">적음</span>
            {[0, 0.25, 0.5, 0.75, 1].map(v => <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatColor(v) }} />)}
            <span className="text-[10px] text-c-text3">많음</span>
          </div>
          {selectedDay && (
            <div className="mt-3 glass-inner rounded-xl p-3 animate-fade">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-c-text">{selectedDay}</span>
                <span className="text-xs font-bold text-[#3182F6]">{H(formatFullKRW(heatmap.cells.find(c => c?.date === selectedDay)?.amount || 0))}</span>
              </div>
              {renderTxList(heatmap.cells.find(c => c?.date === selectedDay)?.txs || [])}
            </div>
          )}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 저축 스트릭 + 연간 저축 ━━━ */}
        <SectionHeader id="saving" icon={Flame} title="저축 현황" badge={`${savingStreakData.streak}개월 연속`} badgeColor="#FF9F43" />
        <div className="px-5 pb-4">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 glass-inner rounded-2xl p-4 text-center">
              <div className="text-[11px] text-c-text3 mb-1">저축 연속 기록</div>
              <div className="text-3xl font-extrabold text-[#FF9F43]">{savingStreakData.streak}</div>
              <div className="text-xs text-c-text2">개월 연속 달성</div>
            </div>
            <div className="flex-1 glass-inner rounded-2xl p-4 text-center">
              <div className="text-[11px] text-c-text3 mb-1">올해 저축 진행</div>
              <div className="text-lg font-extrabold text-[#7C5CFC]">{H(formatKRW(yearSavings.total))}</div>
              <div className="text-xs text-c-text2">목표 {H(formatKRW(yearSavings.goal))}</div>
            </div>
          </div>
          <div className="h-2 glass-inner rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] transition-all duration-700" style={{ width: `${Math.min(Math.max(yearSavings.pct, 0), 100)}%` }} />
          </div>
          <div className="text-[11px] text-c-text3 mt-1 text-right">{H(`${yearSavings.pct.toFixed(1)}% 달성`)}</div>
        </div>
        {expanded === 'saving' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">월별 저축 내역</div>
            <div className="space-y-1.5">
              {savingStreakData.months.map(m => (
                <div key={m.month} className="flex items-center gap-2">
                  <span className="text-xs w-8 text-c-text2">{m.month}</span>
                  <div className="flex-1 h-3 glass-inner rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.achieved ? 'bg-[#00C48C]' : 'bg-[#FF4757]'}`} style={{ width: `${Math.min(Math.max(m.savings / (m.goal || 1) * 100, 0), 100)}%` }} />
                  </div>
                  <span className={`text-[11px] font-bold w-16 text-right ${m.achieved ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{H(formatKRW(m.savings))}</span>
                  <span className="text-[10px]">{m.achieved ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 월간 리포트 카드 ━━━ */}
        <SectionHeader id="report" icon={Sparkles} title="월간 리포트 카드" />
        <div className="px-5 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {reportCard.map(r => (
              <button key={r.label} onClick={() => setSelectedReport(selectedReport === r.label ? null : r.label)} className={`text-center glass-inner rounded-xl p-3 transition-all active:scale-95 ${selectedReport === r.label ? 'ring-1' : ''}`} style={selectedReport === r.label ? { borderColor: r.color } : {}}>
                <div className="text-2xl font-extrabold mb-0.5" style={{ color: r.color }}>{r.grade}</div>
                <div className="text-[11px] text-c-text2 font-medium">{r.label}</div>
                <div className="text-[10px] text-c-text3">{Math.round(r.score)}점</div>
              </button>
            ))}
          </div>
          {selectedReport && (() => {
            const r = reportCard.find(r => r.label === selectedReport);
            return r ? (
              <div className="mt-3 glass-inner rounded-xl p-4 animate-fade">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-extrabold" style={{ color: r.color }}>{r.grade}</span>
                  <span className="text-sm font-bold text-c-text">{r.label}</span>
                </div>
                <div className="text-xs text-c-text2 mb-1">{r.detail}</div>
                <div className="text-xs font-medium" style={{ color: r.color }}>{r.advice}</div>
              </div>
            ) : null;
          })()}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 카테고리별 월간 트렌드 ━━━ */}
        {categoryTrend.cats.length > 0 && (<>
          <SectionHeader id="catTrend" icon={TrendingUp} title="카테고리별 추이 (6개월)" />
          <div className="px-5 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryTrend.data}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                  <YAxis width={50} tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                  {categoryTrend.cats.map((cat, i) => <Line key={cat} type="monotone" dataKey={cat} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {categoryTrend.cats.map((cat, i) => (
                <button key={cat} onClick={() => setSelectedCat(selectedCat === cat ? null : cat)} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all ${selectedCat === cat ? 'ring-1 ring-[#3182F6] bg-[#3182F6]/10' : 'text-c-text2 active:bg-c-subtle'}`}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />{cat}
                </button>
              ))}
            </div>
            {selectedCat && (
              <div className="mt-2 glass-inner rounded-xl p-3 animate-fade">
                <div className="text-xs font-bold text-c-text mb-1">{selectedCat} 이번달 지출</div>
                {renderTxList(monthTx.filter(t => t.category === selectedCat).sort((a, b) => b.amount - a.amount))}
              </div>
            )}
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 카테고리별 또래 비교 ━━━ */}
        {catPeerCompare.length > 0 && (<>
          <SectionHeader id="catPeer" icon={Users} title="카테고리별 또래 비교" />
          <div className="px-5 pb-4">
            <div className="space-y-2.5">
              {catPeerCompare.slice(0, 6).map(c => (
                <div key={c.cat}>
                  <button onClick={() => setSelectedPeer(selectedPeer === c.cat ? null : c.cat)} className="w-full text-left active:opacity-70 transition-opacity">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-12 text-c-text2 font-medium truncate">{c.cat}</span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <div className="flex-1 h-4 glass-inner rounded-full overflow-hidden relative">
                          <div className="h-full bg-[#3182F6] rounded-full" style={{ width: `${Math.min(c.mine / (Math.max(c.mine, c.peer) || 1) * 100, 100)}%` }} />
                        </div>
                        <div className="flex-1 h-4 glass-inner rounded-full overflow-hidden">
                          <div className="h-full bg-[#8B95A1] rounded-full" style={{ width: `${Math.min(c.peer / (Math.max(c.mine, c.peer) || 1) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold w-14 text-right ${c.diff > 0 ? 'text-[#FF4757]' : 'text-[#00C48C]'}`}>{H(c.diff > 0 ? `+${formatKRW(c.diff)}` : formatKRW(c.diff))}</span>
                    </div>
                  </button>
                  {selectedPeer === c.cat && (
                    <div className="mt-1 glass-inner rounded-xl p-3 animate-fade">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-c-text2">내 지출: <span className="font-bold text-[#3182F6]">{H(formatFullKRW(c.mine))}</span></span>
                        <span className="text-c-text2">또래 평균: <span className="font-bold text-[#8B95A1]">{H(formatFullKRW(c.peer))}</span></span>
                      </div>
                      {renderTxList(c.txList, 5)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2 text-[11px] text-c-text3"><span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#3182F6] rounded" />나</span><span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#8B95A1] rounded" />또래</span></div>
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 또래 비교 ━━━ */}
        <SectionHeader id="peer" icon={Users} title="또래 비교" badge={`상위 ${Math.round(peer.myRank / 6)}%`} badgeColor="#FF9F43" />
        <div className="px-5 pb-4">
          <div className="text-xs text-c-text2 mb-3">{profile.age}세 {profile.job || '직장인'} 600명 기준</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="glass-inner rounded-2xl p-3 text-center"><div className="text-xs text-c-text2">내 저축률</div><div className="text-xl font-bold">{H(`${savingRate.toFixed(1)}%`)}</div></div>
            <div className="glass-inner rounded-2xl p-3 text-center"><div className="text-xs text-c-text2">또래 평균</div><div className="text-xl font-bold">{H(`${peer.avgSR}%`)}</div></div>
            <div className="glass-inner rounded-2xl p-3 text-center"><div className="text-xs text-c-text2">순위</div><div className="text-xl font-bold">{H(`${peer.myRank}위`)}</div></div>
          </div>
          <div className="glass-inner rounded-2xl p-3 text-center text-sm"><span>이긴 사람: </span><span className="font-bold text-[#FF9F43]">{H(`${peer.betterThan}명`)}</span><span className="mx-2">|</span><span>위: </span><span className="font-bold">{H(`${600 - peer.betterThan}명`)}</span></div>
        </div>
        {expanded === 'peer' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">저축률 분포</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peer.dist}>
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                  <YAxis width={30} tick={{ fontSize: 9, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={v => `${v}명`} />} />
                  <Bar dataKey="count" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 또래 순위 변화 ━━━ */}
        <SectionHeader id="rankTrend" icon={TrendingDown} title="순위 변화 추이" />
        <div className="px-5 pb-4">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <YAxis width={40} reversed tick={{ fontSize: 10, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => `${v}위`} />} />
                <Line type="monotone" dataKey="rank" stroke="#FF9F43" strokeWidth={2.5} dot={{ r: 4, fill: '#FF9F43', stroke: 'var(--c-bg)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {expanded === 'rankTrend' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="space-y-1.5">
              {rankTrend.map((r, i) => (
                <div key={r.month} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-c-text2">{r.month}</span>
                  <span className="font-bold text-c-text">{r.rank}위</span>
                  <span className="text-c-text3">저축률 {H(`${r.savingRate}%`)}</span>
                  {i > 0 && <span className={rankTrend[i].rank < rankTrend[i - 1].rank ? 'text-[#00C48C]' : rankTrend[i].rank > rankTrend[i - 1].rank ? 'text-[#FF4757]' : 'text-c-text3'}>{rankTrend[i].rank < rankTrend[i - 1].rank ? '↑' : rankTrend[i].rank > rankTrend[i - 1].rank ? '↓' : '→'}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 월별 분석 ━━━ */}
        <SectionHeader id="monthly" icon={BarChart3} title="월별 분석 (6개월)" />
        <div className="px-5 pb-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <YAxis width={50} tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                <Bar dataKey="수입" fill="#00C48C" radius={[8, 8, 0, 0]} />
                <Bar dataKey="지출" fill="#FF4757" radius={[8, 8, 0, 0]} />
                <Bar dataKey="저축" fill="#7C5CFC" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-c-text2"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#00C48C] rounded-sm" /> 수입</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF4757] rounded-sm" /> 지출</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#7C5CFC] rounded-sm" /> 저축</span></div>
        </div>
        {expanded === 'monthly' && (
          <div className="px-5 pb-4 animate-fade">
            <div className="space-y-1.5">
              {monthlyTrend.map(m => (
                <div key={m.month} className="flex items-center gap-2 text-xs">
                  <span className="w-8 font-medium text-c-text">{m.month}</span>
                  <span className="text-[#00C48C]">{H(formatKRW(m.수입))}</span>
                  <span className="text-[#FF4757]">{H(formatKRW(m.지출))}</span>
                  <span className={`font-bold ${m.저축 >= 0 ? 'text-[#7C5CFC]' : 'text-[#FF4757]'}`}>{H(formatKRW(m.저축))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 순자산 추이 ━━━ */}
        <SectionHeader id="netWorth" icon={Wallet} title="순자산 추이" />
        <div className="px-5 pb-4">
          <div className="text-2xl font-bold text-[#3182F6] mb-4">{H(formatKRW(netWorth))}</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTrend}>
                <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} /><stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <YAxis width={50} tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => formatKRW(v)} />} />
                <Area type="monotone" dataKey="value" stroke="#7C5CFC" fill="url(#nwGrad)" strokeWidth={2.5} activeDot={{ r: 5, stroke: 'var(--c-bg)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 투자 수익률 추이 ━━━ */}
        <SectionHeader id="investReturn" icon={TrendingUp} title="투자 수익률 추이" badge={`${portfolioPnlPct >= 0 ? '+' : ''}${portfolioPnlPct.toFixed(1)}%`} badgeColor={portfolioPnlPct >= 0 ? '#00C48C' : '#FF4757'} />
        <div className="px-5 pb-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investReturnTrend}>
                <defs><linearGradient id="irGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C48C" stopOpacity={0.3} /><stop offset="95%" stopColor="#00C48C" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                <YAxis width={40} tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => `${v}%`} />} />
                <Area type="monotone" dataKey="수익률" stroke="#00C48C" fill="url(#irGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {expanded === 'investReturn' && portfolio.length > 0 && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">보유 종목</div>
            <div className="space-y-1.5">
              {portfolio.map(s => {
                const price = stockPrices[s.symbol]?.price || s.avgPrice;
                const pnl = ((price - s.avgPrice) / s.avgPrice * 100);
                return (
                  <div key={s.symbol} className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-c-text flex-1">{s.name || s.symbol}</span>
                    <span className="text-c-text2">{s.shares}주</span>
                    <span className={`font-bold ${pnl >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 배당 성장률 ━━━ */}
        {dividendTrend.length > 0 && (<>
          <SectionHeader id="dividend" icon={TrendingUp} title="배당 수익 추이" />
          <div className="px-5 pb-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dividendTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-text3)' }} axisLine={false} tickLine={false} />
                  <YAxis width={50} tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                  <Bar dataKey="amount" fill="#00C48C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 자산 배분 ━━━ */}
        {assetAlloc.summary.length > 0 && (<>
          <SectionHeader id="asset" icon={PieIcon} title="자산 배분 현황" />
          <div className="px-5 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={assetAlloc.summary} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3} strokeWidth={0}>{assetAlloc.summary.map((a, i) => <Cell key={i} fill={a.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {assetAlloc.summary.map(a => (
                  <button key={a.name} onClick={() => setSelectedAsset(selectedAsset === a.name ? null : a.name)} className="w-full flex items-center gap-2 active:opacity-70 transition-opacity">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-xs text-c-text font-medium flex-1 text-left">{a.name}</span>
                    <span className="text-xs text-c-text2 font-mono">{H(formatKRW(a.value))}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedAsset === '투자자산' && Object.keys(assetAlloc.stocks).length > 0 && (
              <div className="mt-3 glass-inner rounded-xl p-3 animate-fade">
                <div className="text-xs font-bold text-c-text mb-2">투자 종목별 비중</div>
                {Object.entries(assetAlloc.stocks).map(([sym, s]) => (
                  <div key={sym} className="flex items-center gap-2 py-1 text-xs">
                    <span className="font-medium text-c-text flex-1">{s.name}</span>
                    <span className="text-c-text2">{s.shares}주</span>
                    <span className="font-bold text-[#3182F6]">{H(formatKRW(s.value))}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedAsset === '고정비' && fixedExpenses.length > 0 && (
              <div className="mt-3 glass-inner rounded-xl p-3 animate-fade">
                <div className="text-xs font-bold text-c-text mb-2">고정지출 내역</div>
                {fixedExpenses.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs">
                    <span className="font-medium text-c-text flex-1">{f.name}</span>
                    <span className="font-bold text-[#FF9F43]">{H(formatFullKRW(f.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-c-border mx-5" />
        </>)}

        {/* ━━━ 고정지출 비율 ━━━ */}
        <SectionHeader id="fixed" icon={Zap} title="고정지출 비율" badge={`${fixedRatio.toFixed(0)}%`} badgeColor={fixedRatio > 40 ? '#FF4757' : fixedRatio > 25 ? '#FF9F43' : '#00C48C'} />
        <div className="px-5 pb-4">
          <div className="h-2 glass-inner rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full ${fixedRatio > 40 ? 'bg-[#FF4757]' : fixedRatio > 25 ? 'bg-[#FF9F43]' : 'bg-[#00C48C]'}`} style={{ width: `${Math.min(fixedRatio, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-c-text3">
            <span>고정비 {H(formatKRW(fixedTotal))}</span>
            <span>수입 {H(formatKRW(profile.salary))}</span>
          </div>
          {fixedRatio > 40 && <div className="mt-2 text-[11px] text-[#FF4757] bg-[#FF4757]/8 rounded-lg p-2">고정비가 수입의 40%를 초과합니다. 구조 개선이 필요해요.</div>}
        </div>
        {expanded === 'fixed' && fixedExpenses.length > 0 && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">고정지출 상세</div>
            <div className="space-y-1.5">
              {fixedExpenses.sort((a, b) => b.amount - a.amount).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 font-medium text-c-text">{f.name}</span>
                  <div className="w-24 h-1.5 glass-inner rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF9F43] rounded-full" style={{ width: `${(f.amount / fixedTotal * 100)}%` }} />
                  </div>
                  <span className="font-bold text-c-text w-16 text-right">{H(formatKRW(f.amount))}</span>
                  <span className="text-c-text3 w-10 text-right">{(f.amount / fixedTotal * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 불필요 지출 감지 ━━━ */}
        <SectionHeader id="waste" icon={AlertTriangle} title="반복 지출 감지" badge={wasteful.length > 0 ? `${wasteful.length}곳` : null} badgeColor="#FF9F43" />
        <div className="px-5 pb-4">
          {wasteful.length > 0 ? (
            <div className="space-y-2">
              {wasteful.map(w => (
                <div key={w.place}>
                  <button onClick={() => setSelectedWaste(selectedWaste === w.place ? null : w.place)} className="w-full flex items-center gap-2 py-2 border-b border-c-border last:border-0 active:opacity-70 transition-opacity">
                    <div className="flex-1 text-left"><div className="text-sm font-medium text-c-text">{w.place}</div><div className="text-[11px] text-c-text3">{w.count}회 · 평균 {H(formatFullKRW(w.avg))}</div></div>
                    <div className="text-sm font-bold text-[#FF9F43]">{H(formatFullKRW(w.total))}</div>
                  </button>
                  {selectedWaste === w.place && (
                    <div className="glass-inner rounded-xl p-3 animate-fade">
                      <div className="text-xs font-bold text-c-text mb-1">{w.place} 방문 기록</div>
                      {renderTxList(w.txs)}
                    </div>
                  )}
                </div>
              ))}
              <div className="text-[11px] text-[#FF9F43] bg-[#FF9F43]/8 rounded-lg p-2">월 3회 이상 방문하는 곳을 줄이면 절약 효과가 커요!</div>
            </div>
          ) : <div className="text-sm text-c-text3 text-center py-4">3회 이상 반복 지출이 없습니다</div>}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ FIRE 달성률 ━━━ */}
        <SectionHeader id="fire" icon={Target} title="FIRE (경제적 자유)" badge={`${fire.pct.toFixed(0)}%`} badgeColor="#3182F6" />
        <div className="px-5 pb-4">
          <div className="glass-inner rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2"><span className="text-c-text2">FIRE 목표액</span><span className="font-bold text-c-text">{H(formatKRW(fire.fireNum))}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-c-text2">현재 순자산</span><span className="font-bold text-[#3182F6]">{H(formatKRW(netWorth))}</span></div>
            <div className="h-2.5 glass-inner rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-[#3182F6] to-[#60A5FA] transition-all" style={{ width: `${Math.min(fire.pct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-c-text3"><span>{H(`${fire.pct.toFixed(1)}% 달성`)}</span><span>예상 {fire.years}년 후</span></div>
            <div className="mt-2 text-[11px] text-c-text2">* 연 평균 수익률 8.4%, 월 저축액 {H(formatKRW(savings))} 기준</div>
          </div>
        </div>
        {expanded === 'fire' && fire.milestones.length > 0 && (
          <div className="px-5 pb-4 animate-fade">
            <div className="text-xs font-bold text-c-text mb-2">FIRE 로드맵</div>
            <div className="space-y-1.5">
              {fire.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#3182F6]" />
                  <span className="text-c-text2 w-12">{m.year}년 후</span>
                  <div className="flex-1 h-1.5 glass-inner rounded-full overflow-hidden">
                    <div className="h-full bg-[#3182F6] rounded-full" style={{ width: `${Math.min(m.amount / fire.fireNum * 100, 100)}%` }} />
                  </div>
                  <span className="font-bold text-c-text w-16 text-right">{H(formatKRW(m.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* ━━━ 목표 진행도 ━━━ */}
        <SectionHeader id="goals" icon={Target} title="목표 진행도" />
        <div className="px-5 pb-4">
          <div className="mb-6">
            <div className="text-sm font-semibold text-c-text mb-2">배당 월 <EditableNumber value={goals.dividendGoal} onSave={(v) => setGoals({ ...goals, dividendGoal: Math.round(v) })} format={formatKRW} /></div>
            <div className="flex items-end gap-3 mb-2"><div className="text-2xl font-bold text-green-600">{H(formatKRW(totalMonthlyDiv))}</div><div className="text-sm text-c-text2 mb-1">/ {H(formatKRW(goals.dividendGoal))}</div></div>
            <div className="relative h-2 glass-inner rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${Math.min((totalMonthlyDiv / goals.dividendGoal) * 100, 100)}%` }} /></div>
            <div className="flex justify-between text-xs text-c-text2 mt-1.5"><span>{H(`${((totalMonthlyDiv / goals.dividendGoal) * 100).toFixed(1)}% 달성`)}</span><span>예상: {divGoalYears}년 후</span></div>
          </div>
          <div>
            <div className="text-sm font-semibold text-c-text mb-2">순자산 <EditableNumber value={goals.netWorthGoal} onSave={(v) => setGoals({ ...goals, netWorthGoal: Math.round(v) })} format={formatKRW} /></div>
            <div className="flex items-end gap-3 mb-2"><div className="text-2xl font-bold text-[#3182F6]">{H(formatKRW(netWorth))}</div><div className="text-sm text-c-text2 mb-1">/ {H(formatKRW(goals.netWorthGoal))}</div></div>
            <div className="relative h-2 glass-inner rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${Math.min((netWorth / goals.netWorthGoal) * 100, 100)}%` }} /></div>
            <div className="flex justify-between text-xs text-c-text2 mt-1.5"><span>{H(`${((netWorth / goals.netWorthGoal) * 100).toFixed(1)}% 달성`)}</span><span>예상: {nwGoalMonths}개월 후</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StatsTab;
