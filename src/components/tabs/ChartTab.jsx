import { useState, useEffect, useRef, useMemo } from 'react';
import { formatUSD, formatComma } from '../../utils/formatters';
import { fetchChartData } from '../../utils/api';
import { RefreshCw } from 'lucide-react';

const TIMEFRAMES = [
  { id: '4h', label: '4시간', interval: '1h', range: '10d' },
  { id: '1d', label: '일봉', interval: '1d', range: '6mo' },
  { id: '1w', label: '주봉', interval: '1wk', range: '2y' },
  { id: '1m', label: '월봉', interval: '1mo', range: '5y' },
];

const LOGO_COLORS = ['#3182F6','#00C48C','#FF9F43','#7C5CFC','#FF4757','#0ABDE3','#FF6B81','#2ED573'];
const getLogoColor = (sym) => LOGO_COLORS[sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

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

function StockChart({ stock, stockPrices, exchangeRate, hideAmounts }) {
  const [timeframe, setTimeframe] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const rate = exchangeRate || 1450;
  const price = stockPrices[stock.symbol]?.price || stock.avgPrice;
  const change = stockPrices[stock.symbol]?.changePercent || 0;
  const pnlPercent = stock.avgPrice > 0 ? ((price - stock.avgPrice) / stock.avgPrice * 100) : 0;
  const valueKRW = stock.shares * price * rate;

  useEffect(() => {
    setLoading(true);
    setChartData([]);
    const tf = TIMEFRAMES.find(t => t.id === timeframe) || TIMEFRAMES[1];
    fetchChartData(stock.symbol, tf.range, tf.interval)
      .then(d => { if (d.length > 0) setChartData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stock.symbol, timeframe]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getLogoColor(stock.symbol) }}>
            {stock.symbol.substring(0, 2)}
          </div>
          <div>
            <div className="font-bold text-sm text-c-text">{stock.symbol}</div>
            <div className="text-[11px] text-c-text2">{stock.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-c-text">{hideAmounts ? '•••••' : formatUSD(price)}</div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`text-[11px] font-semibold ${change >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
            <span className="text-[10px] text-c-text3">|</span>
            <span className={`text-[11px] font-semibold ${pnlPercent >= 0 ? 'text-[#00C48C]' : 'text-[#FF4757]'}`}>
              {hideAmounts ? '•••••' : `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {TIMEFRAMES.map(tf => (
            <button key={tf.id} onClick={() => setTimeframe(tf.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                timeframe === tf.id ? 'bg-[#3182F6] text-white' : 'glass-inner text-c-text2'
              }`}>
              {tf.label}
            </button>
          ))}
        </div>
        {!hideAmounts && (
          <div className="text-[11px] text-c-text2">
            {stock.shares > 0 && <span>{formatComma(valueKRW)}원</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-c-text2 text-sm">
          <RefreshCw size={14} className="animate-spin mr-2" /> 로딩중...
        </div>
      ) : (
        <CrosshairChart data={chartData} />
      )}
    </div>
  );
}

function ChartTab({ portfolio, stockPrices, exchangeRate, hideAmounts }) {
  if (portfolio.length === 0) {
    return (
      <div className="glass flex-1 flex flex-col items-center justify-center text-c-text2 gap-2">
        <div className="text-sm font-medium">포트폴리오에 종목을 추가해주세요</div>
        <div className="text-xs text-c-text3">투자 탭에서 종목을 검색하고 추가할 수 있어요</div>
      </div>
    );
  }

  return (
    <div className="glass flex-1 flex flex-col">
      {portfolio.map((stock, idx) => (
        <div key={stock.symbol}>
          {idx > 0 && <div className="border-t border-c-border mx-5" />}
          <div className="px-5 py-4">
            <StockChart stock={stock} stockPrices={stockPrices} exchangeRate={exchangeRate} hideAmounts={hideAmounts} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChartTab;
