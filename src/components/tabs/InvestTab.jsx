import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { formatFullKRW, formatKRW, formatUSD, formatPercent, formatNumber, formatComma } from '../../utils/formatters';
import { fetchChartData, fetchCryptoPrice, fetchUpbitPrice, searchStock } from '../../utils/api';
import { ECONOMIC_CALENDAR } from '../../data/initialData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Bitcoin, Calculator, Calendar, Plus, Minus, RefreshCw, Search, X, ChevronDown, ChevronUp, Wrench, Trash2, Eye, Target } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';
import { useSwipe } from '../../hooks/useSwipe';

const SUB_TABS = [
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'exchange', label: '환율' },
  { id: 'crypto', label: '코인/김프' },
  { id: 'calc', label: '계산기' },
  { id: 'watchlist', label: '관심종목' },
  { id: 'calendar', label: '경제일정' },
];

const TIMEFRAMES = [
  { id: '4h', label: '4시간', interval: '1h', range: '10d' },
  { id: '1d', label: '일봉', interval: '1d', range: '6mo' },
  { id: '1w', label: '주봉', interval: '1wk', range: '2y' },
  { id: '1m', label: '월봉', interval: '1mo', range: '5y' },
];

const LOGO_COLORS = ['#3182F6','#00C48C','#FF9F43','#7C5CFC','#FF4757','#0ABDE3','#FF6B81','#2ED573'];
const getLogoColor = (sym) => LOGO_COLORS[sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];
const PIE_COLORS = ['#818CF8','#34D399','#F472B6','#22D3EE','#FBBF24','#C084FC','#60A5FA','#2DD4BF'];

