import { useMemo } from 'react';
import { formatKRW, formatFullKRW, formatPercent } from '../../utils/formatters';
import { PEER_DATA } from '../../data/initialData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';

function StatsTab({ profile, goals, setGoals, budget, transactions, portfolio, stockPrices, exchangeRate, dividends, fixedExpenses }) {
  const rate = exchangeRate || 1450;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthSpending = monthTx.reduce((s, t) => s + t.amount, 0);
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalExpense = monthSpending + fixedTotal;
  const savings = profile.salary - totalExpense;
  const savingRate = savings / profile.salary * 100;

  const peer = useMemo(() => {
    const sr = savingRate;
    const bt = PEER_DATA.filter(p => p.savingRate < sr).length;
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
    return { myRank: 600 - bt, betterThan: bt, avgSR: avgSR.toFixed(1), dist };
  }, [savingRate]);

  const monthlyTrend = useMemo(() => {
    const m = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const tx = transactions.filter(t => t.date.startsWith(month));
      const spending = tx.reduce((s, t) => s + t.amount, 0) + fixedTotal;
      const actual = spending || Math.round(profile.salary * (0.5 + Math.random() * 0.2));
      m.push({ month: `${d.getMonth() + 1}월`, 수입: profile.salary, 지출: actual, 저축: profile.salary - actual });
    }
    return m;
  }, [transactions, profile, fixedTotal]);

  const portfolioValue = portfolio.reduce((s, stock) => s + stock.shares * (stockPrices[stock.symbol]?.price || stock.avgPrice) * rate, 0);
  const netWorth = portfolioValue + savings * 6;

  const netWorthTrend = useMemo(() => {
    const d = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - i);
      d.push({ month: `${dt.getMonth() + 1}월`, value: Math.round(portfolioValue * (1 - i * 0.05) + savings * (6 - i)) });
    }
    return d;
  }, [portfolioValue, savings]);

  const totalMonthlyDiv = useMemo(() => { const r = dividends.slice(-3); return r.length > 0 ? r.reduce((s, d) => s + d.amount, 0) / r.length : 0; }, [dividends]);

  const divGoalYears = totalMonthlyDiv >= goals.dividendGoal ? 0 : ((goals.dividendGoal - totalMonthlyDiv) / (totalMonthlyDiv || 10000) * 2).toFixed(1);
  const nwGoalMonths = useMemo(() => { if (netWorth >= goals.netWorthGoal) return 0; const g = savings + portfolioValue * 0.008; return g <= 0 ? 999 : Math.ceil((goals.netWorthGoal - netWorth) / g); }, [netWorth, goals.netWorthGoal, savings, portfolioValue]);

  return (
    <div className="space-y-4 animate-slide">
      <div className="bg-c-card border border-c-border rounded-lg p-5 text-c-text">
        <h2 className="font-bold text-base mb-3">또래 비교</h2>
        <div className="text-xs text-c-text2 mb-3">{profile.age}세 {profile.job || '직장인'} 600명 기준</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-c-bg border border-c-border rounded-lg p-3 text-center"><div className="text-xs text-c-text2">내 저축률</div><div className="text-xl font-bold">{savingRate.toFixed(1)}%</div></div>
          <div className="bg-c-bg border border-c-border rounded-lg p-3 text-center"><div className="text-xs text-c-text2">또래 평균</div><div className="text-xl font-bold">{peer.avgSR}%</div></div>
          <div className="bg-c-bg border border-c-border rounded-lg p-3 text-center"><div className="text-xs text-c-text2">순위</div><div className="text-xl font-bold">{peer.myRank}위</div></div>
        </div>
        <div className="bg-c-bg border border-c-border rounded-lg p-3 text-center"><span>당신이 이긴 사람: </span><span className="font-bold text-[#FF9F43]">{peer.betterThan}명</span><span className="mx-2">|</span><span>당신보다 위: </span><span className="font-bold">{600 - peer.betterThan}명</span></div>
      </div>

      <div className="bg-c-card border border-c-border rounded-lg p-5">
        <h3 className="font-bold text-sm text-c-text mb-4">저축률 분포</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peer.dist}>
              <XAxis dataKey="range" tick={{fontSize: 10, fill: '#8B949E'}} axisLine={false} tickLine={false} />
              <YAxis width={35} tick={{fontSize: 10, fill: '#8B949E'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={v => `${v}명`} />} />
              <Bar dataKey="count" fill="#93C5FD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-c-card border border-c-border rounded-lg p-5">
        <h3 className="font-bold text-sm text-c-text mb-4">월별 분석 (6개월)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#8B949E'}} axisLine={false} tickLine={false} />
              <YAxis width={50} tick={{fontSize: 10, fill: '#8B949E'}} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
              <Bar dataKey="수입" fill="#00C48C" radius={[8, 8, 0, 0]} />
              <Bar dataKey="지출" fill="#FF4757" radius={[8, 8, 0, 0]} />
              <Bar dataKey="저축" fill="#7C5CFC" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-c-text2"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#00C48C] rounded-sm" /> 수입</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF4757] rounded-sm" /> 지출</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#7C5CFC] rounded-sm" /> 저축</span></div>
      </div>

      <div className="bg-c-card border border-c-border rounded-lg p-5">
        <h3 className="font-bold text-sm text-c-text mb-3">순자산 추이</h3>
        <div className="text-2xl font-bold text-[#3182F6] mb-4">{formatKRW(netWorth)}</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthTrend}>
              <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3}/><stop offset="95%" stopColor="#7C5CFC" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#8B949E'}} axisLine={false} tickLine={false} />
              <YAxis width={50} tick={{fontSize: 10, fill: '#8B949E'}} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={v => formatKRW(v)} />} />
              <Area type="monotone" dataKey="value" stroke="#7C5CFC" fill="url(#nwGrad)" strokeWidth={2.5} activeDot={{ r: 5, stroke: '#161B22', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-c-card border border-c-border rounded-lg p-5">
        <h3 className="font-bold text-sm text-c-text mb-5">목표 진행도</h3>
        <div className="mb-6">
          <div className="text-sm font-semibold text-c-text mb-2">배당 월 <EditableNumber value={goals.dividendGoal} onSave={(v) => setGoals({...goals, dividendGoal: Math.round(v)})} format={formatKRW} /></div>
          <div className="flex items-end gap-3 mb-2"><div className="text-2xl font-bold text-green-600">{formatKRW(totalMonthlyDiv)}</div><div className="text-sm text-c-text2 mb-1">/ {formatKRW(goals.dividendGoal)}</div></div>
          <div className="relative h-2 bg-c-subtle rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{width:`${Math.min((totalMonthlyDiv/goals.dividendGoal)*100,100)}%`}}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" /></div></div>
          <div className="flex justify-between text-xs text-c-text2 mt-1.5"><span>{((totalMonthlyDiv/goals.dividendGoal)*100).toFixed(1)}% 달성</span><span>예상: {divGoalYears}년 후</span></div>
        </div>
        <div>
          <div className="text-sm font-semibold text-c-text mb-2">순자산 <EditableNumber value={goals.netWorthGoal} onSave={(v) => setGoals({...goals, netWorthGoal: Math.round(v)})} format={formatKRW} /></div>
          <div className="flex items-end gap-3 mb-2"><div className="text-2xl font-bold text-[#3182F6]">{formatKRW(netWorth)}</div><div className="text-sm text-c-text2 mb-1">/ {formatKRW(goals.netWorthGoal)}</div></div>
          <div className="relative h-2 bg-c-subtle rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{width:`${Math.min((netWorth/goals.netWorthGoal)*100,100)}%`}}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" /></div></div>
          <div className="flex justify-between text-xs text-c-text2 mt-1.5"><span>{((netWorth/goals.netWorthGoal)*100).toFixed(1)}% 달성</span><span>예상: {nwGoalMonths}개월 후</span></div>
        </div>
      </div>
    </div>
  );
}

export default StatsTab;
