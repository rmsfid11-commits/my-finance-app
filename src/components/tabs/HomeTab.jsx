import { useMemo } from 'react';
import { formatFullKRW, formatKRW, formatPercent, formatUSD } from '../../utils/formatters';
import { CATEGORY_COLORS, ECONOMIC_CALENDAR } from '../../data/initialData';
import EditableNumber from '../EditableNumber';

const importanceDotColor = (level) => {
  if (level >= 4) return 'bg-[#FF4757]';
  if (level >= 3) return 'bg-[#FF9F43]';
  if (level >= 2) return 'bg-[#FFD93D]';
  return 'bg-[#30363D]';
};

function HomeTab({ profile, setProfile, goals, setGoals, budget, portfolio, stockPrices, exchangeRate, transactions, dividends, fixedExpenses }) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);
  const todayTx = useMemo(() => transactions.filter(t => t.date === today), [transactions, today]);
  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth)), [transactions, currentMonth]);
  const todaySpending = todayTx.reduce((s, t) => s + t.amount, 0);
  const monthSpending = monthTx.reduce((s, t) => s + t.amount, 0);
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalExpense = monthSpending + fixedTotal;
  const savings = profile.salary - totalExpense;
  const savingRate = ((savings / profile.salary) * 100).toFixed(1);
  const totalBudget = Object.values(budget).reduce((s, v) => s + v, 0);
  const rate = exchangeRate || 1450;

  const categoryBreakdown = useMemo(() => {
    const b = {};
    monthTx.forEach(t => { b[t.category] = (b[t.category] || 0) + t.amount; });
    return b;
  }, [monthTx]);

  const portfolioSummary = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    const items = portfolio.map(stock => {
      const price = stockPrices[stock.symbol]?.price || stock.avgPrice;
      const value = stock.shares * price * rate;
      const cost = stock.shares * stock.avgPrice * rate;
      totalValue += value; totalCost += cost;
      return { ...stock, currentPrice: price, value, cost, pnl: value - cost, pnlPercent: ((value - cost) / cost * 100) };
    });
    return { items, totalValue, totalCost, totalPnl: totalValue - totalCost };
  }, [portfolio, stockPrices, rate]);

  const totalMonthlyDividend = useMemo(() => {
    const r = dividends.slice(-3);
    return r.length > 0 ? r.reduce((s, d) => s + d.amount, 0) / r.length : 0;
  }, [dividends]);

  const netWorth = portfolioSummary.totalValue + savings * 6;
  const todayEvents = ECONOMIC_CALENDAR.filter(e => e.date === today);
  const upcomingEvents = ECONOMIC_CALENDAR.filter(e => e.date > today).slice(0, 3);

  return (
    <div className="space-y-5 animate-slide">
      {/* 오늘 요약 */}
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h2 className="text-base font-bold text-c-text mb-4 tracking-tight">오늘 요약</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-c-bg border border-c-border rounded-lg p-5">
            <div className="text-xs font-medium text-c-text2 mb-2">오늘 지출</div>
            <div className="text-xl font-bold text-[#FF4757] truncate">{formatFullKRW(todaySpending)}</div>
            <div className="text-xs text-[#484F58] mt-2">예산 대비 {((todaySpending / (totalBudget / 30)) * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-c-bg border border-c-border rounded-lg p-5">
            <div className="text-xs font-medium text-c-text2 mb-2">투자 손익</div>
            <div className={`text-xl font-bold truncate ${portfolioSummary.totalPnl >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{portfolioSummary.totalPnl >= 0 ? '+' : ''}{formatKRW(portfolioSummary.totalPnl)}</div>
            <div className={`text-xs mt-2 ${portfolioSummary.totalPnl >= 0 ? 'text-[#00C48C]/60' : 'text-[#FF4757]/60'}`}>{portfolioSummary.totalCost > 0 ? formatPercent(portfolioSummary.totalPnl / portfolioSummary.totalCost * 100) : '0%'}</div>
          </div>
        </div>
      </div>

      {/* 포트폴리오 */}
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h2 className="text-base font-bold text-c-text mb-4 tracking-tight">포트폴리오</h2>
        {portfolioSummary.items.map(stock => (
          <div key={stock.symbol} className="flex items-center justify-between py-2.5 border-b border-c-border last:border-0">
            <div className="min-w-0">
              <div className="font-semibold text-sm text-c-text">{stock.symbol}</div>
              <div className="text-[11px] text-c-text2">{formatUSD(stock.currentPrice)} x {stock.shares.toLocaleString()}</div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="font-bold text-sm text-c-text">{formatKRW(stock.value)}</div>
              <div className={`text-[11px] font-medium ${stock.pnl >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
                {stock.pnl >= 0 ? '+' : ''}{formatKRW(stock.pnl)} ({formatPercent(stock.pnlPercent)})
              </div>
            </div>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-c-border flex justify-between items-center">
          <div className="text-sm font-bold text-c-text2">총 평가액</div>
          <div className="font-bold text-[#3182F6] text-lg">{formatKRW(portfolioSummary.totalValue)}</div>
        </div>
      </div>

      {/* 이번달 요약 */}
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h2 className="text-base font-bold text-c-text mb-4 tracking-tight">이번달 요약</h2>
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="text-center bg-c-bg border border-c-border rounded-lg py-4 px-2">
            <div className="text-xs font-medium text-c-text2 mb-2">수입</div>
            <div className="text-base font-bold text-[#00C48C]">
              <EditableNumber value={profile.salary} onSave={(v) => setProfile({...profile, salary: Math.round(v)})} format={formatKRW} />
            </div>
          </div>
          <div className="text-center bg-c-bg border border-c-border rounded-lg py-4 px-2">
            <div className="text-xs font-medium text-c-text2 mb-2">지출</div>
            <div className="text-base font-bold text-[#FF4757]">{formatKRW(totalExpense)}</div>
          </div>
          <div className="text-center bg-c-bg border border-c-border rounded-lg py-4 px-2">
            <div className="text-xs font-medium text-c-text2 mb-2">저축</div>
            <div className="text-base font-bold text-[#7C5CFC]">{formatKRW(savings)}</div>
          </div>
        </div>
        <div className="bg-c-bg rounded-lg p-4 mb-4 border border-c-border">
          <div className="flex justify-between text-xs mb-2.5"><span className="font-medium text-c-text2">저축률</span><span className="font-bold text-[#7C5CFC]">{savingRate}%</span></div>
          <div className="h-2 bg-c-border rounded-full overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${Math.min(Math.max(parseFloat(savingRate), 0), 100)}%`, background: 'linear-gradient(90deg, #7C5CFC, #A78BFA)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
        </div>
        <div className="space-y-3.5">
          {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
            const pct = Math.min((amount / (budget[cat] || amount)) * 100, 100);
            const isOver = budget[cat] && amount > budget[cat];
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs w-14 text-c-text2 font-medium truncate">{cat}</span>
                <div className="flex-1 h-2 bg-c-border rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${pct}%`, backgroundColor: isOver ? '#FF4757' : (CATEGORY_COLORS[cat] || '#6B7280') }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </div>
                </div>
                <span className="text-xs font-semibold w-16 text-right text-c-text2">{formatKRW(amount)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 목표 진행도 */}
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h2 className="text-base font-bold text-c-text mb-4 tracking-tight">목표 진행도</h2>
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2 min-w-0">
            <span className="text-c-text2 truncate mr-2">배당 월 <EditableNumber value={goals.dividendGoal} onSave={(v) => setGoals({...goals, dividendGoal: Math.round(v)})} format={formatKRW} /></span>
            <span className="font-bold text-c-text shrink-0">{formatKRW(totalMonthlyDividend)}</span>
          </div>
          <div className="h-2 bg-c-border rounded-full overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${Math.min((totalMonthlyDividend / goals.dividendGoal) * 100, 100)}%`, background: 'linear-gradient(90deg, #00C48C, #34D399)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>
          <div className="text-xs text-c-text2 mt-2">{((totalMonthlyDividend / goals.dividendGoal) * 100).toFixed(1)}% 달성</div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2 min-w-0">
            <span className="text-c-text2 truncate mr-2">순자산 <EditableNumber value={goals.netWorthGoal} onSave={(v) => setGoals({...goals, netWorthGoal: Math.round(v)})} format={formatKRW} /></span>
            <span className="font-bold text-c-text shrink-0">{formatKRW(netWorth)}</span>
          </div>
          <div className="h-2 bg-c-border rounded-full overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${Math.min((netWorth / goals.netWorthGoal) * 100, 100)}%`, background: 'linear-gradient(90deg, #3182F6, #60A5FA)' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>
          <div className="text-xs text-c-text2 mt-2">{((netWorth / goals.netWorthGoal) * 100).toFixed(1)}% 달성</div>
        </div>
      </div>

      {/* 경제 일정 */}
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h2 className="text-base font-bold text-c-text mb-4 tracking-tight">경제 일정</h2>
        {todayEvents.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] font-bold text-[#FF4757] mb-2 tracking-wide">TODAY</div>
            {todayEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-c-border">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${importanceDotColor(e.importance)}`} />
                <span className="text-[11px] text-c-text2 w-11 shrink-0">{e.time}</span>
                <span className="text-sm flex-1 text-c-text font-medium truncate">{e.name}</span>
              </div>
            ))}
          </div>
        )}
        {upcomingEvents.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-c-text2 mb-2 tracking-wide">UPCOMING</div>
            {upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-c-border last:border-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${importanceDotColor(e.importance)}`} />
                <span className="text-[11px] text-[#484F58] w-16 shrink-0">{e.date.substring(5)} {e.time}</span>
                <span className="text-sm flex-1 text-c-text2 truncate">{e.name}</span>
              </div>
            ))}
          </div>
        )}
        {todayEvents.length === 0 && upcomingEvents.length === 0 && <div className="text-sm text-[#484F58] text-center py-6">예정된 일정이 없습니다</div>}
      </div>
    </div>
  );
}

export default HomeTab;