function CrosshairChart({ data }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [crosshair, setCrosshair] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [data]);

  if (!data?.length) return <div className="h-64 flex items-center justify-center text-c-text2 text-sm">차트 데이터 없음</div>;

  const h = 280, padT = 24, padB = 28, padR = 58;
  const chartW = width - padR;
  const cH = h - padT - padB;
  const allP = data.flatMap(d => [d.high, d.low]).filter(Boolean);
  const minP = Math.min(...allP), maxP = Math.max(...allP), rng = maxP - minP || 1;
  const yPos = (p) => padT + cH * (1 - (p - minP) / rng);
  const priceAtY = (y) => maxP - ((y - padT) / cH) * rng;
  const step = chartW / data.length;
  const bw = Math.max(1.5, Math.min(8, step * 0.65));

  const handleInteraction = (clientX, clientY) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const idx = Math.min(data.length - 1, Math.max(0, Math.floor(x / step)));
    const candle = data[idx];
    const price = priceAtY(Math.max(padT, Math.min(padT + cH, y)));
    const candleX = step * idx + step / 2;
    setCrosshair({ x: candleX, y: Math.max(padT, Math.min(padT + cH, y)), candle, price });
  };

  return (
    <div ref={ref} className="relative touch-none select-none"
      onTouchStart={e => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => { e.preventDefault(); handleInteraction(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={() => setCrosshair(null)}
      onMouseMove={e => handleInteraction(e.clientX, e.clientY)}
      onMouseLeave={() => setCrosshair(null)}>

      {crosshair?.candle && (
        <div className="absolute top-0 left-0 right-0 flex flex-wrap gap-x-2.5 text-[10px] font-mono z-10 px-0.5 pointer-events-none">
          <span className="text-c-text2">{crosshair.candle.date}</span>
          <span>O <span className="text-c-text font-semibold">{crosshair.candle.open?.toFixed(2)}</span></span>
          <span>H <span className="text-[#00C48C] font-semibold">{crosshair.candle.high?.toFixed(2)}</span></span>
          <span>L <span className="text-[#FF4757] font-semibold">{crosshair.candle.low?.toFixed(2)}</span></span>
          <span>C <span className={`font-semibold ${crosshair.candle.close >= crosshair.candle.open ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{crosshair.candle.close?.toFixed(2)}</span></span>
        </div>
      )}

      {width > 0 && (
        <svg width={width} height={h} className="overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const yy = padT + cH * pct;
            const price = maxP - rng * pct;
            return (
              <g key={pct}>
                <line x1={0} y1={yy} x2={chartW} y2={yy} stroke="var(--c-border)" strokeWidth={0.5} opacity={0.4} />
                <text x={width - 3} y={yy + 3} textAnchor="end" fill="var(--c-text3)" fontSize={9}>{price.toFixed(2)}</text>
              </g>
            );
          })}

          {data.filter((_, i) => i % Math.max(1, Math.ceil(data.length / 6)) === 0).map((d) => {
            const idx = data.indexOf(d);
            return <text key={idx} x={step * idx + step / 2} y={h - 4} textAnchor="middle" fill="var(--c-text3)" fontSize={9}>{d.date}</text>;
          })}

          {data.map((d, i) => {
            if (!d.open || !d.close || !d.high || !d.low) return null;
            const cx = step * i + step / 2;
            const isUp = d.close >= d.open;
            const color = isUp ? '#00C48C' : '#FF4757';
            const bTop = yPos(Math.max(d.open, d.close));
            const bBot = yPos(Math.min(d.open, d.close));
            return (
              <g key={i}>
                <line x1={cx} y1={yPos(d.high)} x2={cx} y2={yPos(d.low)} stroke={color} strokeWidth={1} />
                <rect x={cx - bw / 2} y={bTop} width={bw} height={Math.max(1, bBot - bTop)} fill={color} rx={0.5} />
              </g>
            );
          })}

          {crosshair && (
            <>
              <line x1={crosshair.x} y1={padT} x2={crosshair.x} y2={padT + cH} stroke="var(--c-text2)" strokeWidth={0.5} strokeDasharray="4,3" opacity={0.7} />
              <line x1={0} y1={crosshair.y} x2={chartW} y2={crosshair.y} stroke="var(--c-text2)" strokeWidth={0.5} strokeDasharray="4,3" opacity={0.7} />
              <rect x={chartW + 1} y={crosshair.y - 10} width={padR - 3} height={20} fill="var(--c-text2)" rx={4} />
              <text x={chartW + padR / 2} y={crosshair.y + 4} textAnchor="middle" fill="var(--c-bg)" fontSize={9} fontWeight="700">{crosshair.price.toFixed(2)}</text>
              {crosshair.candle && (
                <>
                  <rect x={crosshair.x - 28} y={padT + cH + 3} width={56} height={17} fill="var(--c-text2)" rx={4} />
                  <text x={crosshair.x} y={padT + cH + 14} textAnchor="middle" fill="var(--c-bg)" fontSize={8} fontWeight="700">{crosshair.candle.date}</text>
                </>
              )}
              {crosshair.candle && (
                <circle cx={crosshair.x} cy={yPos(crosshair.candle.close)} r={3.5}
                  fill={crosshair.candle.close >= crosshair.candle.open ? '#00C48C' : '#FF4757'}
                  stroke="var(--c-bg)" strokeWidth={2} />
              )}
            </>
          )}
        </svg>
      )}
    </div>
  );
}

function IndependentStockChart({ symbol }) {
  const [timeframe, setTimeframe] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setChartData([]);
    const tf = TIMEFRAMES.find(t => t.id === timeframe) || TIMEFRAMES[1];
    fetchChartData(symbol, tf.range, tf.interval)
      .then(d => { if (d.length > 0) setChartData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, timeframe]);

  return (
    <>
      <div className="flex gap-1 mb-3">
        {TIMEFRAMES.map(tf => (
          <button key={tf.id} onClick={() => setTimeframe(tf.id)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              timeframe === tf.id ? 'bg-[#3182F6] text-white' : 'glass-inner text-c-text2'
            }`}>
            {tf.label}
          </button>
        ))}
      </div>
      {loading && <div className="h-[280px] flex items-center justify-center text-c-text2 text-sm"><RefreshCw size={14} className="animate-spin mr-2" /> 차트 로딩중...</div>}
      {!loading && chartData.length > 0 && <CrosshairChart data={chartData} />}
      {!loading && chartData.length === 0 && <div className="h-[280px] flex items-center justify-center text-c-text2 text-sm">차트 데이터를 불러올 수 없습니다</div>}
    </>
  );
}

function InvestTab({ portfolio, setPortfolio, stockPrices, exchangeRate, dividends, goals, watchlist, setWatchlist, hideAmounts }) {
  const [subTab, setSubTab] = useState('portfolio');
  const subTabSelector = (
    <div className="grid grid-cols-3 gap-1">
      {SUB_TABS.map(({ id, label }) => (
        <button key={id} onClick={() => setSubTab(id)} className={`py-3 text-sm font-semibold rounded-xl transition-all ${subTab === id ? 'bg-[#3182F6] text-white shadow-md shadow-blue-500/25' : 'text-c-text2 hover:bg-c-bg active:bg-c-bg'}`}>{label}</button>
      ))}
    </div>
  );
  return (
    <div className="animate-slide">
      {subTab === 'portfolio' ? (
        <PortfolioSection portfolio={portfolio} setPortfolio={setPortfolio} stockPrices={stockPrices} exchangeRate={exchangeRate} dividends={dividends} hideAmounts={hideAmounts} subTabSelector={subTabSelector} />
      ) : (
        <>
          <div className="glass rounded-3xl p-3 mb-5">{subTabSelector}</div>
          {subTab === 'exchange' && <ExchangeSection exchangeRate={exchangeRate} portfolio={portfolio} stockPrices={stockPrices} hideAmounts={hideAmounts} />}
          {subTab === 'crypto' && <CryptoSection exchangeRate={exchangeRate} hideAmounts={hideAmounts} />}
          {subTab === 'calc' && <CalcSection />}
          {subTab === 'watchlist' && <WatchlistSection watchlist={watchlist} setWatchlist={setWatchlist} exchangeRate={exchangeRate} hideAmounts={hideAmounts} />}
          {subTab === 'calendar' && <CalendarSection />}
        </>
      )}
    </div>
  );
}

function PortfolioSection({ portfolio, setPortfolio, stockPrices, exchangeRate, dividends, hideAmounts, subTabSelector }) {
  const H = (v) => hideAmounts ? '•••••' : v;
  const [showTradeModal, setShowTradeModal] = useState(null);
  const [tradeForm, setTradeForm] = useState({ shares: '', price: '' });
  const [showTools, setShowTools] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);
  const rate = exchangeRate || 1450;

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 1) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchStock(q);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }, []);

  const addStock = (stock) => {
    if (portfolio.some(s => s.symbol === stock.symbol)) return;
    setPortfolio(prev => [...prev, { symbol: stock.symbol, name: stock.name, shares: 0, avgPrice: 0, currency: 'USD', transactions: [] }]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const items = useMemo(() => portfolio.map(s => {
    const price = stockPrices[s.symbol]?.price || s.avgPrice;
    const v = s.shares * price, c = s.shares * s.avgPrice;
    return { ...s, currentPrice: price, valueKRW: v * rate, costKRW: c * rate, pnlKRW: (v - c) * rate, pnlPercent: ((v - c) / c) * 100 };
  }), [portfolio, stockPrices, rate]);

  const totalV = items.reduce((s, i) => s + i.valueKRW, 0);
  const totalC = items.reduce((s, i) => s + i.costKRW, 0);

  const handleTrade = (type) => {
    if (!showTradeModal || !tradeForm.shares || !tradeForm.price) return;
    const sym = showTradeModal, shares = parseInt(tradeForm.shares), price = parseFloat(tradeForm.price);
    setPortfolio(prev => prev.map(s => {
      if (s.symbol !== sym) return s;
      const tx = { date: new Date().toISOString().split('T')[0], type, shares, price };
      if (type === 'buy') { const ts = s.shares + shares; return { ...s, shares: ts, avgPrice: Math.round((s.shares * s.avgPrice + shares * price) / ts * 100) / 100, transactions: [...s.transactions, tx] }; }
      return { ...s, shares: Math.max(0, s.shares - shares), transactions: [...s.transactions, tx] };
    }));
    setShowTradeModal(null); setTradeForm({ shares: '', price: '' });
  };

  const monthlyDivs = useMemo(() => {
    const m = {}; dividends.forEach(d => { const mo = d.date.substring(0, 7); m[mo] = (m[mo] || 0) + d.amount; });
    return Object.entries(m).map(([month, amount]) => ({ month, amount }));
  }, [dividends]);

  return (
    <div>
      <div className="glass flex-1 flex flex-col">
        {/* 서브탭 */}
        <div className="p-3">{subTabSelector}</div>
        <div className="border-t border-c-border mx-5" />
        {/* 총 평가액 */}
        <div className="px-5 py-4">
          <div className="text-sm text-c-text2">총 평가액</div>
          <div className="text-2xl font-bold text-[#3182F6]">{hideAmounts ? '•••••' : `${formatComma(totalV)}원`}</div>
          <div className={`text-sm font-semibold ${totalV - totalC >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{hideAmounts ? '•••••' : `${totalV - totalC >= 0 ? '+' : ''}${formatComma(totalV - totalC)}원 (${totalC > 0 ? formatPercent((totalV - totalC) / totalC * 100) : '0%'})`}</div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 종목 검색 */}
        <div className="px-5 py-3">
          <button onClick={() => setShowSearch(true)} className="w-full border border-dashed border-c-border rounded-2xl p-3.5 flex items-center justify-center gap-2 text-[#3182F6] font-semibold text-sm hover:bg-c-subtle transition-colors">
            <Search size={16} /> 종목 검색 / 추가
          </button>
        </div>

        {/* 포트폴리오 비중 */}
        {items.length > 0 && (
          <>
            <div className="border-t border-c-border mx-5" />
            <div className="px-5 py-4">
              <h3 className="font-bold text-sm text-c-text mb-3">포트폴리오 비중</h3>
              <div className="flex items-center gap-5">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={items.filter(i => i.valueKRW > 0).map(i => ({ name: i.symbol, value: i.valueKRW }))} cx="50%" cy="50%" innerRadius={32} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>{items.filter(i => i.valueKRW > 0).map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}</Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5">
                  {items.filter(i => i.valueKRW > 0).map((s, idx) => (
                    <div key={s.symbol} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-xs text-c-text font-semibold flex-1">{s.symbol}</span>
                      <span className="text-xs text-c-text2 font-mono tabular-nums">{hideAmounts ? '•••' : `${totalV > 0 ? (s.valueKRW / totalV * 100).toFixed(1) : 0}%`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 각 종목 - 독립 차트 */}
        {items.map(stock => (
          <div key={stock.symbol}>
            <div className="border-t border-c-border mx-5" />
            <div className="px-5 py-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2.5"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: getLogoColor(stock.symbol) }}>{stock.symbol.substring(0, 2)}</div><div><div className="font-bold text-lg text-c-text">{stock.symbol}</div><div className="text-xs text-c-text2">{stock.name}</div></div></div>
            <div className="text-right"><div className="font-bold text-c-text">{H(formatUSD(stock.currentPrice))}</div><div className={`text-xs font-medium ${stock.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{H(formatPercent(stock.pnlPercent))}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
            <div><div className="text-[11px] text-c-text3 mb-0.5">보유수량</div><div className="font-bold text-sm text-c-text"><EditableNumber value={stock.shares} onSave={(v) => setPortfolio(prev => prev.map(s => s.symbol === stock.symbol ? {...s, shares: Math.round(v)} : s))} format={v => `${formatNumber(v)}주`} /></div></div>
            <div><div className="text-[11px] text-c-text3 mb-0.5">평균단가</div><div className="font-bold text-sm text-c-text">{H(formatUSD(stock.avgPrice))}</div></div>
            <div><div className="text-[11px] text-c-text3 mb-0.5">평가액</div><div className="font-bold text-sm text-c-text">{H(formatKRW(stock.valueKRW))}</div></div>
            <div><div className={`text-[11px] mb-0.5 ${stock.pnlKRW >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>손익</div><div className={`font-bold text-sm ${stock.pnlKRW >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{H(`${stock.pnlKRW >= 0 ? '+' : ''}${formatKRW(stock.pnlKRW)}`)}</div></div>
          </div>
          <IndependentStockChart symbol={stock.symbol} />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowTradeModal(stock.symbol)} className="flex-1 bg-[#1A2E24] border border-[#243D2F] text-[#6EBF8B] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Plus size={15} /> 매수</button>
            <button onClick={() => setShowTradeModal(stock.symbol)} className="flex-1 bg-[#2A1A1C] border border-[#3D2428] text-[#D4808A] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Minus size={15} /> 매도</button>
            <button onClick={() => setShowTools(showTools === stock.symbol ? null : stock.symbol)} className="flex-1 text-c-text2 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 border border-c-border">
              <Wrench size={13} /> 도구 {showTools === stock.symbol ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button onClick={() => { if (confirm(`${stock.symbol}을(를) 포트폴리오에서 삭제할까요?`)) setPortfolio(prev => prev.filter(s => s.symbol !== stock.symbol)); }} className="text-red-400 py-3 px-3 rounded-xl text-sm border border-c-border"><Trash2 size={14} /></button>
          </div>
          {showTools === stock.symbol && (
            <div className="mt-3 space-y-4">
              <div className="border-t border-c-border" />
              <StockAveragingCalc stock={stock} />
              <div className="border-t border-c-border" />
              <StockProfitCalc stock={stock} rate={rate} />
            </div>
          )}
        </div>
      </div>
      ))}

      {monthlyDivs.length > 0 && (
        <>
          <div className="border-t border-c-border mx-5" />
          <div className="px-5 py-4">
            <h3 className="font-bold text-base mb-4 text-c-text">배당 수익 (월별)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyDivs}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B949E' }} axisLine={false} tickLine={false} />
                  <YAxis width={50} tick={{ fontSize: 10, fill: '#8B949E' }} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} />
                  <Area type="monotone" dataKey="amount" stroke="#00C48C" fill="rgba(0,196,140,0.15)" strokeWidth={2.5} activeDot={{ r: 5, stroke: '#161B22', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="glass rounded-3xl border border-c-glass-border p-6 w-full max-w-[640px] animate-slide max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-c-subtle rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-c-text">종목 검색</h3>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="text-c-text2"><X size={20} /></button>
            </div>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-text3" />
              <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="티커 또는 종목명 (예: AAPL, Tesla)" className="pl-10" autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {searching && <div className="text-center py-8 text-c-text2 text-sm">검색중...</div>}
              {!searching && searchQuery && searchResults.length === 0 && <div className="text-center py-8 text-c-text2 text-sm">검색 결과 없음</div>}
              {!searching && searchResults.map(r => {
                const alreadyAdded = portfolio.some(s => s.symbol === r.symbol);
                return (
                  <button key={r.symbol} onClick={() => !alreadyAdded && addStock(r)} disabled={alreadyAdded} className={`w-full flex items-center gap-3 p-4 rounded-lg text-left transition-colors ${alreadyAdded ? 'opacity-40' : 'hover:bg-c-bg active:bg-c-bg'}`}>
                    <div className="w-10 h-10 rounded-lg bg-[#3182F6]/10 flex items-center justify-center text-[#3182F6] font-bold text-xs">{r.type === 'ETF' ? 'ETF' : r.symbol.substring(0, 2)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-c-text">{r.symbol}</div>
                      <div className="text-xs text-c-text2 truncate">{r.name}</div>
                    </div>
                    <div className="text-xs text-c-text3">{r.exchange}</div>
                    {alreadyAdded && <span className="text-xs text-c-text3 font-medium">추가됨</span>}
                  </button>
                );
              })}
              {!searching && !searchQuery && (
                <div className="text-center py-8">
                  <Search size={32} className="text-c-text3 mx-auto mb-3" />
                  <div className="text-sm text-c-text2">티커 심볼이나 회사명을 검색하세요</div>
                  <div className="text-xs text-c-text3 mt-1">미국주식, ETF 등 검색 가능</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowTradeModal(null)}>
          <div className="glass rounded-3xl border border-c-glass-border p-6 w-full max-w-[640px] animate-slide" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-c-subtle rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4 text-c-text">{showTradeModal} 거래</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-c-text2 font-medium">수량</label><input type="number" value={tradeForm.shares} onChange={e => setTradeForm({...tradeForm, shares: e.target.value})} placeholder="주수 입력" /></div>
              <div><label className="text-sm text-c-text2 font-medium">가격 (USD)</label><input type="number" step="0.01" value={tradeForm.price} onChange={e => setTradeForm({...tradeForm, price: e.target.value})} placeholder="가격 입력" /></div>
              <div className="flex gap-2">
                <button onClick={() => handleTrade('buy')} className="flex-1 bg-[#1A2E24] border border-[#243D2F] text-[#6EBF8B] py-3.5 rounded-xl font-semibold text-base">매수</button>
                <button onClick={() => handleTrade('sell')} className="flex-1 bg-[#2A1A1C] border border-[#3D2428] text-[#D4808A] py-3.5 rounded-xl font-semibold text-base">매도</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExchangeSection({ exchangeRate, portfolio, stockPrices, hideAmounts }) {
  const H = (v) => hideAmounts ? '•••••' : v;
  const [usdInput, setUsdInput] = useState('');
  const [krwInput, setKrwInput] = useState('');
  const [loading, setLoading] = useState(!exchangeRate);
  const rate = exchangeRate || 1450;
  const totalUSD = portfolio.reduce((s, p) => s + p.shares * (stockPrices[p.symbol]?.price || p.avgPrice), 0);

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 text-center">
        <div className="text-xs font-medium text-c-text2 mb-2">USD/KRW 실시간 환율</div>
        <div className="text-4xl font-extrabold text-[#3182F6] mb-1">{H(`₩${formatComma(rate)}`)}</div>
        <div className="text-xs text-c-text3">{exchangeRate ? '실시간 반영' : '기본값 (API 로딩중)'}</div>
      </div>
      <div className="glass rounded-3xl p-5">
        <h3 className="font-bold text-base mb-4 text-c-text">환율 계산기</h3>
        <div className="space-y-3">
          <div><label className="text-sm text-c-text2 font-medium">USD → KRW</label><div className="flex gap-2 items-center"><input type="number" value={usdInput} onChange={e => setUsdInput(e.target.value)} placeholder="$ 입력" className="flex-1" /><span className="text-sm font-bold text-c-text2">=</span><div className="flex-1 glass-inner rounded-2xl p-3 text-sm font-bold text-c-text">{usdInput ? H(`${formatComma(parseFloat(usdInput) * rate)}원`) : '₩0'}</div></div></div>
          <div><label className="text-sm text-c-text2 font-medium">KRW → USD</label><div className="flex gap-2 items-center"><input type="number" value={krwInput} onChange={e => setKrwInput(e.target.value)} placeholder="₩ 입력" className="flex-1" />{krwInput && <div className="text-xs text-c-text3 absolute mt-10">{H(`${formatComma(krwInput)}원`)}</div>}<span className="text-sm font-bold text-c-text2">=</span><div className="flex-1 glass-inner rounded-2xl p-3 text-sm font-bold text-c-text">{krwInput ? H(formatUSD(parseFloat(krwInput) / rate)) : '$0.00'}</div></div></div>
        </div>
      </div>
      {totalUSD > 0 && <div className="glass rounded-3xl p-5"><h3 className="font-bold text-sm mb-3 text-c-text">내 투자 환율 영향</h3><div className="grid grid-cols-2 gap-3"><div className="glass-inner rounded-2xl p-4"><div className="text-xs text-c-text2 mb-1">해외자산 총액</div><div className="font-bold text-c-text">{H(formatUSD(totalUSD))}</div></div><div className="glass-inner rounded-2xl p-4"><div className="text-xs text-c-text2 mb-1">원화 환산</div><div className="font-bold text-[#3182F6]">{H(`${formatComma(totalUSD * rate)}원`)}</div></div></div><div className="mt-3 bg-[#00C48C]/8 border border-[#00C48C]/15 rounded-xl p-3 text-sm text-[#00C48C]">{H(`환율 1원 상승 시 +${formatComma(totalUSD)}원 변동`)}</div></div>}
    </div>
  );
}

function CryptoSection({ exchangeRate, hideAmounts }) {
  const H = (v) => hideAmounts ? '•••••' : v;
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const rate = exchangeRate || 1450;

  const loadCrypto = async () => {
    setLoading(true); setError(false);
    const coins = ['BTC', 'ETH', 'XRP'];
    const upbitMarkets = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
    try {
      const results = await Promise.all(coins.map(async (coin, i) => {
        const [binance, upbit] = await Promise.allSettled([fetchCryptoPrice(`${coin}USDT`), fetchUpbitPrice(upbitMarkets[i])]);
        const bPrice = binance.status === 'fulfilled' && binance.value ? binance.value.price * rate : 0;
        const uPrice = upbit.status === 'fulfilled' && upbit.value ? upbit.value.price : 0;
        const kimchi = bPrice > 0 ? ((uPrice - bPrice) / bPrice * 100) : 0;
        return { coin, binanceUSD: binance.status === 'fulfilled' && binance.value ? binance.value.price : 0, binanceKRW: bPrice, upbitKRW: uPrice, kimchiAmount: uPrice - bPrice, kimchiPercent: kimchi, change24h: binance.status === 'fulfilled' && binance.value ? binance.value.changePercent : 0, status: Math.abs(kimchi) < 2 ? '적정' : kimchi > 3 ? '과열' : kimchi < -3 ? '저평가' : '주의' };
      }));
      setCryptoData(results);
      if (results.every(r => r.binanceUSD === 0 && r.upbitKRW === 0)) setError(true);
    } catch { setError(true); }
    setLoading(false);
  };

  useEffect(() => { loadCrypto(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-base text-c-text">코인 & 김프</h3><button onClick={loadCrypto} className="text-[#3182F6] text-sm flex items-center gap-1.5 font-medium"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침</button></div>
      {loading && <div className="text-center py-12 text-c-text2"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />데이터 불러오는 중...</div>}
      {error && !loading && <div className="bg-[#FF4757]/8 border border-[#FF4757]/15 rounded-2xl p-5 text-center"><div className="text-sm font-semibold text-[#FF4757] mb-1">데이터를 불러올 수 없습니다</div><div className="text-xs text-c-text2">네트워크를 확인하고 새로고침 해주세요</div></div>}
      {!loading && !error && cryptoData.map(d => (
        <div key={d.coin} className="glass rounded-3xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${d.coin === 'BTC' ? 'bg-[#F7931A]' : d.coin === 'ETH' ? 'bg-[#627EEA]' : 'bg-[#00AAE4]'}`}>{d.coin.substring(0, 1)}</div>
              <div><div className="font-bold text-lg text-c-text">{d.coin}</div><div className={`text-xs font-medium ${d.change24h >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>{d.change24h >= 0 ? '+' : ''}{Number(d.change24h).toFixed(2)}% (24h)</div></div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${d.status === '적정' ? 'bg-[#00C48C]/12 text-[#00C48C]' : d.status === '과열' ? 'bg-[#FF4757]/12 text-[#FF4757]' : d.status === '저평가' ? 'bg-[#3182F6]/12 text-[#3182F6]' : 'bg-[#FF9F43]/12 text-[#FF9F43]'}`}>{d.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-inner rounded-2xl p-4"><div className="text-xs text-c-text2 mb-1">해외 (Binance)</div><div className="font-bold text-base text-c-text">{H(formatUSD(d.binanceUSD))}</div><div className="text-xs text-c-text3 mt-0.5">{H(`${formatComma(d.binanceKRW)}원`)}</div></div>
            <div className="glass-inner rounded-2xl p-4"><div className="text-xs text-c-text2 mb-1">한국 (Upbit)</div><div className="font-bold text-base text-c-text">{H(`${formatComma(d.upbitKRW)}원`)}</div></div>
          </div>
          <div className="mt-2.5 glass-inner rounded-2xl p-4 flex items-center justify-center gap-3">
            <span className="text-xs font-medium text-c-text2">김치프리미엄</span>
            <span className={`text-lg font-extrabold ${d.kimchiPercent >= 0 ? 'text-[#FF4757]' : 'text-[#3182F6]'}`}>{d.kimchiPercent >= 0 ? '+' : ''}{d.kimchiPercent.toFixed(2)}%</span>
            <span className="text-xs text-c-text3">({H(`${d.kimchiAmount >= 0 ? '+' : ''}${formatComma(d.kimchiAmount)}원`)})</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalcSection() {
  const [calcType, setCalcType] = useState('compound');
  const types = [{ id: 'compound', label: '복리' }, { id: 'breakeven', label: '손익분기' }, { id: 'dividend', label: '배당' }, { id: 'averaging', label: '물타기' }, { id: 'target', label: '목표자산' }];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">{types.map(c => <button key={c.id} onClick={() => setCalcType(c.id)} className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${calcType === c.id ? 'bg-[#3182F6] text-white' : 'glass-inner text-c-text2'}`}>{c.label}</button>)}</div>
      {calcType === 'compound' && <CompoundCalc />}
      {calcType === 'breakeven' && <BreakevenCalc />}
      {calcType === 'dividend' && <DividendCalc />}
      {calcType === 'averaging' && <AveragingCalc />}
      {calcType === 'target' && <TargetCalc />}
    </div>
  );
}

function CompoundCalc() {
  const [init, setInit] = useState('10000000'); const [mo, setMo] = useState('2000000'); const [r, setR] = useState('10'); const [y, setY] = useState('10');
  const result = useMemo(() => { const p = parseFloat(init)||0, m = parseFloat(mo)||0, rate = (parseFloat(r)||0)/100, n = (parseInt(y)||0)*12; let t = p; for(let i=0;i<n;i++) t = t*(1+rate/12)+m; return { total: t, profit: t-(p+m*n), invested: p+m*n }; }, [init,mo,r,y]);
  return (<div className="glass rounded-3xl p-5 space-y-3"><h3 className="font-bold text-base text-c-text">복리 계산기</h3><div><label className="text-sm text-c-text2 font-medium">초기 투자금</label><input type="number" value={init} onChange={e=>setInit(e.target.value)} />{init && <div className="text-xs text-c-text3 mt-1">{formatComma(init)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">월 적립액</label><input type="number" value={mo} onChange={e=>setMo(e.target.value)} />{mo && <div className="text-xs text-c-text3 mt-1">{formatComma(mo)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">연 수익률 (%)</label><input type="number" value={r} onChange={e=>setR(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">기간 (년)</label><input type="number" value={y} onChange={e=>setY(e.target.value)} /></div><div className="glass-inner rounded-2xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-c-text2">최종 금액</span><span className="font-bold text-[#3182F6]">{formatComma(result.total)}원</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">총 투자금</span><span className="font-medium text-c-text">{formatComma(result.invested)}원</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">수익금</span><span className="font-bold text-green-500">+{formatComma(result.profit)}원</span></div></div></div>);
}

function BreakevenCalc() {
  const [buy, setBuy] = useState(''); const [cur, setCur] = useState('');
  const pnl = buy && cur ? ((parseFloat(cur)-parseFloat(buy))/parseFloat(buy)*100) : 0;
  const need = buy && cur && parseFloat(cur) < parseFloat(buy) ? ((parseFloat(buy)-parseFloat(cur))/parseFloat(cur)*100) : 0;
  return (<div className="glass rounded-3xl p-5 space-y-3"><h3 className="font-bold text-base text-c-text">손익분기점 계산기</h3><div><label className="text-sm text-c-text2 font-medium">매수가</label><input type="number" value={buy} onChange={e=>setBuy(e.target.value)} placeholder="매수가" /></div><div><label className="text-sm text-c-text2 font-medium">현재가</label><input type="number" value={cur} onChange={e=>setCur(e.target.value)} placeholder="현재가" /></div>{buy&&cur&&<div className="glass-inner rounded-2xl p-4"><div className="flex justify-between text-sm"><span className="text-c-text2">현재 수익률</span><span className={`font-bold ${pnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(pnl)}</span></div>{need>0&&<div className="flex justify-between text-sm mt-1"><span className="text-c-text2">본전까지</span><span className="font-bold text-orange-500">+{need.toFixed(2)}%</span></div>}</div>}</div>);
}

function DividendCalc() {
  const [amt, setAmt] = useState('100000000'); const [dr, setDr] = useState('5'); const [tgt, setTgt] = useState('5000000');
  const annual = (parseFloat(amt)||0)*(parseFloat(dr)||0)/100; const monthly = annual/12; const needed = (parseFloat(tgt)||0)*12/((parseFloat(dr)||1)/100);
  return (<div className="glass rounded-3xl p-5 space-y-3"><h3 className="font-bold text-base text-c-text">배당 계산기</h3><div><label className="text-sm text-c-text2 font-medium">투자금</label><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} />{amt && <div className="text-xs text-c-text3 mt-1">{formatComma(amt)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">배당률 (%)</label><input type="number" value={dr} onChange={e=>setDr(e.target.value)} /></div><div className="glass-inner rounded-2xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-c-text2">연 배당</span><span className="font-bold text-c-text">{formatComma(annual)}원</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">월 배당</span><span className="font-bold text-green-500">{formatComma(monthly)}원</span></div></div><div className="border-t border-c-border pt-3"><div><label className="text-sm text-c-text2 font-medium">목표 월 배당</label><input type="number" value={tgt} onChange={e=>setTgt(e.target.value)} />{tgt && <div className="text-xs text-c-text3 mt-1">{formatComma(tgt)}원</div>}</div><div className="glass-inner rounded-2xl p-4 mt-2"><div className="flex justify-between text-sm"><span className="text-c-text2">필요 투자금</span><span className="font-bold text-[#3182F6]">{formatComma(needed)}원</span></div></div></div></div>);
}

function AveragingCalc() {
  const [cs, setCs] = useState('10000'); const [ca, setCa] = useState('1.02'); const [cp, setCp] = useState('0.85'); const [as2, setAs] = useState('5000'); const [ap, setAp] = useState('0.85');
  const ts = (parseInt(cs)||0)+(parseInt(as2)||0);
  const na = ts > 0 ? ((parseInt(cs)||0)*(parseFloat(ca)||0)+(parseInt(as2)||0)*(parseFloat(ap)||0))/ts : 0;
  const curPnl = ((parseFloat(cp)||0)-(parseFloat(ca)||0))/(parseFloat(ca)||1)*100;
  const newPnl = ((parseFloat(cp)||0)-na)/(na||1)*100;
  return (<div className="glass rounded-3xl p-5 space-y-3"><h3 className="font-bold text-base text-c-text">물타기 계산기</h3><div className="grid grid-cols-2 gap-2"><div><label className="text-sm text-c-text2 font-medium">현재 수량</label><input type="number" value={cs} onChange={e=>setCs(e.target.value)} />{cs && <div className="text-xs text-c-text3 mt-1">{formatComma(cs)}주</div>}</div><div><label className="text-sm text-c-text2 font-medium">평균단가</label><input type="number" step="0.01" value={ca} onChange={e=>setCa(e.target.value)} /></div></div><div><label className="text-sm text-c-text2 font-medium">현재가</label><input type="number" step="0.01" value={cp} onChange={e=>setCp(e.target.value)} /></div><div className="border-t border-c-border pt-3"><div className="text-xs font-bold text-c-text2 mb-2">추가 매수</div><div className="grid grid-cols-2 gap-2"><div><label className="text-sm text-c-text2 font-medium">추가 수량</label><input type="number" value={as2} onChange={e=>setAs(e.target.value)} />{as2 && <div className="text-xs text-c-text3 mt-1">{formatComma(as2)}주</div>}</div><div><label className="text-sm text-c-text2 font-medium">매수 가격</label><input type="number" step="0.01" value={ap} onChange={e=>setAp(e.target.value)} /></div></div></div><div className="glass-inner rounded-2xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-c-text2">현재 평단</span><span className="font-semibold text-c-text">{formatUSD(parseFloat(ca))}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">새 평단</span><span className="font-bold text-[#3182F6]">{formatUSD(na)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">현재 수익률</span><span className={`font-semibold ${curPnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(curPnl)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">물타기 후</span><span className={`font-bold ${newPnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(newPnl)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">총 수량</span><span className="font-semibold text-c-text">{formatComma(ts)}주</span></div></div><div className="bg-[#FF4757]/8 border border-[#FF4757]/15 rounded-xl p-3"><div className="text-xs font-bold text-[#FF4757] mb-1">주의사항</div><ul className="text-xs text-[#FF4757]/80 space-y-0.5"><li>• 물타기는 추가 손실 위험이 있습니다</li><li>• 단계적 분할 매수를 권장합니다</li></ul></div></div>);
}

function TargetCalc() {
  const [t, setT] = useState('200000000'); const [c, setC] = useState('30000000'); const [m, setM] = useState('2000000'); const [r, setR] = useState('10');
  const result = useMemo(() => {
    const tg=parseFloat(t)||0, cu=parseFloat(c)||0, mo=parseFloat(m)||0, rt=(parseFloat(r)||0)/100/12;
    if(mo<=0||rt<=0) return null;
    let b=cu, months=0; while(b<tg&&months<600){b=b*(1+rt)+mo;months++;}
    const d=new Date(); d.setMonth(d.getMonth()+months);
    return { months, years: (months/12).toFixed(1), date: d.toLocaleDateString('ko-KR') };
  }, [t,c,m,r]);
  return (<div className="glass rounded-3xl p-5 space-y-3"><h3 className="font-bold text-base text-c-text">목표 자산 계산기</h3><div><label className="text-sm text-c-text2 font-medium">목표 금액</label><input type="number" value={t} onChange={e=>setT(e.target.value)} />{t && <div className="text-xs text-c-text3 mt-1">{formatComma(t)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">현재 자산</label><input type="number" value={c} onChange={e=>setC(e.target.value)} />{c && <div className="text-xs text-c-text3 mt-1">{formatComma(c)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">월 저축액</label><input type="number" value={m} onChange={e=>setM(e.target.value)} />{m && <div className="text-xs text-c-text3 mt-1">{formatComma(m)}원</div>}</div><div><label className="text-sm text-c-text2 font-medium">연 수익률 (%)</label><input type="number" value={r} onChange={e=>setR(e.target.value)} /></div>{result&&<div className="glass-inner rounded-2xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-c-text2">달성 기간</span><span className="font-bold text-purple-400">{result.years}년 ({result.months}개월)</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">예상 달성일</span><span className="font-semibold text-c-text">{result.date}</span></div></div>}</div>);
}

function StockAveragingCalc({ stock }) {
  const [addShares, setAddShares] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const as2 = parseInt(addShares) || 0, ap = parseFloat(addPrice) || 0;
  const ts = stock.shares + as2;
  const newAvg = ts > 0 ? (stock.shares * stock.avgPrice + as2 * ap) / ts : 0;
  const pnlBefore = stock.avgPrice > 0 ? ((ap - stock.avgPrice) / stock.avgPrice * 100) : 0;
  const pnlAfter = newAvg > 0 ? ((ap - newAvg) / newAvg * 100) : 0;
  return (
    <div className="space-y-2.5">
      <div className="text-sm font-bold text-c-text flex items-center gap-1.5"><Calculator size={14} className="text-[#3182F6]" /> 물타기 계산기</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-c-text2">
        <div>현재 {formatNumber(stock.shares)}주</div><div>평단 ${stock.avgPrice.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">추가 수량</label><input type="number" value={addShares} onChange={e => setAddShares(e.target.value)} placeholder="주수" /></div>
        <div><label className="text-xs text-c-text2">매수 가격</label><input type="number" step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="$" /></div>
      </div>
      {as2 > 0 && ap > 0 && (
        <div className="border-t border-c-border pt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-c-text2">새 평단</span><span className="font-bold text-[#3182F6]">${newAvg.toFixed(4)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">총 수량</span><span className="font-semibold text-c-text">{formatNumber(ts)}주</span></div>
          <div className="flex justify-between"><span className="text-c-text2">물타기 전 수익률</span><span className={`font-semibold ${pnlBefore >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnlBefore >= 0 ? '+' : ''}{pnlBefore.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-c-text2">물타기 후 수익률</span><span className={`font-bold ${pnlAfter >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnlAfter >= 0 ? '+' : ''}{pnlAfter.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-c-text2">추가 투자금</span><span className="text-c-text font-medium">${(as2 * ap).toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}

function StockProfitCalc({ stock, rate }) {
  const [sellPrice, setSellPrice] = useState('');
  const [sellShares, setSellShares] = useState('');
  const sp = parseFloat(sellPrice) || 0;
  const ss = parseInt(sellShares) || stock.shares;
  const profitUSD = (sp - stock.avgPrice) * ss;
  const profitKRW = profitUSD * rate;
  const profitPct = stock.avgPrice > 0 ? ((sp - stock.avgPrice) / stock.avgPrice * 100) : 0;
  const totalSell = sp * ss;
  return (
    <div className="space-y-2.5">
      <div className="text-sm font-bold text-c-text flex items-center gap-1.5"><DollarSign size={14} className="text-green-500" /> 수익 계산기</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-c-text2">
        <div>보유 {formatNumber(stock.shares)}주</div><div>평단 ${stock.avgPrice.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">매도 가격</label><input type="number" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="$" /></div>
        <div><label className="text-xs text-c-text2">매도 수량</label><input type="number" value={sellShares} onChange={e => setSellShares(e.target.value)} placeholder={`전량 ${stock.shares}`} /></div>
      </div>
      {sp > 0 && (
        <div className="border-t border-c-border pt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-c-text2">매도 총액</span><span className="font-semibold text-c-text">${totalSell.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">손익 (USD)</span><span className={`font-bold ${profitUSD >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">손익 (KRW)</span><span className={`font-bold ${profitKRW >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitKRW >= 0 ? '+' : ''}{formatFullKRW(profitKRW)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">수익률</span><span className={`font-bold text-lg ${profitPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%</span></div>
        </div>
      )}
      <div className="border-t border-c-border pt-2.5 mt-1">
        <div className="text-xs font-bold text-c-text flex items-center gap-1.5 mb-2"><Target size={12} className="text-[#FF9F43]" /> 목표가</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center"><div className="text-c-text3 mb-0.5">+10%</div><div className="font-bold text-green-500">${(stock.avgPrice * 1.1).toFixed(2)}</div></div>
          <div className="text-center"><div className="text-c-text3 mb-0.5">+20%</div><div className="font-bold text-green-500">${(stock.avgPrice * 1.2).toFixed(2)}</div></div>
          <div className="text-center"><div className="text-c-text3 mb-0.5">-10%</div><div className="font-bold text-red-500">${(stock.avgPrice * 0.9).toFixed(2)}</div></div>
          <div className="text-center"><div className="text-c-text3 mb-0.5">본전</div><div className="font-bold text-[#3182F6]">${stock.avgPrice.toFixed(2)}</div></div>
        </div>
      </div>
    </div>
  );
}

function WatchlistSection({ watchlist, setWatchlist, exchangeRate, hideAmounts }) {
  const H = (v) => hideAmounts ? '•••••' : v;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [prices, setPrices] = useState({});
  const searchTimeout = useRef(null);
  const rate = exchangeRate || 1450;

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 1) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const { searchStock } = await import('../../utils/api');
      const results = await searchStock(q);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) return;
    const load = async () => {
      const { fetchStockPrice } = await import('../../utils/api');
      const p = {};
      for (const s of watchlist) { const d = await fetchStockPrice(s.symbol); if (d) p[s.symbol] = d; }
      setPrices(p);
    };
    load();
  }, [watchlist]);

  return (
    <div className="space-y-4">
      <button onClick={() => setShowSearch(true)} className="w-full glass rounded-3xl border border-dashed border-c-border p-5 flex items-center justify-center gap-2 text-[#3182F6] font-semibold text-base">
        <Eye size={20} /> 관심종목 추가
      </button>

      {watchlist.map(stock => {
        const price = prices[stock.symbol];
        return (
          <div key={stock.symbol} className="glass rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: getLogoColor(stock.symbol) }}>{stock.symbol.substring(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base text-c-text">{stock.symbol}</div>
                <div className="text-xs text-c-text2 truncate">{stock.name}</div>
              </div>
              <div className="text-right">
                {price ? (
                  <>
                    <div className="font-bold text-c-text">{H(`$${price.price?.toFixed(2)}`)}</div>
                    <div className={`text-xs font-medium ${price.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{price.changePercent >= 0 ? '+' : ''}{price.changePercent?.toFixed(2)}%</div>
                  </>
                ) : <div className="text-xs text-c-text2">로딩중...</div>}
              </div>
              <button onClick={() => setWatchlist(prev => prev.filter(s => s.symbol !== stock.symbol))} className="text-red-400 p-2"><Trash2 size={14} /></button>
            </div>
          </div>
        );
      })}

      {watchlist.length === 0 && !showSearch && (
        <div className="text-center py-12 text-c-text2">
          <Eye size={32} className="mx-auto mb-3 text-c-text3" />
          <div className="text-sm">관심 종목을 추가해보세요</div>
          <div className="text-xs text-c-text3 mt-1">보유하지 않아도 가격을 추적할 수 있어요</div>
        </div>
      )}

      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="glass rounded-3xl border border-c-glass-border p-6 w-full max-w-[640px] animate-slide max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-c-subtle rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-lg text-c-text mb-4">관심종목 검색</h3>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-text3" />
              <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="티커 또는 종목명" className="pl-10" autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {searching && <div className="text-center py-8 text-c-text2 text-sm">검색중...</div>}
              {!searching && searchResults.map(r => {
                const added = watchlist.some(s => s.symbol === r.symbol);
                return (
                  <button key={r.symbol} onClick={() => { if (!added) { setWatchlist(prev => [...prev, { symbol: r.symbol, name: r.name }]); setShowSearch(false); setSearchQuery(''); setSearchResults([]); } }} disabled={added} className={`w-full flex items-center gap-3 p-4 rounded-lg text-left ${added ? 'opacity-40' : 'hover:bg-c-bg'}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: getLogoColor(r.symbol) }}>{r.symbol.substring(0, 2)}</div>
                    <div className="flex-1 min-w-0"><div className="font-bold text-sm text-c-text">{r.symbol}</div><div className="text-xs text-c-text2 truncate">{r.name}</div></div>
                    {added && <span className="text-xs text-c-text3">추가됨</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarSection() {
  const today = new Date().toISOString().split('T')[0];
  const [expanded, setExpanded] = useState(null);
  const thisWeek = ECONOMIC_CALENDAR.filter(e => { const d = new Date(e.date), n = new Date(), w = new Date(n); w.setDate(w.getDate()+7); return d >= n && d <= w; });
  const nextWeek = ECONOMIC_CALENDAR.filter(e => { const d = new Date(e.date), n = new Date(), s = new Date(n); s.setDate(s.getDate()+7); const w = new Date(n); w.setDate(w.getDate()+14); return d > s && d <= w; });

  const renderEvent = (e, i) => {
    const key = `${e.date}-${e.name}`;
    const isOpen = expanded === key;
    return (
      <div key={i} className="border-b border-c-border last:border-0">
        <button onClick={() => setExpanded(isOpen ? null : key)} className="w-full flex items-center gap-3 py-3.5 text-left">
          <div className="text-center min-w-[55px]">
            <div className="text-sm text-c-text2 font-medium">{e.date.substring(5)}</div>
            <div className="text-sm text-c-text3">{e.time}</div>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-c-text">{e.name}</div>
            <div className="text-sm text-c-text2">예상: {e.forecast} | 전월: {e.previous}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">{Array.from({length: e.importance}, (_, j) => <span key={j} className={`w-1.5 h-1.5 rounded-full ${e.importance >= 4 ? 'bg-[#FF4757]' : e.importance >= 3 ? 'bg-[#FF9F43]' : 'bg-[#FFD93D]'}`} />)}</div>
            <ChevronDown size={12} className={`text-c-text3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isOpen && e.impact && (
          <div className="pb-3.5 pl-[67px] pr-3 animate-fade">
            <div className="bg-[#3182F6]/8 border border-[#3182F6]/15 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-[#3182F6] mb-1.5">시장 영향</div>
              <div className="text-sm text-c-text leading-relaxed">{e.impact}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (<div className="space-y-4"><div className="glass rounded-3xl p-5"><h3 className="font-bold text-base mb-4 text-c-text">이번주 주요 지표</h3>{thisWeek.length > 0 ? thisWeek.map(renderEvent) : <div className="text-sm text-c-text2 text-center py-6">이번주 일정 없음</div>}</div><div className="glass rounded-3xl p-5"><h3 className="font-bold text-base mb-4 text-c-text">다음주 일정</h3>{nextWeek.length > 0 ? nextWeek.map(renderEvent) : <div className="text-sm text-c-text2 text-center py-6">다음주 일정 없음</div>}</div></div>);
}

export default InvestTab;
