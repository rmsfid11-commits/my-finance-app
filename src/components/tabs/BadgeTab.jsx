import { useState, useMemo, useEffect, useRef } from 'react';
import { BADGE_DEFINITIONS, LEVEL_THRESHOLDS, BADGE_REWARDS } from '../../data/initialData';
import { useStore } from '../../store/useStore';
import { haptic, hapticSuccess } from '../../utils/haptic';
import { Lock, ChevronDown, ChevronUp, Gift, X } from 'lucide-react';

function BadgeTab() {
  const { badges, setBadges, transactions, portfolio, dividends, setToast } = useStore();
  const [expandedCat, setExpandedCat] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const prevCount = useRef(Object.keys(badges).length);

  const earned = useMemo(() => {
    const e = { ...badges };
    const today = new Date().toISOString().split('T')[0];
    if (!e['app_join']) e['app_join'] = { earned: true, earnedDate: today };
    if (transactions.length > 0 && !e['first_input']) e['first_input'] = { earned: true, earnedDate: today };
    if (portfolio.length > 0 && !e['invest_start']) e['invest_start'] = { earned: true, earnedDate: today };
    if (dividends.length > 0 && !e['dividend_start']) e['dividend_start'] = { earned: true, earnedDate: today };
    if (transactions.some(t => t.category === '강아지') && !e['pet_lover']) e['pet_lover'] = { earned: true, earnedDate: today };
    if (transactions.some(t => t.category === '식비') && !e['food_start']) e['food_start'] = { earned: true, earnedDate: today };
    const days = new Set(transactions.map(t => t.date)).size;
    if (days >= 7 && !e['record_7']) e['record_7'] = { earned: true, earnedDate: today };
    return e;
  }, [badges, transactions, portfolio, dividends]);

  useEffect(() => {
    const newCount = Object.keys(earned).length;
    if (newCount > prevCount.current) {
      const newBadgeIds = Object.keys(earned).filter(k => !badges[k]);
      const newBadge = BADGE_DEFINITIONS.find(b => newBadgeIds.includes(b.id));
      if (newBadge) { setCelebration(newBadge); hapticSuccess(); }
      setBadges(earned);
    }
    prevCount.current = newCount;
  }, [earned]);

  const earnedCount = Object.values(earned).filter(b => b.earned).length;
  const currentLevel = LEVEL_THRESHOLDS.find(l => earnedCount >= l.min && earnedCount <= l.max) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.min > earnedCount);
  const nextReward = BADGE_REWARDS.find(r => r.count > earnedCount);

  const cats = useMemo(() => {
    const c = {};
    BADGE_DEFINITIONS.forEach(b => { if (!c[b.category]) c[b.category] = []; c[b.category].push({ ...b, isEarned: earned[b.id]?.earned || false, earnedDate: earned[b.id]?.earnedDate }); });
    return c;
  }, [earned]);

  const recent = useMemo(() => BADGE_DEFINITIONS.filter(b => earned[b.id]?.earned).map(b => ({ ...b, earnedDate: earned[b.id].earnedDate })).sort((a, b) => (b.earnedDate || '').localeCompare(a.earnedDate || '')).slice(0, 3), [earned]);

  return (
    <div className="flex-1 flex flex-col animate-slide">
      {/* 축하 팝업 */}
      {celebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade" onClick={() => setCelebration(null)}>
          <div className="confetti-bg absolute inset-0 pointer-events-none" />
          <div className="relative glass rounded-3xl p-8 mx-6 max-w-sm text-center animate-pop" onClick={e => e.stopPropagation()}>
            <button onClick={() => setCelebration(null)} className="absolute top-3 right-3 text-c-text3"><X size={18} /></button>
            <div className="w-20 h-20 rounded-full bg-[#FF9F43]/20 flex items-center justify-center mx-auto mb-4 animate-bounce-badge">
              <span className="text-3xl">{celebration.icon}</span>
            </div>
            <div className="text-lg font-bold text-c-text mb-1">배지 획득!</div>
            <div className="text-xl font-black text-[#FF9F43] mb-2">{celebration.name}</div>
            <div className="text-sm text-c-text2 mb-5">{celebration.desc}</div>
            <button onClick={() => setCelebration(null)} className="btn-primary w-full">확인</button>
          </div>
        </div>
      )}
      <div className="glass flex-1 flex flex-col">

        {/* 배지 현황 */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-4"><div className="w-16 h-16 rounded-full glass-inner flex items-center justify-center"><span className="text-[#FF9F43] text-2xl font-bold">{earnedCount}</span></div><div><div className="text-3xl font-bold text-c-text">{earnedCount} / {BADGE_DEFINITIONS.length}</div><div className="text-sm text-c-text2 font-medium">배지 획득</div></div></div>
          <div className="glass-inner rounded-2xl p-4"><div className="flex justify-between text-sm mb-1.5"><span className="text-c-text">현재 레벨</span><span className="font-bold text-[#FF9F43]">{currentLevel.name}</span></div><div className="h-2.5 glass-inner rounded-full overflow-hidden"><div className="h-full bg-[#FF9F43] rounded-full transition-all duration-500" style={{width:`${nextLevel?((earnedCount-currentLevel.min)/(nextLevel.min-currentLevel.min))*100:100}%`}} /></div>{nextLevel && <div className="text-xs text-c-text2 mt-1.5">다음 레벨({nextLevel.name})까지 {nextLevel.min-earnedCount}개</div>}</div>
        </div>

        {/* 다음 보상 */}
        {nextReward && (<>
          <div className="border-t border-c-border mx-5" />
          <div className="px-5 py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center"><Gift size={20} className="text-purple-500" /></div><div className="flex-1"><div className="text-sm font-bold text-c-text">다음 보상</div><div className="text-xs text-c-text2">{nextReward.count}개 달성 시: {nextReward.reward}</div></div><div className="text-sm font-bold text-purple-400">{nextReward.count-earnedCount}개 남음</div></div>
        </>)}

        {/* 최근 획득 */}
        {recent.length > 0 && (<>
          <div className="border-t border-c-border mx-5" />
          <div className="px-5 py-4"><h2 className="text-sm font-bold mb-4 text-c-text">최근 획득 배지</h2><div className="flex gap-3">{recent.map(b => <div key={b.id} className="flex-1 text-center glass-inner rounded-2xl p-4"><div className="w-10 h-10 rounded-full mx-auto mb-1.5 bg-[#FF9F43]/15 flex items-center justify-center text-lg">{b.icon}</div><div className="text-xs font-bold text-c-text">{b.name}</div><div className="text-[10px] text-c-text2 mt-0.5">{b.earnedDate}</div></div>)}</div></div>
        </>)}

        <div className="border-t border-c-border mx-5" />

        {/* 배지 카테고리 */}
        {Object.entries(cats).map(([cat, list]) => {
          const ce = list.filter(b => b.isEarned).length; const isExp = expandedCat === cat;
          return (<div key={cat}>
            <button onClick={() => setExpandedCat(isExp ? null : cat)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-c-subtle transition-colors"><div className="flex items-center gap-2"><span className="text-sm font-bold text-c-text">{cat}</span><span className="text-xs text-c-text2 font-medium">({ce}/{list.length})</span></div>{isExp ? <ChevronUp size={16} className="text-c-text2" /> : <ChevronDown size={16} className="text-c-text2" />}</button>
            {isExp && <div className="px-5 pb-4 grid grid-cols-3 gap-2.5">{list.map(b => <div key={b.id} className={`text-center p-4 rounded-2xl transition-all ${b.isEarned ? 'bg-[#FF9F43]/8 border border-[#FF9F43]/20' : 'glass-inner opacity-40'}`}><div className="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold" style={b.isEarned ? {backgroundColor: 'rgba(255,159,67,0.15)', color: '#FF9F43'} : {}}>{b.isEarned ? <span className="text-lg">{b.icon}</span> : <Lock size={18} className="text-c-text2" />}</div><div className="text-xs font-bold text-c-text">{b.name}</div><div className="text-[10px] text-c-text2 mt-0.5">{b.desc}</div></div>)}</div>}
            <div className="border-t border-c-border mx-5" />
          </div>);
        })}

        {/* 레벨 시스템 */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold mb-4 text-c-text">레벨 시스템</h2>
          <div className="space-y-2">{LEVEL_THRESHOLDS.map(l => <div key={l.name} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentLevel.name===l.name?'bg-[#FF9F43]/8 border border-[#FF9F43]/20':''}`}><div className="w-4 h-4 rounded-full" style={{backgroundColor:l.color}} /><span className="text-sm font-semibold flex-1 text-c-text">{l.name}</span><span className="text-xs text-c-text2">{l.min}-{l.max}개</span>{currentLevel.name===l.name&&<span className="text-xs bg-[#FF9F43] text-white px-2.5 py-0.5 rounded-full font-semibold">현재</span>}</div>)}</div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 배지 보상 */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold mb-4 text-c-text">배지 보상</h2>
          <div className="space-y-2">{BADGE_REWARDS.map(r => <div key={r.count} className={`flex items-center gap-3 p-3 rounded-2xl ${earnedCount>=r.count?'bg-[#00C48C]/8':'glass-inner'}`}><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${earnedCount>=r.count?'bg-[#00C48C] text-white':'bg-gray-300 text-white'}`}>{earnedCount>=r.count?'✓':r.count}</div><span className={`text-sm flex-1 font-medium ${earnedCount>=r.count?'text-[#00C48C]':'text-c-text2'}`}>{r.reward}</span><span className="text-xs text-c-text2">{r.count}개</span></div>)}</div>
        </div>

      </div>
    </div>
  );
}

export default BadgeTab;
