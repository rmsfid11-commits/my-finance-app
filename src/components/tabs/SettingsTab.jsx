import { useState, useRef } from 'react';
import { formatFullKRW } from '../../utils/formatters';
import { CATEGORIES } from '../../data/initialData';
import { User, Target, CreditCard, Bell, Database, ChevronRight, Download, Upload, FileSpreadsheet, Trash2, Save, Sun, Moon } from 'lucide-react';

function SettingsTab({ profile, setProfile, goals, setGoals, budget, setBudget, settings, setSettings, transactions, portfolio, dividends, fixedExpenses, badges, theme, setTheme }) {
  const [activeSection, setActiveSection] = useState(null);
  const fileInputRef = useRef(null);

  const handleBackup = () => {
    const data = { profile, goals, budget, settings, transactions, portfolio, dividends, fixedExpenses, badges, exportDate: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const handleRestore = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (d.profile) setProfile(d.profile); if (d.goals) setGoals(d.goals); if (d.budget) setBudget(d.budget); if (d.settings) setSettings(d.settings); alert('복원 완료!'); } catch { alert('파일을 읽을 수 없습니다.'); } };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const h = '날짜,시간,금액,카테고리,장소,메모,결제수단\n';
    const r = transactions.map(t => `${t.date},${t.time},${t.amount},${t.category},${t.place||''},${t.memo||''},${t.payment||''}`).join('\n');
    const blob = new Blob(['\ufeff' + h + r], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `가계부-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const sections = [
    { id: 'profile', label: '프로필 설정', Icon: User, desc: `${profile.name} · ${profile.age}세 · ${profile.job}` },
    { id: 'goals', label: '목표 설정', Icon: Target, desc: `저축 ${formatFullKRW(goals.savingGoal)}/월` },
    { id: 'budget', label: '예산 설정', Icon: CreditCard, desc: `총 ${formatFullKRW(Object.values(budget).reduce((s, v) => s + v, 0))}/월` },
    { id: 'notifications', label: '알림 설정', Icon: Bell, desc: '알림 관리' },
    { id: 'data', label: '데이터 관리', Icon: Database, desc: '백업 · 복원 · 내보내기' },
  ];

  return (
    <div className="space-y-4 animate-slide">
      {/* 테마 전환 */}
      <div className="bg-c-card border border-c-border rounded-lg p-5">
        <h3 className="text-base font-bold text-c-text mb-4">테마</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setTheme('black')} className={`flex items-center justify-center gap-2.5 p-4 rounded-lg text-base font-semibold transition-all ${theme === 'black' ? 'bg-[#0D1117] text-white border-2 border-[#3182F6] shadow-lg shadow-blue-500/20' : 'bg-c-bg text-c-text2 border border-c-border'}`}>
            <Moon size={20} /> Black
          </button>
          <button onClick={() => setTheme('notion')} className={`flex items-center justify-center gap-2.5 p-4 rounded-lg text-base font-semibold transition-all ${theme === 'notion' ? 'bg-[#F7F6F3] text-[#37352F] border-2 border-[#3182F6] shadow-lg shadow-blue-500/20' : 'bg-c-bg text-c-text2 border border-c-border'}`}>
            <Sun size={20} /> Notion
          </button>
        </div>
      </div>

      <div className="bg-c-card border border-c-border rounded-lg overflow-hidden">
        {sections.map(({ id, label, Icon, desc }, idx) => (
          <button key={id} onClick={() => setActiveSection(activeSection === id ? null : id)} className={`w-full flex items-center gap-3 p-4 text-left transition-all ${idx < sections.length - 1 ? 'border-b border-c-border' : ''} ${activeSection === id ? 'bg-[#3182F6]/5' : 'hover:bg-c-bg'}`}>
            <div className="w-10 h-10 rounded-full bg-[#3182F6]/8 flex items-center justify-center"><Icon size={20} className="text-[#3182F6]" /></div>
            <div className="flex-1"><div className="text-sm font-bold text-c-text">{label}</div><div className="text-xs text-c-text2">{desc}</div></div>
            <ChevronRight size={16} className={`text-c-text3 transition-transform ${activeSection === id ? 'rotate-90' : ''}`} />
          </button>
        ))}
      </div>

      {activeSection === 'profile' && (
        <div className="bg-c-card border border-c-border rounded-lg p-5 space-y-3 animate-fade"><h3 className="font-bold text-sm text-c-text">프로필 설정</h3>
          <div><label className="text-xs text-c-text2 font-medium">이름</label><input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-c-text2 font-medium">나이</label><input type="number" value={profile.age} onChange={e => setProfile({...profile, age: parseInt(e.target.value)})} /></div><div><label className="text-xs text-c-text2 font-medium">직업</label><input type="text" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})} /></div></div>
          <div><label className="text-xs text-c-text2 font-medium">월급</label><input type="number" value={profile.salary} onChange={e => setProfile({...profile, salary: parseInt(e.target.value)})} /></div>
          <div><label className="text-xs text-c-text2 font-medium">거주 형태</label><select value={profile.housing} onChange={e => setProfile({...profile, housing: e.target.value})}><option value="월세">월세</option><option value="전세">전세</option><option value="자가">자가</option><option value="기타">기타</option></select></div>
          <div className="bg-[#00C48C]/8 border border-[#00C48C]/15 rounded-lg p-4 text-xs text-[#00C48C] flex items-center gap-2"><Save size={14} /> 변경사항은 자동으로 저장됩니다</div>
        </div>
      )}

      {activeSection === 'goals' && (
        <div className="bg-c-card border border-c-border rounded-lg p-5 space-y-3 animate-fade"><h3 className="font-bold text-sm text-c-text">목표 설정</h3>
          <div><label className="text-xs text-c-text2 font-medium">월 저축 목표</label><input type="number" value={goals.savingGoal} onChange={e => setGoals({...goals, savingGoal: parseInt(e.target.value)})} /><div className="text-xs text-c-text2 mt-1">월급의 {(goals.savingGoal / profile.salary * 100).toFixed(0)}%</div></div>
          <div><label className="text-xs text-c-text2 font-medium">월 배당 목표</label><input type="number" value={goals.dividendGoal} onChange={e => setGoals({...goals, dividendGoal: parseInt(e.target.value)})} /></div>
          <div><label className="text-xs text-c-text2 font-medium">순자산 목표</label><input type="number" value={goals.netWorthGoal} onChange={e => setGoals({...goals, netWorthGoal: parseInt(e.target.value)})} /></div>
        </div>
      )}

      {activeSection === 'budget' && (
        <div className="bg-c-card border border-c-border rounded-lg p-5 space-y-3 animate-fade"><h3 className="font-bold text-sm text-c-text">카테고리별 월 예산</h3>
          {CATEGORIES.map(cat => <div key={cat}><label className="text-xs text-c-text2 font-medium">{cat}</label><input type="number" value={budget[cat] || ''} onChange={e => setBudget({...budget, [cat]: parseInt(e.target.value) || 0})} /></div>)}
          <div className="bg-c-bg border border-c-border rounded-lg p-4"><div className="flex justify-between text-sm"><span className="font-medium text-c-text">총 예산</span><span className="font-bold text-[#3182F6]">{formatFullKRW(Object.values(budget).reduce((s, v) => s + v, 0))}</span></div></div>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="bg-c-card border border-c-border rounded-lg p-5 space-y-3 animate-fade"><h3 className="font-bold text-sm text-c-text">알림 설정</h3>
          {[{ key: 'fixedExpense', label: '고정지출 알림' }, { key: 'budgetOver', label: '예산 초과 알림' }, { key: 'economic', label: '경제지표 알림' }, { key: 'badge', label: '배지 획득 알림' }, { key: 'report', label: '주간/월간 리포트' }].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2.5"><span className="text-sm font-medium text-c-text">{item.label}</span>
              <button onClick={() => setSettings({...settings, notifications: {...settings.notifications, [item.key]: !settings.notifications[item.key]}})} className={`w-14 h-7 rounded-full transition-all relative ${settings.notifications[item.key] ? 'bg-[#3182F6]' : 'bg-c-subtle'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${settings.notifications[item.key] ? 'translate-x-7' : 'translate-x-0.5'}`} /></button>
            </div>
          ))}
          <div className="border-t border-c-border pt-3"><div className="flex items-center justify-between py-2.5"><span className="text-sm font-medium text-c-text">SMS 자동인식</span><button onClick={() => setSettings({...settings, smsAutoDetect: !settings.smsAutoDetect})} className={`w-14 h-7 rounded-full transition-all relative ${settings.smsAutoDetect ? 'bg-[#3182F6]' : 'bg-c-subtle'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${settings.smsAutoDetect ? 'translate-x-7' : 'translate-x-0.5'}`} /></button></div></div>
        </div>
      )}

      {activeSection === 'data' && (
        <div className="bg-c-card border border-c-border rounded-lg p-5 space-y-3 animate-fade"><h3 className="font-bold text-sm text-c-text">데이터 관리</h3>
          <button onClick={handleBackup} className="w-full flex items-center gap-3 p-4 bg-[#3182F6]/8 border border-[#3182F6]/15 rounded-lg text-sm font-semibold text-[#3182F6] transition-shadow"><Download size={18} /> JSON 백업 다운로드</button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-[#00C48C]/8 border border-[#00C48C]/15 rounded-lg text-sm font-semibold text-[#00C48C] transition-shadow"><Upload size={18} /> 백업 파일 복원</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
          <button onClick={handleExportCSV} className="w-full flex items-center gap-3 p-4 bg-[#7C5CFC]/8 border border-[#7C5CFC]/15 rounded-lg text-sm font-semibold text-[#7C5CFC] transition-shadow"><FileSpreadsheet size={18} /> 엑셀(CSV)로 내보내기</button>
          <div className="border-t border-c-border pt-3"><button onClick={() => { if (confirm('정말 모든 데이터를 삭제하시겠습니까?')) { localStorage.clear(); location.reload(); } }} className="w-full flex items-center gap-3 p-4 bg-[#FF4757]/8 border border-[#FF4757]/15 rounded-lg text-sm font-semibold text-[#FF4757] transition-shadow"><Trash2 size={18} /> 모든 데이터 초기화</button></div>
        </div>
      )}

      <div className="text-center py-6"><div className="text-xs text-c-text3 font-medium">MyFinance v1.0</div><div className="text-xs text-c-text3">개인 재무관리 앱</div></div>
    </div>
  );
}

export default SettingsTab;
