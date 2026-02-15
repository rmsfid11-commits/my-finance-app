import { useState, useEffect, useMemo } from 'react';
import { formatPercent } from '../utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Banner({ marketData, exchangeRate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = useMemo(() => [
    { label: 'S&P 500', value: marketData?.sp500?.price?.toLocaleString('en-US', { maximumFractionDigits: 2 }), change: marketData?.sp500?.changePercent, loaded: !!marketData?.sp500 },
    { label: 'NASDAQ', value: marketData?.nasdaq?.price?.toLocaleString('en-US', { maximumFractionDigits: 2 }), change: marketData?.nasdaq?.changePercent, loaded: !!marketData?.nasdaq },
    { label: 'KOSPI', value: marketData?.kospi?.price?.toLocaleString('ko-KR', { maximumFractionDigits: 2 }), change: marketData?.kospi?.changePercent, loaded: !!marketData?.kospi },
    { label: 'USD/KRW', value: exchangeRate ? `₩${exchangeRate.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}` : null, change: null, loaded: !!exchangeRate },
    { label: 'Bitcoin', value: marketData?.btc?.price ? `$${marketData.btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : null, change: marketData?.btc?.changePercent, loaded: !!marketData?.btc }
  ], [marketData, exchangeRate]);

  useEffect(() => { const t = setInterval(() => setCurrentIndex(p => (p + 1) % items.length), 3000); return () => clearInterval(t); }, [items.length]);

  const current = items[currentIndex];
  const isUp = current?.change > 0;
  const isDown = current?.change < 0;

  return (
    <div className="glass text-white px-6 py-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentIndex(p => (p - 1 + items.length) % items.length)} className="p-1 text-c-text2 hover:text-white transition-colors shrink-0"><ChevronLeft size={16} /></button>
        <div className="led-panel rounded-3xl flex-1 mx-3 min-w-0 overflow-hidden">
          {/* 고정 높이: 슬라이드 전환시 레이아웃 시프트 방지 */}
          <div className="h-[72px] flex items-center justify-center">
            <div className="text-center animate-fade w-full px-4" key={currentIndex}>
              <div className="text-[10px] font-medium text-c-text2 mb-0.5 tracking-widest uppercase">{current.label}</div>
              {current.loaded ? (
                <>
                  <div className="text-xl font-bold neon-red truncate">{current.value}</div>
                  {current.change !== null ? (
                    <div className="mt-0.5 inline-flex items-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${isUp ? 'text-[#00C48C]' : isDown ? 'text-[#FF4757]' : 'text-c-text2'}`}
                        style={isUp ? { textShadow: '0 0 4px rgba(0,196,140,0.4)' } : isDown ? { textShadow: '0 0 4px rgba(255,71,87,0.4)' } : {}}>
                        {isUp ? '▲' : isDown ? '▼' : '−'} {formatPercent(current.change)}
                      </span>
                    </div>
                  ) : <div className="h-4" />}
                </>
              ) : <div className="text-sm text-c-text2">로딩중...</div>}
            </div>
          </div>
        </div>
        <button onClick={() => setCurrentIndex(p => (p + 1) % items.length)} className="p-1 text-c-text2 hover:text-white transition-colors shrink-0"><ChevronRight size={16} /></button>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {items.map((_, i) => <button key={i} onClick={() => setCurrentIndex(i)} className={`h-1 rounded-full transition-all ${i === currentIndex ? 'bg-[#FF1744] w-4' : 'bg-c-subtle w-1'}`} />)}
      </div>
    </div>
  );
}

export default Banner;
