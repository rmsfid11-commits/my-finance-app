import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { formatFullKRW, formatKRW, formatUSD, formatPercent, formatNumber } from '../../utils/formatters';
import { fetchChartData, fetchCryptoPrice, fetchUpbitPrice, searchStock } from '../../utils/api';
import { ECONOMIC_CALENDAR } from '../../data/initialData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Bitcoin, Calculator, Calendar, Plus, Minus, RefreshCw, Search, X, ChevronDown, ChevronUp, Wrench, Trash2 } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';
import { useSwipe } from '../../hooks/useSwipe';

const SUB_TABS = [
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'exchange', label: '환율' },
  { id: 'crypto', label: '코인/김프' },
  { id: 'calc', label: '계산기' },
  { id: 'calendar', label: '경제일정' },
];

const TIMEFRAMES = [
  { id: '4h', label: '4시간', interval: '1h', range: '10d' },
  { id: '1d', label: '일봉', interval: '1d', range: '6mo' },
  { id: '1w', label: '주봉', interval: '1wk', range: '2y' },
  { id: '1m', label: '월봉', interval: '1mo', range: '5y' },
];

function CandlestickChart({ data }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data?.length) return <div className="h-48 flex items-center justify-center text-c-text2 text-sm">차트 데이터 없음</div>;

  const h = 200, padT = 20, padB = 24;
  const cH = h - padT - padB;
  const allP = data.flatMap(d => [d.high, d.low]).filter(Boolean);
  const minP = Math.min(...allP), maxP = Math.max(...allP), rng = maxP - minP || 1;
  const yPos = (p) => padT + cH * (1 - (p - minP) / rng);
  const step = width / data.length;
  const bw = Math.max(1.5, Math.min(8, step * 0.65));

  const handleInteraction = (clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const idx = Math.min(data.length - 1, Math.max(0, Math.floor((clientX - rect.left) / step)));
    setTip(data[idx]);
  };

  return (
    <div ref={ref} className="relative h-[200px] touch-none"
      onTouchMove={e => handleInteraction(e.touches[0].clientX)}
      onTouchEnd={() => setTip(null)}
      onMouseMove={e => handleInteraction(e.clientX)}
      onMouseLeave={() => setTip(null)}>
      {tip && (
        <div className="absolute top-0 left-0 right-0 bg-c-bg/95 border border-c-border rounded-lg px-3 py-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono z-10">
          <span className="text-c-text2">{tip.date}</span>
          <span>O <span className="text-c-text font-semibold">{tip.open?.toFixed(2)}</span></span>
          <span>H <span className="text-green-500 font-semibold">{tip.high?.toFixed(2)}</span></span>
          <span>L <span className="text-red-500 font-semibold">{tip.low?.toFixed(2)}</span></span>
          <span>C <span className={`font-semibold ${tip.close >= tip.open ? 'text-green-500' : 'text-red-500'}`}>{tip.close?.toFixed(2)}</span></span>
        </div>
      )}
      {width > 0 && (
        <svg width={width} height={h}>
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const yy = padT + cH * pct, price = maxP - rng * pct;
            return (<g key={pct}><line x1={0} y1={yy} x2={width} y2={yy} stroke="var(--color-border,#30363D)" strokeWidth={0.5} opacity={0.4} /><text x={width - 4} y={yy - 4} textAnchor="end" fill="#8B949E" fontSize={9}>{price.toFixed(2)}</text></g>);
          })}
          {data.map((d, i) => {
            if (!d.open || !d.close || !d.high || !d.low) return null;
            const cx = step * i + step / 2, isUp = d.close >= d.open;
            const color = isUp ? '#00C48C' : '#FF4757';
            const bTop = yPos(Math.max(d.open, d.close)), bBot = yPos(Math.min(d.open, d.close));
            return (<g key={i}><line x1={cx} y1={yPos(d.high)} x2={cx} y2={yPos(d.low)} stroke={color} strokeWidth={1} /><rect x={cx - bw / 2} y={bTop} width={bw} height={Math.max(1, bBot - bTop)} fill={color} rx={0.5} /></g>);
          })}
          {data.filter((_, i) => i % Math.max(1, Math.ceil(data.length / 6)) === 0).map((d) => {
            const idx = data.indexOf(d);
            return <text key={idx} x={step * idx + step / 2} y={h - 5} textAnchor="middle" fill="#8B949E" fontSize={9}>{d.date}</text>;
          })}
        </svg>
      )}
    </div>
  );
}

