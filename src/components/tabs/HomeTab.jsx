import { useMemo } from 'react';
import { formatFullKRW, formatKRW, formatPercent, formatUSD } from '../../utils/formatters';
import { CATEGORY_COLORS, ECONOMIC_CALENDAR } from '../../data/initialData';
import EditableNumber from '../EditableNumber';
import CountUp from '../CountUp';
import { Eye, EyeOff } from 'lucide-react';

const importanceDotColor = (level) => {
  if (level >= 4) return 'bg-[#FF4757]';
  if (level >= 3) return 'bg-[#FF9F43]';
  if (level >= 2) return 'bg-[#FFD93D]';
  return 'bg-[#30363D]';
};

const LOGO_COLORS = ['#3182F6','#00C48C','#FF9F43','#7C5CFC','#FF4757','#0ABDE3','#FF6B81','#2ED573'];
const getLogoColor = (symbol) => LOGO_COLORS[symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

const POSITIVE_MESSAGES = ['좋은 흐름이에요!', '수익이 나고 있어요!', '잘 하고 있어요!', '투자의 힘!'];
const getMessage = () => POSITIVE_MESSAGES[new Date().getDate() % POSITIVE_MESSAGES.length];

function HomeTab({ profile, setProfile, goals, setGoals, budget, portfolio, stockPrices, exchangeRate, transactions, dividends, fixedExpenses, hideAmounts, setHideAmounts }) {
  const mask = (text) => hideAmounts ? '•••••' : text;
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
      return { ...stock, currentPrice: price, value, cost, pnl: value - cost, pnlPercent: cost > 0 ? ((value - cost) / cost * 100) : 0 };
    });
    return { items, totalValue, totalCost, totalPnl: totalValue - totalCost, totalPnlPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0 };
  }, [portfolio, stockPrices, rate]);

  const totalMonthlyDividend = useMemo(() => {
    const r = dividends.slice(-3);
    return r.length > 0 ? r.reduce((s, d) => s + d.amount, 0) / r.length : 0;
  }, [dividends]);

  const netWorth = portfolioSummary.totalValue;
  const todayEvents = ECONOMIC_CALENDAR.filter(e => e.date === today);
  const upcomingEvents = ECONOMIC_CALENDAR.filter(e => e.date > today).slice(0, 3);
  const isProfit = portfolioSummary.totalPnl > 0;

  return (
    <div className="flex-1 flex flex-col animate-slide">
      <div className="glass flex-1 flex flex-col">

        {/* 총 자산 */}
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
              {isProfit && <span className="text-xs text-c-text3 ml-auto">{getMessage()}</span>}
            </div>
          )}
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 핵심 지표 2x2 */}
        <div className="grid grid-cols-2">
          <div className="px-5 py-4 border-r border-c-border">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
              <span className="text-[11px] text-c-text2">오늘 지출</span>
            </div>
            <div className="text-xl font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={todaySpending} format={formatFullKRW} />}</div>
            <div className="text-[11px] text-c-text3">{hideAmounts ? '•••' : `일 예산 대비 ${((todaySpending / (totalBudget / 30)) * 100).toFixed(0)}%`}</div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF9F43]" />
              <span className="text-[11px] text-c-text2">이번달 지출</span>
            </div>
            <div className="text-xl font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={totalExpense} format={formatFullKRW} />}</div>
            <div className="text-[11px] text-c-text3">{hideAmounts ? '•••' : `고정 ${formatKRW(fixedTotal)} 포함`}</div>
          </div>

          <div className="border-t border-c-border col-span-2 mx-5" />

          <div className="px-5 py-4 border-r border-c-border">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
              <span className="text-[11px] text-c-text2">수입</span>
            </div>
            <div className="text-xl font-extrabold text-c-text">
              {hideAmounts ? '•••••' : <EditableNumber value={profile.salary} onSave={(v) => setProfile({...profile, salary: Math.round(v)})} format={formatFullKRW} />}
            </div>
            <div className="text-[11px] text-c-text3">월급</div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC]" />
              <span className="text-[11px] text-c-text2">저축</span>
            </div>
            <div className="text-xl font-extrabold text-c-text">{hideAmounts ? '•••••' : <CountUp value={savings} format={formatFullKRW} />}</div>
            <div className="text-[11px] text-c-text3">{hideAmounts ? '•••' : `저축률 ${savingRate}%`}</div>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 저축률 바 */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-c-text2">저축률</span>
            <span className="text-sm font-bold text-[#7C5CFC]">{hideAmounts ? '•••' : `${savingRate}%`}</span>
          </div>
          <div className="h-2 glass-inner rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(Math.max(parseFloat(savingRate), 0), 100)}%`, background: 'linear-gradient(90deg, #7C5CFC, #A78BFA)' }} />
          </div>
        </div>

        {/* 포트폴리오 */}
        {portfolio.length > 0 && (
          <>
            <div className="border-t border-c-border mx-5" />
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
                    <div className="font-extrabold text-sm text-c-text">{hideAmounts ? '•••••' : formatKRW(stock.value)}</div>
                    <div className={`text-[11px] font-semibold ${stock.pnl >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
                      {hideAmounts ? '•••' : `${stock.pnl >= 0 ? '+' : ''}${formatKRW(stock.pnl)} (${formatPercent(stock.pnlPercent)})`}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-2">
                <div className="text-xs text-c-text2 mb-0.5">총 평가액</div>
                <div className="font-extrabold text-[#3182F6] text-xl">{hideAmounts ? '•••••' : <CountUp value={portfolioSummary.totalValue} format={formatFullKRW} />}</div>
              </div>
            </div>
          </>
        )}

        {/* 카테고리별 지출 */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <>
            <div className="border-t border-c-border mx-5" />
            <div className="px-5 py-4">
              <h2 className="text-sm font-bold text-c-text mb-3">카테고리별 지출</h2>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const pct = Math.min((amount / (budget[cat] || amount)) * 100, 100);
                  const isOver = budget[cat] && amount > budget[cat];
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6B7280' }} />
                        <span className="text-sm font-medium text-c-text">{cat}</span>
                        <span className={`text-sm font-bold ml-auto ${isOver ? 'text-[#FF4757]' : 'text-c-text'}`}>{hideAmounts ? '•••••' : formatFullKRW(amount)}</span>
                      </div>
                      <div className="h-1.5 glass-inner rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: isOver ? '#FF4757' : (CATEGORY_COLORS[cat] || '#6B7280') }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* 목표 진행도 */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-c-text mb-3">목표 진행도</h2>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-c-text2 mb-0.5">배당 월 <EditableNumber value={goals.dividendGoal} onSave={(v) => setGoals({...goals, dividendGoal: Math.round(v)})} format={formatKRW} /></div>
              <div className="text-lg font-extrabold text-[#00C48C] mb-1.5">{hideAmounts ? '•••••' : formatFullKRW(totalMonthlyDividend)}</div>
              <div className="h-2 glass-inner rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((totalMonthlyDividend / goals.dividendGoal) * 100, 100)}%`, background: 'linear-gradient(90deg, #00C48C, #34D399)' }} />
              </div>
              <div className="text-[11px] text-c-text3 mt-1">{((totalMonthlyDividend / goals.dividendGoal) * 100).toFixed(1)}% 달성</div>
            </div>
            <div>
              <div className="text-xs text-c-text2 mb-0.5">순자산 <EditableNumber value={goals.netWorthGoal} onSave={(v) => setGoals({...goals, netWorthGoal: Math.round(v)})} format={formatKRW} /></div>
              <div className="text-lg font-extrabold text-[#3182F6] mb-1.5">{hideAmounts ? '•••••' : formatFullKRW(netWorth)}</div>
              <div className="h-2 glass-inner rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((netWorth / goals.netWorthGoal) * 100, 100)}%`, background: 'linear-gradient(90deg, #3182F6, #60A5FA)' }} />
              </div>
              <div className="text-[11px] text-c-text3 mt-1">{((netWorth / goals.netWorthGoal) * 100).toFixed(1)}% 달성</div>
            </div>
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 경제 일정 */}
        <div className="px-5 pt-4 pb-5 flex-1">
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
          {todayEvents.length === 0 && upcomingEvents.length === 0 && <div className="text-sm text-c-text3 text-center py-6">예정된 일정이 없습니다</div>}
        </div>

      </div>
    </div>
  );
}

export default HomeTab;
