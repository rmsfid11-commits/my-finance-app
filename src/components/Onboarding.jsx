import { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

function Onboarding({ profile, setProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: profile.name || '', age: profile.age || 30, job: profile.job || '', salary: profile.salary || 3000000, housing: profile.housing || '월세' });

  const steps = [
    { title: '환영합니다!', desc: '나만의 재무관리를 시작해볼까요?' },
    { title: '기본 정보', desc: '이름과 나이를 알려주세요' },
    { title: '직업 정보', desc: '직업과 월급을 입력하세요' },
    { title: '준비 완료!', desc: '이제 재무관리를 시작합니다' },
  ];

  const done = () => { setProfile({ ...profile, ...form }); onComplete(); };
  const next = () => step < 3 ? setStep(step + 1) : done();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <div className="glass rounded-3xl border border-c-glass-border p-8 w-full max-w-md animate-slide">
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#3182F6]' : 'bg-c-subtle'}`} />)}
        </div>
        <div className="text-center mb-8">
          {step === 0 && <Sparkles size={48} className="mx-auto mb-4 text-[#3182F6]" />}
          <h2 className="text-2xl font-extrabold text-c-text mb-2">{steps[step].title}</h2>
          <p className="text-sm text-c-text2">{steps[step].desc}</p>
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <div><label className="text-xs text-c-text2 font-medium">이름</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="이름을 입력하세요" autoFocus /></div>
            <div><label className="text-xs text-c-text2 font-medium">나이</label><input type="number" value={form.age} onChange={e => setForm({...form, age: parseInt(e.target.value) || 0})} /></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div><label className="text-xs text-c-text2 font-medium">직업</label><input type="text" value={form.job} onChange={e => setForm({...form, job: e.target.value})} placeholder="예: 회사원, 자영업" /></div>
            <div><label className="text-xs text-c-text2 font-medium">월급</label><input type="number" value={form.salary} onChange={e => setForm({...form, salary: parseInt(e.target.value) || 0})} /><div className="text-xs text-c-text3 mt-1">{(form.salary||0).toLocaleString()}원</div></div>
            <div><label className="text-xs text-c-text2 font-medium">거주 형태</label><select value={form.housing} onChange={e => setForm({...form, housing: e.target.value})}><option value="월세">월세</option><option value="전세">전세</option><option value="자가">자가</option><option value="기타">기타</option></select></div>
          </div>
        )}
        {step === 3 && (
          <div className="text-center space-y-3">
            <div className="inline-block glass-inner rounded-2xl px-6 py-4"><div className="text-lg font-bold text-c-text">{form.name}님</div><div className="text-sm text-c-text2">{form.age}세 · {form.job || '직장인'} · {form.housing}</div><div className="text-sm text-c-text2 mt-1">월급 {(form.salary||0).toLocaleString()}원</div></div>
          </div>
        )}
        <button onClick={next} disabled={step === 1 && !form.name} className="w-full btn-primary py-4 mt-8 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-40">
          {step === 3 ? '시작하기' : '다음'} <ChevronRight size={18} />
        </button>
        {step === 0 && <button onClick={done} className="w-full text-center text-sm text-c-text3 mt-3 py-2">건너뛰기</button>}
      </div>
    </div>
  );
}

export default Onboarding;