function InvestTab({ portfolio, setPortfolio, stockPrices, exchangeRate, dividends, goals }) {
  const [subTab, setSubTab] = useState('portfolio');
  return (
    <div className="animate-slide">
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {SUB_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setSubTab(id)} className={`flex items-center gap-1.5 px-6 py-3.5 rounded-lg text-base whitespace-nowrap transition-all ${subTab === id ? 'bg-[#3182F6] text-white font-bold shadow-lg shadow-blue-500/25' : 'bg-c-bg text-c-text2 border border-c-border font-medium'}`}>{label}</button>
        ))}
      </div>
      {subTab === 'portfolio' && <PortfolioSection portfolio={portfolio} setPortfolio={setPortfolio} stockPrices={stockPrices} exchangeRate={exchangeRate} dividends={dividends} />}
      {subTab === 'exchange' && <ExchangeSection exchangeRate={exchangeRate} portfolio={portfolio} stockPrices={stockPrices} />}
      {subTab === 'crypto' && <CryptoSection exchangeRate={exchangeRate} />}
      {subTab === 'calc' && <CalcSection />}
      {subTab === 'calendar' && <CalendarSection />}
    </div>
  );
}

function PortfolioSection({ portfolio, setPortfolio, stockPrices, exchangeRate, dividends }) {
  const [chartSymbol, setChartSymbol] = useState(null);
  const [chartRange, setChartRange] = useState('1d');
  const [chartData, setChartData] = useState([]);
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
    setChartSymbol(stock.symbol);
    setChartRange('1d');
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (!chartSymbol && portfolio.length > 0) { setChartSymbol(portfolio[0].symbol); return; }
    if (!chartSymbol) return;
    const tf = TIMEFRAMES.find(t => t.id === chartRange) || TIMEFRAMES[1];
    fetchChartData(chartSymbol, tf.range, tf.interval).then(d => { if (d.length > 0) setChartData(d); });
  }, [chartSymbol, chartRange]);

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
    <div className="space-y-4">
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <div className="text-sm text-c-text2">총 평가액</div>
        <div className="text-2xl font-bold text-[#3182F6]">{formatFullKRW(totalV)}</div>
        <div className={`text-sm font-semibold ${totalV - totalC >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalV - totalC >= 0 ? '+' : ''}{formatFullKRW(totalV - totalC)} ({totalC > 0 ? formatPercent((totalV - totalC) / totalC * 100) : '0%'})</div>
      </div>

      <button onClick={() => setShowSearch(true)} className="w-full bg-c-card border-2 border-dashed border-c-border rounded-lg p-5 flex items-center justify-center gap-2 text-[#3182F6] font-semibold text-base hover:bg-c-bg transition-colors">
        <Search size={20} /> 종목 검색 / 추가
      </button>

      {items.map(stock => (
        <div key={stock.symbol} className="bg-c-card rounded-lg p-5 border border-c-border">
          <div className="flex justify-between items-start mb-3">
            <div><div className="font-bold text-lg text-c-text">{stock.symbol}</div><div className="text-xs text-c-text2">{stock.name}</div></div>
            <div className="text-right"><div className="font-bold text-c-text">{formatUSD(stock.currentPrice)}</div><div className={`text-xs font-medium ${stock.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(stock.pnlPercent)}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className="text-xs text-c-text2 mb-1">보유수량</div><div className="font-bold text-base text-c-text">
              <EditableNumber value={stock.shares} onSave={(v) => setPortfolio(prev => prev.map(s => s.symbol === stock.symbol ? {...s, shares: Math.round(v)} : s))} format={v => `${formatNumber(v)}주`} />
            </div></div>
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className="text-xs text-c-text2 mb-1">평균단가</div><div className="font-bold text-base text-c-text">{formatUSD(stock.avgPrice)}</div></div>
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className="text-xs text-c-text2 mb-1">평가액</div><div className="font-bold text-base text-c-text">{formatKRW(stock.valueKRW)}</div></div>
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className={`text-xs mb-1 ${stock.pnlKRW >= 0 ? 'text-green-500' : 'text-red-500'}`}>손익</div><div className={`font-bold text-base ${stock.pnlKRW >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stock.pnlKRW >= 0 ? '+' : ''}{formatKRW(stock.pnlKRW)}</div></div>
          </div>
          <div className="flex gap-1 mb-3">
            {TIMEFRAMES.map(tf => (
              <button key={tf.id} onClick={() => { setChartSymbol(stock.symbol); setChartRange(tf.id); }} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${chartSymbol === stock.symbol && chartRange === tf.id ? 'bg-[#3182F6] text-white' : 'bg-c-bg text-c-text2 border border-c-border'}`}>
                {tf.label}
              </button>
            ))}
          </div>
          {chartSymbol === stock.symbol && chartData.length > 0 && <CandlestickChart data={chartData} />}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowTradeModal(stock.symbol)} className="flex-1 bg-[#1A2E24] border border-[#243D2F] text-[#6EBF8B] py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Plus size={16} /> 매수</button>
            <button onClick={() => setShowTradeModal(stock.symbol)} className="flex-1 bg-[#2A1A1C] border border-[#3D2428] text-[#D4808A] py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Minus size={16} /> 매도</button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowTools(showTools === stock.symbol ? null : stock.symbol)} className="flex-1 bg-c-bg border border-c-border text-c-text2 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <Wrench size={14} /> 종목 도구 {showTools === stock.symbol ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={() => { if (confirm(`${stock.symbol}을(를) 포트폴리오에서 삭제할까요?`)) setPortfolio(prev => prev.filter(s => s.symbol !== stock.symbol)); }} className="bg-c-bg border border-c-border text-red-400 py-3 px-4 rounded-xl text-sm"><Trash2 size={14} /></button>
          </div>
          {showTools === stock.symbol && (
            <div className="mt-3 space-y-3">
              <StockAveragingCalc stock={stock} />
              <StockProfitCalc stock={stock} rate={rate} />
            </div>
          )}
        </div>
      ))}

      {monthlyDivs.length > 0 && (
        <div className="bg-c-card rounded-lg p-5 border border-c-border"><h3 className="font-bold text-base mb-4 text-c-text">배당 수익 (월별)</h3><div className="h-48"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyDivs}><XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B949E' }} axisLine={false} tickLine={false} /><YAxis width={50} tick={{ fontSize: 10, fill: '#8B949E' }} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /><Area type="monotone" dataKey="amount" stroke="#00C48C" fill="rgba(0,196,140,0.15)" strokeWidth={2.5} activeDot={{ r: 5, stroke: '#161B22', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div></div>
      )}

      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="bg-c-card rounded-xl p-6 w-full max-w-[640px] animate-slide max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowTradeModal(null)}>
          <div className="bg-c-card rounded-xl p-6 w-full max-w-[640px] animate-slide" onClick={e => e.stopPropagation()}>
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

