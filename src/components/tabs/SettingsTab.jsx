import { useState, useRef } from 'react';
import { formatFullKRW } from '../../utils/formatters';
import { CATEGORIES } from '../../data/initialData';
import { useStore } from '../../store/useStore';
import { haptic } from '../../utils/haptic';
import PrivacyPolicy from '../PrivacyPolicy';
import { User, Target, CreditCard, Bell, Database, ChevronRight, Download, Upload, FileSpreadsheet, Trash2, Save, Sun, Moon, Waves, TreePine, Heart, Sparkles, LogOut, Cloud, CloudOff, Shield, FileText, BookOpen, History, X } from 'lucide-react';

function SettingsTab() {
  const { profile, setProfile, goals, setGoals, budget, setBudget, settings, setSettings, transactions, portfolio, dividends, fixedExpenses, badges, theme, setTheme, hideAmounts, setLastBackup, user, handleLogout } = useStore();
  const [activeSection, setActiveSection] = useState(null);
  const [policyType, setPolicyType] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const fileInputRef = useRef(null);

  const handleBackup = () => {
    const data = { profile, goals, budget, settings, transactions, portfolio, dividends, fixedExpenses, badges, exportDate: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
    if (setLastBackup) setLastBackup(new Date().toISOString());
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
    { id: 'goals', label: '목표 설정', Icon: Target, desc: `저축 ${hideAmounts ? '•••••' : formatFullKRW(goals.savingGoal)}/월` },
    { id: 'budget', label: '예산 설정', Icon: CreditCard, desc: `총 ${hideAmounts ? '•••••' : formatFullKRW(Object.values(budget).reduce((s, v) => s + v, 0))}/월` },
    { id: 'notifications', label: '알림 설정', Icon: Bell, desc: '알림 관리' },
    { id: 'data', label: '데이터 관리', Icon: Database, desc: '백업 · 복원 · 내보내기' },
  ];

  return (
    <div className="flex-1 flex flex-col animate-slide">
      <div className="glass flex-1 flex flex-col">

        {/* 테마 */}
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-c-text mb-4">테마</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'auto', label: 'Auto', Icon: Sun, bg: 'linear-gradient(135deg,#0D1117 50%,#F7F6F3 50%)', fg: '#3182F6' },
              { id: 'black', label: 'Black', Icon: Moon, bg: '#0D1117', fg: '#fff' },
              { id: 'notion', label: 'Notion', Icon: Sun, bg: '#F7F6F3', fg: '#37352F' },
              { id: 'ocean', label: 'Ocean', Icon: Waves, bg: '#0B1929', fg: '#CCD6F6' },
              { id: 'forest', label: 'Forest', Icon: TreePine, bg: '#0A1A0F', fg: '#D1E8D5' },
              { id: 'rose', label: 'Rose', Icon: Heart, bg: '#FFF5F5', fg: '#1A202C' },
              { id: 'midnight', label: 'Midnight', Icon: Sparkles, bg: '#13111C', fg: '#E0DEF4' },
            ].map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl text-sm font-semibold transition-all ${theme === t.id ? 'border-2 border-[#3182F6] shadow-lg shadow-blue-500/20' : 'glass-inner'}`} style={theme === t.id ? { background: t.bg, color: t.fg } : {}}>
                <t.Icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 설정 메뉴 */}
        {sections.map(({ id, label, Icon, desc }, idx) => (
          <div key={id}>
            <button onClick={() => setActiveSection(activeSection === id ? null : id)} className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${activeSection === id ? 'bg-[#3182F6]/5' : 'hover:bg-c-subtle'}`}>
              <div className="w-10 h-10 rounded-full bg-[#3182F6]/8 flex items-center justify-center"><Icon size={20} className="text-[#3182F6]" /></div>
              <div className="flex-1"><div className="text-sm font-bold text-c-text">{label}</div><div className="text-xs text-c-text2">{desc}</div></div>
              <ChevronRight size={16} className={`text-c-text3 transition-transform ${activeSection === id ? 'rotate-90' : ''}`} />
            </button>

            {activeSection === id && id === 'profile' && (
              <div className="px-5 pb-4 space-y-3 animate-fade">
                <div><label className="text-xs text-c-text2 font-medium">이름</label><input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-c-text2 font-medium">나이</label><input type="number" value={profile.age} onChange={e => setProfile({...profile, age: parseInt(e.target.value)})} /></div><div><label className="text-xs text-c-text2 font-medium">직업</label><input type="text" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})} /></div></div>
                <div><label className="text-xs text-c-text2 font-medium">월급</label><input type="number" value={profile.salary} onChange={e => setProfile({...profile, salary: parseInt(e.target.value)})} /></div>
                <div><label className="text-xs text-c-text2 font-medium">거주 형태</label><select value={profile.housing} onChange={e => setProfile({...profile, housing: e.target.value})}><option value="월세">월세</option><option value="전세">전세</option><option value="자가">자가</option><option value="기타">기타</option></select></div>
                <div className="bg-[#00C48C]/8 border border-[#00C48C]/15 rounded-2xl p-4 text-xs text-[#00C48C] flex items-center gap-2"><Save size={14} /> 변경사항은 자동으로 저장됩니다</div>
              </div>
            )}

            {activeSection === id && id === 'goals' && (
              <div className="px-5 pb-4 space-y-3 animate-fade">
                <div><label className="text-xs text-c-text2 font-medium">월 저축 목표</label><input type="number" value={goals.savingGoal} onChange={e => setGoals({...goals, savingGoal: parseInt(e.target.value)})} /><div className="text-xs text-c-text2 mt-1">월급의 {hideAmounts ? '•••••' : `${(goals.savingGoal / profile.salary * 100).toFixed(0)}%`}</div></div>
                <div><label className="text-xs text-c-text2 font-medium">월 배당 목표</label><input type="number" value={goals.dividendGoal} onChange={e => setGoals({...goals, dividendGoal: parseInt(e.target.value)})} /></div>
                <div><label className="text-xs text-c-text2 font-medium">순자산 목표</label><input type="number" value={goals.netWorthGoal} onChange={e => setGoals({...goals, netWorthGoal: parseInt(e.target.value)})} /></div>
              </div>
            )}

            {activeSection === id && id === 'budget' && (
              <div className="px-5 pb-4 space-y-3 animate-fade">
                {CATEGORIES.map(cat => <div key={cat}><label className="text-xs text-c-text2 font-medium">{cat}</label><input type="number" value={budget[cat] || ''} onChange={e => setBudget({...budget, [cat]: parseInt(e.target.value) || 0})} /></div>)}
                <div className="glass-inner rounded-2xl p-4"><div className="flex justify-between text-sm"><span className="font-medium text-c-text">총 예산</span><span className="font-bold text-[#3182F6]">{hideAmounts ? '•••••' : formatFullKRW(Object.values(budget).reduce((s, v) => s + v, 0))}</span></div></div>
              </div>
            )}

            {activeSection === id && id === 'notifications' && (
              <div className="px-5 pb-4 space-y-3 animate-fade">
                {[{ key: 'fixedExpense', label: '고정지출 알림' }, { key: 'budgetOver', label: '예산 초과 알림' }, { key: 'economic', label: '경제지표 알림' }, { key: 'badge', label: '배지 획득 알림' }, { key: 'report', label: '주간/월간 리포트' }].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2.5"><span className="text-sm font-medium text-c-text">{item.label}</span>
                    <button onClick={() => setSettings({...settings, notifications: {...settings.notifications, [item.key]: !settings.notifications[item.key]}})} className={`w-14 h-7 rounded-full transition-all relative ${settings.notifications[item.key] ? 'bg-[#3182F6]' : 'bg-c-subtle'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${settings.notifications[item.key] ? 'translate-x-7' : 'translate-x-0.5'}`} /></button>
                  </div>
                ))}
                <div className="border-t border-c-border pt-3"><div className="flex items-center justify-between py-2.5"><span className="text-sm font-medium text-c-text">SMS 자동인식</span><button onClick={() => setSettings({...settings, smsAutoDetect: !settings.smsAutoDetect})} className={`w-14 h-7 rounded-full transition-all relative ${settings.smsAutoDetect ? 'bg-[#3182F6]' : 'bg-c-subtle'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${settings.smsAutoDetect ? 'translate-x-7' : 'translate-x-0.5'}`} /></button></div></div>
              </div>
            )}

            {activeSection === id && id === 'data' && (
              <div className="px-5 pb-4 space-y-3 animate-fade">
                <button onClick={handleBackup} className="w-full flex items-center gap-3 p-4 bg-[#3182F6]/8 border border-[#3182F6]/15 rounded-2xl text-sm font-semibold text-[#3182F6] transition-shadow"><Download size={18} /> JSON 백업 다운로드</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-[#00C48C]/8 border border-[#00C48C]/15 rounded-2xl text-sm font-semibold text-[#00C48C] transition-shadow"><Upload size={18} /> 백업 파일 복원</button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
                <button onClick={handleExportCSV} className="w-full flex items-center gap-3 p-4 bg-[#7C5CFC]/8 border border-[#7C5CFC]/15 rounded-2xl text-sm font-semibold text-[#7C5CFC] transition-shadow"><FileSpreadsheet size={18} /> 엑셀(CSV)로 내보내기</button>
                <div className="border-t border-c-border pt-3"><button onClick={() => { if (confirm('정말 모든 데이터를 삭제하시겠습니까?')) { localStorage.clear(); location.reload(); } }} className="w-full flex items-center gap-3 p-4 bg-[#FF4757]/8 border border-[#FF4757]/15 rounded-2xl text-sm font-semibold text-[#FF4757] transition-shadow"><Trash2 size={18} /> 모든 데이터 초기화</button></div>
              </div>
            )}

            {idx < sections.length - 1 && <div className="border-t border-c-border mx-5" />}
          </div>
        ))}

        <div className="border-t border-c-border mx-5" />

        {/* 계정 */}
        {user ? (
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#00C48C]/10 flex items-center justify-center"><Cloud size={20} className="text-[#00C48C]" /></div>
              <div className="flex-1"><div className="text-sm font-bold text-c-text">{user.displayName || user.email}</div><div className="text-xs text-[#00C48C] font-medium">클라우드 동기화 중</div></div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3.5 glass-inner rounded-2xl text-sm font-semibold text-c-text2"><LogOut size={16} /> 로그아웃</button>
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF9F43]/10 flex items-center justify-center"><CloudOff size={20} className="text-[#FF9F43]" /></div>
            <div><div className="text-sm font-bold text-c-text">오프라인 모드</div><div className="text-xs text-[#FF9F43] font-medium">로그인하면 클라우드에 저장됩니다</div></div>
          </div>
        )}

        <div className="border-t border-c-border mx-5" />

        {/* 앱 정보 */}
        <div className="px-5 py-4 space-y-2">
          <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-3 py-2.5 text-left"><BookOpen size={16} className="text-c-text3" /><span className="text-sm text-c-text2">사용 설명서</span><ChevronRight size={14} className="text-c-text3 ml-auto" /></button>
          <button onClick={() => setShowChangelog(true)} className="w-full flex items-center gap-3 py-2.5 text-left"><History size={16} className="text-c-text3" /><span className="text-sm text-c-text2">업데이트 내역</span><ChevronRight size={14} className="text-c-text3 ml-auto" /></button>
          <button onClick={() => setPolicyType('privacy')} className="w-full flex items-center gap-3 py-2.5 text-left"><Shield size={16} className="text-c-text3" /><span className="text-sm text-c-text2">개인정보처리방침</span><ChevronRight size={14} className="text-c-text3 ml-auto" /></button>
          <button onClick={() => setPolicyType('terms')} className="w-full flex items-center gap-3 py-2.5 text-left"><FileText size={16} className="text-c-text3" /><span className="text-sm text-c-text2">이용약관</span><ChevronRight size={14} className="text-c-text3 ml-auto" /></button>
        </div>

        <div className="border-t border-c-border mx-5" />

        {/* 버전 */}
        <div className="text-center py-6"><div className="text-xs text-c-text3 font-medium">MyFinance v1.2</div><div className="text-xs text-c-text3">개인 재무관리 앱</div></div>

      </div>
      {policyType && <PrivacyPolicy type={policyType} onClose={() => setPolicyType(null)} />}

      {/* 사용 설명서 */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-fade" onClick={() => setShowGuide(false)}>
          <div className="glass rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col animate-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-3 shrink-0">
              <h2 className="text-lg font-bold text-c-text">사용 설명서</h2>
              <button onClick={() => setShowGuide(false)} className="text-c-text3"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 flex-1">
            <div className="space-y-6 text-sm text-c-text2 leading-relaxed">

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">🏠</span><span className="font-bold text-c-text">홈 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>총 자산, 이번 달 지출, 저축률, 투자 수익을 한눈에 확인</li>
                  <li>금액 숨기기: 눈 아이콘을 누르면 모든 금액이 가려짐</li>
                  <li>XP/레벨 시스템: 매일 출석 체크인으로 경험치 획득, 연속 출석 보너스</li>
                  <li>주간 챌린지: 무지출 3일, 커피 절약, 매일 기록, 예산 수호자 등 6종</li>
                  <li>지출 속도 게이지: 예산 대비 소진율을 원형 차트로 실시간 확인</li>
                  <li>AI 인사이트: 저축률, 지출 속도, 예산 초과 자동 분석</li>
                  <li>카테고리별 도넛 차트: 카테고리 클릭 시 상세 거래 내역 확인</li>
                  <li>6개월 수입/지출 트렌드 차트</li>
                  <li>이번주 미니 리포트: 지난주 대비 지출 비교</li>
                  <li>포트폴리오 요약: 보유 종목 수익률, 월 배당 확인</li>
                  <li>목표 진행도: 배당 목표, 순자산 목표 게이지</li>
                  <li>경제 일정: 주요 경제지표 발표 일정 및 포트폴리오 영향</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">📈</span><span className="font-bold text-c-text">투자 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>포트폴리오: 종목 검색/추가/삭제, 실시간 시세, 수익률 확인</li>
                  <li>캔들스틱 차트: 4시간/일봉/주봉/월봉 타임프레임 전환, 터치 크로스헤어</li>
                  <li>매수/매도: 거래 기록 및 평균단가 자동 계산</li>
                  <li>포트폴리오 비중: 파이 차트로 종목별 비중 확인</li>
                  <li>종목별 도구: 물타기 계산기, 수익 계산기, 목표가 참고</li>
                  <li>환율: USD/KRW 실시간 환율, 양방향 환율 계산기, 내 투자 환율 영향</li>
                  <li>코인/김프: BTC·ETH·XRP 바이낸스/업비트 시세, 김치프리미엄 퍼센트</li>
                  <li>계산기 5종: 복리, 손익분기, 배당, 물타기, 목표자산</li>
                  <li>관심종목: 보유하지 않은 종목도 실시간 가격 추적</li>
                  <li>경제일정: 중요도별 표시, 시장 영향 설명, 이번주/다음주 구분</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">💰</span><span className="font-bold text-c-text">가계부 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>빠른 입력: 자주 쓰는 항목 원터치 입력, 직접 입력, 음성/텍스트</li>
                  <li>영수증 OCR: 카메라로 영수증 촬영 시 금액·날짜·장소 자동 인식</li>
                  <li>달력 뷰: 날짜별 지출 내역을 달력에서 확인, 날짜 클릭 시 상세</li>
                  <li>일일 리포트: 오늘 지출 내역 및 카테고리별 합계</li>
                  <li>검색: 장소, 메모, 카테고리, 금액 범위로 거래 검색</li>
                  <li>주간/월간/비교/연간: 기간별 지출 분석, 전월 비교 리포트</li>
                  <li>수입 관리: 월급 외 부수입 기록</li>
                  <li>고정지출: 매월 자동 등록되는 고정 지출 설정 (날짜별)</li>
                  <li>할부 관리: 할부 결제 현황 및 남은 회차 추적</li>
                  <li>챌린지: 지출 줄이기 미션</li>
                  <li>패턴 분석: 요일별/시간대별 지출 습관 분석</li>
                  <li>환불 처리: 거래별 환불 표시, 통계에서 자동 제외</li>
                  <li>사진 첨부: 거래에 영수증 사진 첨부 가능</li>
                  <li>CSV 내보내기: 거래 내역을 엑셀 파일로 다운로드</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">🏅</span><span className="font-bold text-c-text">배지 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>활동에 따라 자동으로 배지 획득 (첫 기록, 투자 시작, 7일 연속 등)</li>
                  <li>레벨 시스템: 배지 수에 따른 레벨 업, 다음 레벨 진행바</li>
                  <li>보상 시스템: 일정 배지 달성 시 보상 획득</li>
                  <li>카테고리별 모아보기, 최근 획득 배지 표시</li>
                  <li>배지 획득 시 축하 팝업 및 햅틱 피드백</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">📊</span><span className="font-bold text-c-text">통계 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>월간 요약: 지출/수입/저축률/예산 소진율 한눈에 확인</li>
                  <li>소비 패턴: 요일별 히트맵, 카테고리별 레이더 차트</li>
                  <li>카테고리별 지출: 도넛 차트, 예산 대비 바 차트</li>
                  <li>일별 지출 추이: 라인 차트, 날짜 클릭 시 상세 내역</li>
                  <li>예산 분석: 카테고리별 예산 대비 실제 지출 비교</li>
                  <li>순자산 추이: 투자 + 저축 기반 자산 그래프</li>
                  <li>절약 팁: 낭비 분석 및 절약 가능 금액 제안</li>
                  <li>목표 달성 예측: 배당 목표, 순자산 목표 달성 시점 예측</li>
                  <li>각 섹션을 탭하면 상세 분석 확인 가능 (인터랙티브)</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-base">⚙️</span><span className="font-bold text-c-text">설정 탭</span></div>
                <ul className="space-y-1.5 ml-6 list-disc">
                  <li>프로필: 이름, 나이, 직업, 월급, 거주형태 설정 (자동 저장)</li>
                  <li>목표: 월 저축, 배당, 순자산 목표 설정</li>
                  <li>예산: 카테고리별 월 예산 설정</li>
                  <li>알림: 고정지출, 예산초과, 경제지표, 배지, 리포트 알림 개별 관리</li>
                  <li>테마: 7가지 테마 (Black, Notion, Ocean, Forest, Rose, Midnight, Auto)</li>
                  <li>데이터: JSON 백업/복원, CSV 내보내기, 전체 초기화</li>
                  <li>클라우드: Google 로그인 시 자동 동기화 (실시간)</li>
                  <li>사용 설명서 / 업데이트 내역 / 개인정보처리방침 / 이용약관</li>
                </ul>
              </div>

              <div className="glass-inner rounded-2xl p-4 space-y-2">
                <div className="font-bold text-c-text text-xs">💡 꿀팁</div>
                <ul className="space-y-1 ml-4 list-disc text-xs">
                  <li>좌우 스와이프로 탭 간 빠르게 이동 가능</li>
                  <li>금액을 터치하면 직접 수정 가능 (수입, 목표 등)</li>
                  <li>매일 앱을 열면 출석 스트릭이 쌓이고 XP 보너스 증가</li>
                  <li>주간 챌린지 완료 시 XP 보상 → 레벨업으로 레벨 칭호 획득</li>
                  <li>영수증 OCR로 사진 한 장으로 거래 자동 입력</li>
                  <li>정기적으로 데이터 백업을 권장합니다</li>
                  <li>Google 로그인하면 기기 간 데이터 실시간 동기화</li>
                  <li>홈 화면에 추가(PWA)하면 네이티브 앱처럼 사용 가능</li>
                </ul>
              </div>

            </div>
            </div>
          </div>
        </div>
      )}

      {/* 업데이트 내역 */}
      {showChangelog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-fade" onClick={() => setShowChangelog(false)}>
          <div className="glass rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col animate-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-3 shrink-0">
              <h2 className="text-lg font-bold text-c-text">업데이트 내역</h2>
              <button onClick={() => setShowChangelog(false)} className="text-c-text3"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 flex-1">
            <div className="space-y-6 text-sm text-c-text2 leading-relaxed">

              {/* v1.2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-[#3182F6] text-white text-xs font-bold rounded-full">v1.2</span>
                  <span className="text-xs text-c-text3">최신</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-[#00C48C] mb-1">✦ 새 기능</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>영수증 OCR 스캔 — 카메라로 영수증 촬영 시 금액·날짜·장소 자동 인식</li>
                      <li>Zustand 상태관리 — 전역 스토어 도입으로 성능 및 안정성 향상</li>
                      <li>React Router 도입 — URL 기반 탭 네비게이션, 브라우저 뒤로가기 지원</li>
                      <li>페이지 전환 애니메이션 — Framer Motion 기반 부드러운 전환 효과</li>
                      <li>햅틱 피드백 — 탭 전환, 버튼 클릭 시 진동 피드백</li>
                      <li>로딩 스켈레톤 UI — 데이터 로딩 시 깜빡임 없는 플레이스홀더</li>
                      <li>오프라인 푸시 알림 — 서비스워커 기반 백그라운드 알림</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#3182F6] mb-1">✦ 개선</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>코드 스플리팅 — 탭별 Lazy Loading으로 초기 로딩 속도 개선</li>
                      <li>번들 최적화 — React, Firebase, Recharts, Framer Motion 청크 분리</li>
                      <li>서비스워커 캐시 전략 개선 — HTML은 네트워크 우선, 에셋은 캐시 우선</li>
                      <li>오프라인 거래 동기화 — 네트워크 복구 시 자동 업로드</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-c-border" />

              {/* v1.1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-c-subtle text-c-text text-xs font-bold rounded-full">v1.1</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-[#00C48C] mb-1">✦ 새 기능</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>게이미피케이션 시스템 — 스트릭, XP, 레벨, 주간 챌린지</li>
                      <li>홈 대시보드 리디자인 — 차트, 인터랙티브 위젯 추가</li>
                      <li>에러 바운더리 — 앱 크래시 시 복구 화면 제공</li>
                      <li>푸시 알림 — 예산 초과, 고정지출, 배지 획득 알림</li>
                      <li>개인정보처리방침 및 이용약관 페이지 추가</li>
                      <li>빌드 최적화 — 코드 스플리팅, 번들 크기 축소</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#3182F6] mb-1">✦ 버그 수정</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>검색/거래 모달이 하단 네비에 가려지는 문제 수정</li>
                      <li>카카오톡 등 인앱 브라우저에서 알림 API 크래시 수정</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-c-border" />

              {/* v1.0 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-c-subtle text-c-text text-xs font-bold rounded-full">v1.0</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-[#00C48C] mb-1">✦ 새 기능</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Firebase 로그인 및 클라우드 동기화</li>
                      <li>통계탭 18개 분석 기능 — 소비패턴, 예산비교, 순자산 추이 등</li>
                      <li>가계부 10개 기능 — 달력뷰, 검색, 수입관리, 월비교, 연간리포트, 할부관리, 환불처리, CSV내보내기, 사진첨부</li>
                      <li>투자탭 — 캔들스틱 차트, 타임프레임, 종목 검색, 관심종목</li>
                      <li>배지 시스템 — 활동 기반 자동 배지 획득</li>
                      <li>글래스모피즘 UI — 7가지 테마 지원</li>
                      <li>15개 UX 개선 — 온보딩, 토스트, 배지 축하 애니메이션 등</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#3182F6] mb-1">✦ 개선</div>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>가계부 서브탭 UI 통일 및 대형화</li>
                      <li>하단 네비게이션 불투명 처리, 콘텐츠 겹침 제거</li>
                      <li>통계탭 전체 인터랙티브화 — 모든 섹션 클릭/확장</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-c-border" />

              {/* v0.1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-c-subtle text-c-text text-xs font-bold rounded-full">v0.1</span>
                  <span className="text-xs text-c-text3">최초 릴리즈</span>
                </div>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>가계부 기본 기능 — 지출 입력, 카테고리 분류</li>
                  <li>투자 포트폴리오 관리</li>
                  <li>환율/코인 시세 조회</li>
                  <li>기본 통계 및 차트</li>
                  <li>PWA 지원 — 홈 화면에 추가 가능</li>
                  <li>GitHub Pages 자동 배포</li>
                </ul>
              </div>

            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsTab;
