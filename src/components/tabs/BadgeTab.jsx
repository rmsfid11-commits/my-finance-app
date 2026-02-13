import { useState, useMemo } from 'react';
import { BADGE_DEFINITIONS, LEVEL_THRESHOLDS, BADGE_REWARDS } from '../../data/initialData';
import { Lock, ChevronDown, ChevronUp, Gift } from 'lucide-react';

function BadgeTab({ badges, setBadges, transactions, portfolio, dividends }) {
  const [expandedCat, setExpandedCat] = useState(null);

  const earned = useMemo(() => {
    const e = { ...badges };
    if (!e['app_join']) e['app_join'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    if (transactions.length > 0 && !e['first_input']) e['first_input'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    if (portfolio.length > 0 && !e['invest_start']) e['invest_start'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    if (dividends.length > 0 && !e['dividend_start']) e['dividend_start'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    if (transactions.some(t => t.category === '강아지') && !e['pet_lover']) e['pet_lover'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    if (transactions.some(t => t.category === '식비') && !e['food_start']) e['food_start'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    const days = new Set(transactions.map(t => t.date)).size;
    if (days >= 7 && !e['record_7']) e['record_7'] = { earned: true, earnedDate: new Date().toISOString().split('T')[0] };
    return e;
  }, [badges, transactions, portfolio, dividends]);

  useMemo(() => { if (Object.keys(earned).length > Object.keys(badges).length) setBadges(earned); }, [earned]);

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
    <div className="space-y-4 animate-slide">
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4 relative z-10"><div className="w-16 h-16 rounded-full glass-inner flex items-center justify-center"><span className="text-[#FF9F43] text-2xl font-bold">{earnedCount}</span></div><div><div className="text-3xl font-bold text-c-text">{earnedCount} / {BADGE_DEFINITIONS.length}</div><div className="text-sm text-c-text2 font-medium">배지 획득</div></div></div>
        <div className="glass-inner rounded-2xl p-4 relative z-10"><div className="flex justify-between text-sm mb-1.5"><span className="text-c-text">현재 레벨</span><span className="font-bold text-[#FF9F43]">{currentLevel.name}</span></div><div className="h-2.5 glass-inner rounded-full overflow-hidden"><div className="h-full bg-[#FF9F43] rounded-full transition-all duration-500" style={{width:`${nextLevel?((earnedCount-currentLevel.min)/(nextLevel.min-currentLevel.min))*100:100}%`}} /></div>{nextLevel && <div className="text-xs text-c-text2 mt-1.5">다음 레벨({nextLevel.name})까지 {nextLevel.min-earnedCount}개</div>}</div>
      </div>

      {nextReward && <div className="glass rounded-3xl p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center"><Gift size={20} className="text-purple-500" /></div><div className="flex-1"><div className="text-sm font-bold text-c-text">다음 보상</div><div className="text-xs text-c-text2">{nextReward.count}개 달성 시: {nextReward.reward}</div></div><div className="text-sm font-bold text-purple-400">{nextReward.count-earnedCount}개 남음</div></div>}

      {recent.length > 0 && <div className="glass rounded-3xl p-5"><h3 className="font-bold text-sm mb-4 text-c-text">최근 획득 배지</h3><div className="flex gap-3">{recent.map(b => <div key={b.id} className="flex-1 text-center glass-inner rounded-2xl p-4"><div className="w-10 h-10 rounded-full mx-auto mb-1.5 bg-[#FF9F43]/15 flex items-center justify-center text-sm font-bold text-[#FF9F43]">{b.name[0]}</div><div className="text-xs font-bold text-c-text">{b.name}</div><div className="text-[10px] text-c-text2 mt-0.5">{b.earnedDate}</div></div>)}</div></div>}

      <div className="space-y-2">{Object.entries(cats).map(([cat, list]) => {
        const ce = list.filter(b => b.isEarned).length; const isExp = expandedCat === cat;
        return (<div key={cat} className="glass rounded-3xl overflow-hidden"><button onClick={() => setExpandedCat(isExp ? null : cat)} className="w-full flex items-center justify-between p-4 hover:bg-c-subtle transition-colors"><div className="flex items-center gap-2"><span className="text-sm font-bold text-c-text">{cat}</span><span className="text-xs text-c-text2 font-medium">({ce}/{list.length})</span></div>{isExp ? <ChevronUp size={16} className="text-c-text2" /> : <ChevronDown size={16} className="text-c-text2" />}</button>
          {isExp && <div className="px-4 pb-4 grid grid-cols-3 gap-2.5">{list.map(b => <div key={b.id} className={`text-center p-4 rounded-2xl transition-all ${b.isEarned ? 'bg-[#FF9F43]/8 border border-[#FF9F43]/20' : 'glass-inner opacity-40'}`}><div className="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold" style={b.isEarned ? {backgroundColor: 'rgba(255,159,67,0.15)', color: '#FF9F43'} : {}}>{b.isEarned ? b.name[0] : <Lock size={18} className="text-c-text2" />}</div><div className="text-xs font-bold text-c-text">{b.name}</div><div className="text-[10px] text-c-text2 mt-0.5">{b.desc}</div></div>)}</div>}
        </div>);
      })}</div>

      <div className="glass rounded-3xl p-5"><h3 className="font-bold text-sm mb-4 text-c-text">레벨 시스템</h3><div className="space-y-2">{LEVEL_THRESHOLDS.map(l => <div key={l.name} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentLevel.name===l.name?'bg-[#FF9F43]/8 border border-[#FF9F43]/20':''}`}><div className="w-4 h-4 rounded-full" style={{backgroundColor:l.color}} /><span className="text-sm font-semibold flex-1 text-c-text">{l.name}</span><span className="text-xs text-c-text2">{l.min}-{l.max}개</span>{currentLevel.name===l.name&&<span className="text-xs bg-[#FF9F43] text-white px-2.5 py-0.5 rounded-full font-semibold">현재</span>}</div>)}</div></div>

      <div className="glass rounded-3xl p-5"><h3 className="font-bold text-sm mb-4 text-c-text">배지 보상</h3><div className="space-y-2">{BADGE_REWARDS.map(r => <div key={r.count} className={`flex items-center gap-3 p-3 rounded-2xl ${earnedCount>=r.count?'bg-[#00C48C]/8':'glass-inner'}`}><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${earnedCount>=r.count?'bg-[#00C48C] text-white':'bg-gray-300 text-white'}`}>{earnedCount>=r.count?'✓':r.count}</div><span className={`text-sm flex-1 font-medium ${earnedCount>=r.count?'text-[#00C48C]':'text-c-text2'}`}>{r.reward}</span><span className="text-xs text-c-text2">{r.count}개</span></div>)}</div></div>
    </div>
  );
}

export default BadgeTab;