function ExchangeSection({ exchangeRate, portfolio, stockPrices }) {
  const [usdInput, setUsdInput] = useState('');
  const [krwInput, setKrwInput] = useState('');
  const rate = exchangeRate || 1450;
  const totalUSD = portfolio.reduce((s, p) => s + p.shares * (stockPrices[p.symbol]?.price || p.avgPrice), 0);

  return (
    <div className="space-y-4">
      <div className="bg-c-card rounded-lg p-5 border border-c-border"><h3 className="font-bold text-base mb-3 text-c-text">USD/KRW 환율</h3><div className="text-3xl font-bold text-center text-[#3182F6] mb-2">₩{rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</div></div>
      <div className="bg-c-card rounded-lg p-5 border border-c-border">
        <h3 className="font-bold text-base mb-4 text-c-text">환율 계산기</h3>
        <div className="space-y-3">
          <div><label className="text-sm text-c-text2 font-medium">USD → KRW</label><div className="flex gap-2 items-center"><input type="number" value={usdInput} onChange={e => setUsdInput(e.target.value)} placeholder="$ 입력" className="flex-1" /><span className="text-sm font-bold text-c-text2">=</span><div className="flex-1 bg-c-bg border border-c-border rounded-xl p-3 text-sm font-bold text-c-text">{usdInput ? formatFullKRW(parseFloat(usdInput) * rate) : '₩0'}</div></div></div>
          <div><label className="text-sm text-c-text2 font-medium">KRW → USD</label><div className="flex gap-2 items-center"><input type="number" value={krwInput} onChange={e => setKrwInput(e.target.value)} placeholder="₩ 입력" className="flex-1" /><span className="text-sm font-bold text-c-text2">=</span><div className="flex-1 bg-c-bg border border-c-border rounded-xl p-3 text-sm font-bold text-c-text">{krwInput ? formatUSD(parseFloat(krwInput) / rate) : '$0.00'}</div></div></div>
        </div>
      </div>
      <div className="bg-c-bg border border-c-border rounded-lg p-5"><h3 className="font-bold text-base mb-2 text-blue-400">내 투자 영향도</h3><p className="text-sm text-blue-300">환율 1원 상승 시: <span className="font-bold text-green-500">+{formatFullKRW(totalUSD)}</span></p><p className="text-xs text-blue-400 mt-1">총 해외자산: {formatUSD(totalUSD)}</p></div>
    </div>
  );
}

function CryptoSection({ exchangeRate }) {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const rate = exchangeRate || 1450;

  const loadCrypto = async () => {
    setLoading(true);
    const coins = ['BTC', 'ETH', 'XRP'];
    const upbitMarkets = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
    const results = await Promise.all(coins.map(async (coin, i) => {
      const [binance, upbit] = await Promise.allSettled([fetchCryptoPrice(`${coin}USDT`), fetchUpbitPrice(upbitMarkets[i])]);
      const bPrice = binance.status === 'fulfilled' && binance.value ? binance.value.price * rate : 0;
      const uPrice = upbit.status === 'fulfilled' && upbit.value ? upbit.value.price : 0;
      const kimchi = bPrice > 0 ? ((uPrice - bPrice) / bPrice * 100) : 0;
      return { coin, binanceUSD: binance.status === 'fulfilled' && binance.value ? binance.value.price : 0, binanceKRW: bPrice, upbitKRW: uPrice, kimchiAmount: uPrice - bPrice, kimchiPercent: kimchi, status: Math.abs(kimchi) < 2 ? '적정' : kimchi > 3 ? '과열' : kimchi < -3 ? '저평가' : '주의' };
    }));
    setCryptoData(results); setLoading(false);
  };

  useEffect(() => { loadCrypto(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-base text-c-text">코인 & 김프 계산기</h3><button onClick={loadCrypto} className="text-[#3182F6] text-sm flex items-center gap-1 font-medium"><RefreshCw size={14} /> 새로고침</button></div>
      {loading ? <div className="text-center py-8 text-c-text2">로딩중...</div> : cryptoData.map(d => (
        <div key={d.coin} className="bg-c-card rounded-lg p-5 border border-c-border">
          <div className="flex justify-between items-center mb-3"><div className="font-bold text-lg text-c-text">{d.coin}</div><span className={`text-xs px-3 py-1 rounded-full font-semibold ${d.status === '적정' ? 'bg-green-900/40 text-green-400 border border-green-800' : d.status === '과열' ? 'bg-red-900/40 text-red-400 border border-red-800' : d.status === '저평가' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 'bg-yellow-900/40 text-yellow-400 border border-yellow-800'}`}>{d.status}</span></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className="text-xs text-c-text2 mb-1">해외(Binance)</div><div className="font-bold text-base text-c-text">{formatUSD(d.binanceUSD)}</div><div className="text-sm text-c-text2 mt-0.5">{formatFullKRW(d.binanceKRW)}</div></div>
            <div className="bg-c-bg border border-c-border rounded-xl p-4"><div className="text-xs text-c-text2 mb-1">한국(Upbit)</div><div className="font-bold text-base text-c-text">{formatFullKRW(d.upbitKRW)}</div></div>
          </div>
          <div className="mt-2.5 bg-c-bg border border-c-border rounded-xl p-4 text-center"><span className="text-xs text-c-text2">김프: </span><span className={`font-bold ${d.kimchiPercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>{d.kimchiPercent >= 0 ? '+' : ''}{d.kimchiPercent.toFixed(2)}%</span><span className="text-xs text-c-text2 ml-2">({d.kimchiAmount >= 0 ? '+' : ''}{formatFullKRW(d.kimchiAmount)})</span></div>
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
      <div className="flex gap-1.5 overflow-x-auto pb-2">{types.map(c => <button key={c.id} onClick={() => setCalcType(c.id)} className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${calcType === c.id ? 'bg-[#3182F6] text-white' : 'bg-c-bg text-c-text2 border border-c-border'}`}>{c.label}</button>)}</div>
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
  return (<div className="bg-c-card rounded-lg p-5 border border-c-border space-y-3"><h3 className="font-bold text-base text-c-text">복리 계산기</h3><div><label className="text-sm text-c-text2 font-medium">초기 투자금</label><input type="number" value={init} onChange={e=>setInit(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">월 적립액</label><input type="number" value={mo} onChange={e=>setMo(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">연 수익률 (%)</label><input type="number" value={r} onChange={e=>setR(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">기간 (년)</label><input type="number" value={y} onChange={e=>setY(e.target.value)} /></div><div className="bg-c-bg border border-c-border rounded-lg p-4 space-y-1.5"><div className="flex justify-between text-sm"><span className="text-c-text2">최종 금액</span><span className="font-bold text-[#3182F6]">{formatKRW(result.total)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">총 투자금</span><span className="font-medium text-c-text">{formatKRW(result.invested)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">수익금</span><span className="font-bold text-green-500">{formatKRW(result.profit)}</span></div></div></div>);
}

function BreakevenCalc() {
  const [buy, setBuy] = useState(''); const [cur, setCur] = useState('');
  const pnl = buy && cur ? ((parseFloat(cur)-parseFloat(buy))/parseFloat(buy)*100) : 0;
  const need = buy && cur && parseFloat(cur) < parseFloat(buy) ? ((parseFloat(buy)-parseFloat(cur))/parseFloat(cur)*100) : 0;
  return (<div className="bg-c-card rounded-lg p-5 border border-c-border space-y-3"><h3 className="font-bold text-base text-c-text">손익분기점 계산기</h3><div><label className="text-sm text-c-text2 font-medium">매수가</label><input type="number" value={buy} onChange={e=>setBuy(e.target.value)} placeholder="매수가" /></div><div><label className="text-sm text-c-text2 font-medium">현재가</label><input type="number" value={cur} onChange={e=>setCur(e.target.value)} placeholder="현재가" /></div>{buy&&cur&&<div className="bg-c-bg border border-c-border rounded-lg p-4"><div className="flex justify-between text-sm"><span className="text-c-text2">현재 수익률</span><span className={`font-bold ${pnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(pnl)}</span></div>{need>0&&<div className="flex justify-between text-sm mt-1"><span className="text-c-text2">본전까지</span><span className="font-bold text-orange-500">+{need.toFixed(2)}%</span></div>}</div>}</div>);
}

function DividendCalc() {
  const [amt, setAmt] = useState('100000000'); const [dr, setDr] = useState('5'); const [tgt, setTgt] = useState('5000000');
  const annual = (parseFloat(amt)||0)*(parseFloat(dr)||0)/100; const monthly = annual/12; const needed = (parseFloat(tgt)||0)*12/((parseFloat(dr)||1)/100);
  return (<div className="bg-c-card rounded-lg p-5 border border-c-border space-y-3"><h3 className="font-bold text-base text-c-text">배당 계산기</h3><div><label className="text-sm text-c-text2 font-medium">투자금</label><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">배당률 (%)</label><input type="number" value={dr} onChange={e=>setDr(e.target.value)} /></div><div className="bg-c-bg border border-c-border rounded-lg p-4 space-y-1.5"><div className="flex justify-between text-sm"><span className="text-c-text2">연 배당</span><span className="font-bold text-c-text">{formatFullKRW(annual)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">월 배당</span><span className="font-bold text-green-500">{formatFullKRW(monthly)}</span></div></div><div className="border-t border-c-border pt-3"><div><label className="text-sm text-c-text2 font-medium">목표 월 배당</label><input type="number" value={tgt} onChange={e=>setTgt(e.target.value)} /></div><div className="bg-c-bg border border-c-border rounded-lg p-4 mt-2"><div className="flex justify-between text-sm"><span className="text-c-text2">필요 투자금</span><span className="font-bold text-[#3182F6]">{formatKRW(needed)}</span></div></div></div></div>);
}

function AveragingCalc() {
  const [cs, setCs] = useState('10000'); const [ca, setCa] = useState('1.02'); const [cp, setCp] = useState('0.85'); const [as2, setAs] = useState('5000'); const [ap, setAp] = useState('0.85');
  const ts = (parseInt(cs)||0)+(parseInt(as2)||0);
  const na = ts > 0 ? ((parseInt(cs)||0)*(parseFloat(ca)||0)+(parseInt(as2)||0)*(parseFloat(ap)||0))/ts : 0;
  const curPnl = ((parseFloat(cp)||0)-(parseFloat(ca)||0))/(parseFloat(ca)||1)*100;
  const newPnl = ((parseFloat(cp)||0)-na)/(na||1)*100;
  return (<div className="bg-c-card rounded-lg p-5 border border-c-border space-y-3"><h3 className="font-bold text-base text-c-text">물타기 계산기</h3><div className="grid grid-cols-2 gap-2"><div><label className="text-sm text-c-text2 font-medium">현재 수량</label><input type="number" value={cs} onChange={e=>setCs(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">평균단가</label><input type="number" step="0.01" value={ca} onChange={e=>setCa(e.target.value)} /></div></div><div><label className="text-sm text-c-text2 font-medium">현재가</label><input type="number" step="0.01" value={cp} onChange={e=>setCp(e.target.value)} /></div><div className="border-t border-c-border pt-3"><div className="text-xs font-bold text-c-text2 mb-2">추가 매수</div><div className="grid grid-cols-2 gap-2"><div><label className="text-sm text-c-text2 font-medium">추가 수량</label><input type="number" value={as2} onChange={e=>setAs(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">매수 가격</label><input type="number" step="0.01" value={ap} onChange={e=>setAp(e.target.value)} /></div></div></div><div className="bg-c-bg border border-c-border rounded-lg p-4 space-y-1.5"><div className="flex justify-between text-sm"><span className="text-c-text2">현재 평단</span><span className="font-semibold text-c-text">{formatUSD(parseFloat(ca))}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">새 평단</span><span className="font-bold text-[#3182F6]">{formatUSD(na)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">현재 수익률</span><span className={`font-semibold ${curPnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(curPnl)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">물타기 후</span><span className={`font-bold ${newPnl>=0?'text-green-500':'text-red-500'}`}>{formatPercent(newPnl)}</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">총 수량</span><span className="font-semibold text-c-text">{formatNumber(ts)}주</span></div></div><div className="bg-c-bg border border-c-border rounded-lg p-4"><div className="text-xs font-bold text-red-400 mb-1">주의사항</div><ul className="text-xs text-red-400 space-y-0.5"><li>• 물타기는 추가 손실 위험이 있습니다</li><li>• 단계적 분할 매수를 권장합니다</li></ul></div></div>);
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
  return (<div className="bg-c-card rounded-lg p-5 border border-c-border space-y-3"><h3 className="font-bold text-base text-c-text">목표 자산 계산기</h3><div><label className="text-sm text-c-text2 font-medium">목표 금액</label><input type="number" value={t} onChange={e=>setT(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">현재 자산</label><input type="number" value={c} onChange={e=>setC(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">월 저축액</label><input type="number" value={m} onChange={e=>setM(e.target.value)} /></div><div><label className="text-sm text-c-text2 font-medium">연 수익률 (%)</label><input type="number" value={r} onChange={e=>setR(e.target.value)} /></div>{result&&<div className="bg-c-bg border border-c-border rounded-lg p-4 space-y-1.5"><div className="flex justify-between text-sm"><span className="text-c-text2">달성 기간</span><span className="font-bold text-purple-400">{result.years}년 ({result.months}개월)</span></div><div className="flex justify-between text-sm"><span className="text-c-text2">예상 달성일</span><span className="font-semibold text-c-text">{result.date}</span></div></div>}</div>);
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
    <div className="bg-c-bg border border-c-border rounded-xl p-4 space-y-2.5">
      <div className="text-sm font-bold text-c-text flex items-center gap-1.5"><Calculator size={14} className="text-[#3182F6]" /> 물타기 계산기</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-c-text2">
        <div>현재 {formatNumber(stock.shares)}주</div><div>평단 ${stock.avgPrice.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">추가 수량</label><input type="number" value={addShares} onChange={e => setAddShares(e.target.value)} placeholder="주수" /></div>
        <div><label className="text-xs text-c-text2">매수 가격</label><input type="number" step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="$" /></div>
      </div>
      {as2 > 0 && ap > 0 && (
        <div className="bg-c-card border border-c-border rounded-lg p-3 space-y-1.5 text-sm">
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
    <div className="bg-c-bg border border-c-border rounded-xl p-4 space-y-2.5">
      <div className="text-sm font-bold text-c-text flex items-center gap-1.5"><DollarSign size={14} className="text-green-500" /> 수익 계산기</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-c-text2">
        <div>보유 {formatNumber(stock.shares)}주</div><div>평단 ${stock.avgPrice.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">매도 가격</label><input type="number" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="$" /></div>
        <div><label className="text-xs text-c-text2">매도 수량</label><input type="number" value={sellShares} onChange={e => setSellShares(e.target.value)} placeholder={`전량 ${stock.shares}`} /></div>
      </div>
      {sp > 0 && (
        <div className="bg-c-card border border-c-border rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-c-text2">매도 총액</span><span className="font-semibold text-c-text">${totalSell.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">손익 (USD)</span><span className={`font-bold ${profitUSD >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">손익 (KRW)</span><span className={`font-bold ${profitKRW >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitKRW >= 0 ? '+' : ''}{formatFullKRW(profitKRW)}</span></div>
          <div className="flex justify-between"><span className="text-c-text2">수익률</span><span className={`font-bold text-lg ${profitPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%</span></div>
        </div>
      )}
    </div>
  );
}

function CalendarSection() {
  const today = new Date().toISOString().split('T')[0];
  const thisWeek = ECONOMIC_CALENDAR.filter(e => { const d = new Date(e.date), n = new Date(), w = new Date(n); w.setDate(w.getDate()+7); return d >= n && d <= w; });
  const nextWeek = ECONOMIC_CALENDAR.filter(e => { const d = new Date(e.date), n = new Date(), s = new Date(n); s.setDate(s.getDate()+7); const w = new Date(n); w.setDate(w.getDate()+14); return d > s && d <= w; });
  const renderEvent = (e, i) => (<div key={i} className="flex items-center gap-3 py-3.5 border-b border-c-border last:border-0"><div className="text-center min-w-[55px]"><div className="text-sm text-c-text2 font-medium">{e.date.substring(5)}</div><div className="text-sm text-c-text3">{e.time}</div></div><div className="flex-1"><div className="text-base font-semibold text-c-text">{e.name}</div><div className="text-sm text-c-text2">예상: {e.forecast} | 전월: {e.previous}</div></div><div className="flex gap-0.5">{Array.from({length: e.importance}, (_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${e.importance >= 4 ? 'bg-[#FF4757]' : e.importance >= 3 ? 'bg-[#FF9F43]' : 'bg-[#FFD93D]'}`} />)}</div></div>);

  return (<div className="space-y-4"><div className="bg-c-card rounded-lg p-5 border border-c-border"><h3 className="font-bold text-base mb-4 text-c-text">이번주 주요 지표</h3>{thisWeek.length > 0 ? thisWeek.map(renderEvent) : <div className="text-sm text-c-text2 text-center py-6">이번주 일정 없음</div>}</div><div className="bg-c-card rounded-lg p-5 border border-c-border"><h3 className="font-bold text-base mb-4 text-c-text">다음주 일정</h3>{nextWeek.length > 0 ? nextWeek.map(renderEvent) : <div className="text-sm text-c-text2 text-center py-6">다음주 일정 없음</div>}</div></div>);
}

export default InvestTab;
