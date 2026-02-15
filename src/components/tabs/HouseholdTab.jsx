import { useState, useMemo } from 'react';
import { formatFullKRW, formatKRW, generateId, formatDate, formatTime, getDayOfWeek } from '../../utils/formatters';
import { PEER_DATA } from '../../data/initialData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, MessageSquare, Camera, Mic, Pencil, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';

const SUB_TABS = [
  { id: 'quick', label: '빠른 입력' },
  { id: 'daily', label: '일일' },
  { id: 'weekly', label: '주간' },
  { id: 'monthly', label: '월간' },
  { id: 'fixed', label: '고정지출' },
  { id: 'challenge', label: '챌린지' },
  { id: 'pattern', label: '패턴' },
];

const getCatColor = (cats, name) => cats.find(c => c.name === name)?.color || '#8B95A1';
const getCatIcon = (cats, name) => cats.find(c => c.name === name)?.icon || '📦';

function HouseholdTab({ profile, goals, budget, setBudget, transactions, fixedExpenses, setFixedExpenses, addTransaction, deleteTransaction, updateTransaction, hideAmounts, customQuickInputs, setCustomQuickInputs, customCategories, setCustomCategories, paymentMethods, setPaymentMethods }) {
  const [subTab, setSubTab] = useState('quick');
  const catNames = useMemo(() => customCategories.map(c => c.name), [customCategories]);

  return (
    <div className="animate-slide">
      <div className="glass flex-1 flex flex-col">
        <div className="grid grid-cols-4 border-b border-c-border">
          {SUB_TABS.slice(0, 4).map(({ id, label }, i) => (
            <button key={id} onClick={() => setSubTab(id)} className={`py-4 text-sm font-semibold text-center transition-all relative ${i < 3 ? 'border-r border-c-border' : ''} ${subTab === id ? 'text-[#3182F6] bg-[#3182F6]/5' : 'text-c-text3 active:bg-c-subtle'}`}>
              {label}
              {subTab === id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#3182F6] rounded-full" />}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 border-b border-c-border">
          {SUB_TABS.slice(4).map(({ id, label }, i) => (
            <button key={id} onClick={() => setSubTab(id)} className={`py-4 text-sm font-semibold text-center transition-all relative ${i < 2 ? 'border-r border-c-border' : ''} ${subTab === id ? 'text-[#3182F6] bg-[#3182F6]/5' : 'text-c-text3 active:bg-c-subtle'}`}>
              {label}
              {subTab === id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#3182F6] rounded-full" />}
            </button>
          ))}
        </div>
        {subTab === 'quick' && <QuickInput addTransaction={addTransaction} hideAmounts={hideAmounts} customQuickInputs={customQuickInputs} setCustomQuickInputs={setCustomQuickInputs} customCategories={customCategories} setCustomCategories={setCustomCategories} paymentMethods={paymentMethods} catNames={catNames} />}
        {subTab === 'daily' && <DailyView transactions={transactions} budget={budget} deleteTransaction={deleteTransaction} updateTransaction={updateTransaction} hideAmounts={hideAmounts} customCategories={customCategories} paymentMethods={paymentMethods} catNames={catNames} />}
        {subTab === 'weekly' && <WeeklyView transactions={transactions} budget={budget} hideAmounts={hideAmounts} />}
        {subTab === 'monthly' && <MonthlyView transactions={transactions} budget={budget} setBudget={setBudget} profile={profile} fixedExpenses={fixedExpenses} hideAmounts={hideAmounts} customCategories={customCategories} catNames={catNames} />}
        {subTab === 'fixed' && <FixedView fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses} hideAmounts={hideAmounts} customCategories={customCategories} catNames={catNames} />}
        {subTab === 'challenge' && <ChallengeView transactions={transactions} budget={budget} hideAmounts={hideAmounts} />}
        {subTab === 'pattern' && <PatternView transactions={transactions} hideAmounts={hideAmounts} customCategories={customCategories} />}
      </div>
    </div>
  );
}

/* ─── QuickInput ─── */
function QuickInput({ addTransaction, hideAmounts, customQuickInputs, setCustomQuickInputs, customCategories, setCustomCategories, paymentMethods, catNames }) {
  const [showManual, setShowManual] = useState(false);
  const [showSMS, setShowSMS] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', amount: '', category: catNames[0] || '식비', icon: '🍚' });
  const [form, setForm] = useState({ amount: '', category: catNames[0] || '식비', memo: '', place: '', payment: '카드' });
  const [smsText, setSmsText] = useState('');
  const [smsPayment, setSmsPayment] = useState('카드');
  const [showCatManage, setShowCatManage] = useState(false);

  const handleQuick = (item) => {
    const now = new Date();
    addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: item.amount, category: item.category, subcategory: item.label, place: item.label, memo: '', payment: '카드', auto: false });
  };

  const handleManual = () => {
    if (!form.amount) return;
    const now = new Date();
    addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: parseInt(form.amount), category: form.category, subcategory: '', place: form.place, memo: form.memo, payment: form.payment, auto: false });
    setForm({ amount: '', category: catNames[0] || '식비', memo: '', place: '', payment: '카드' }); setShowManual(false);
  };

  const handleSMS = () => {
    const m = smsText.match(/(\d{1,3}(,\d{3})*)\s*원/);
    const p = smsText.match(/승인\s*([\w가-힣]+)/);
    if (m) {
      const now = new Date();
      addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: parseInt(m[1].replace(/,/g, '')), category: '기타', subcategory: '', place: p ? p[1] : '미확인', memo: 'SMS 자동인식', payment: smsPayment, auto: true });
      setSmsText(''); setShowSMS(false);
    }
  };

  const removeQuickItem = (idx) => {
    setCustomQuickInputs(prev => prev.filter((_, i) => i !== idx));
  };

  const addQuickItem = () => {
    if (!newItem.label || !newItem.amount) return;
    setCustomQuickInputs(prev => [...prev, { label: newItem.label, amount: parseInt(newItem.amount), category: newItem.category, icon: newItem.icon }]);
    setNewItem({ label: '', amount: '', category: catNames[0] || '식비', icon: '🍚' });
    setShowAddItem(false);
  };

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-c-text">자주 쓰는 항목</h3>
          <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-xl transition-colors ${editMode ? 'text-[#3182F6] bg-[#3182F6]/10' : 'text-c-text3 hover:text-c-text2'}`}>
            <Pencil size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {customQuickInputs.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="relative">
              <button onClick={() => !editMode && handleQuick(item)} className={`w-full rounded-2xl p-5 text-center transition-all border border-c-border ${editMode ? 'opacity-80' : 'hover:bg-c-subtle active:scale-95'}`}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-c-text mb-1">{item.label}</div>
                <div className="text-xs text-c-text2">{hideAmounts ? '•••••' : formatFullKRW(item.amount)}</div>
              </button>
              {editMode && (
                <button onClick={() => removeQuickItem(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {editMode && (
            <button onClick={() => setShowAddItem(!showAddItem)} className="rounded-2xl p-5 text-center border-2 border-dashed border-c-border hover:border-[#3182F6]/50 transition-colors">
              <Plus size={24} className="mx-auto text-c-text3 mb-2" />
              <div className="text-sm text-c-text3">추가</div>
            </button>
          )}
        </div>
        {showAddItem && editMode && (
          <div className="mt-3 p-4 border border-c-border rounded-2xl space-y-2 animate-fade">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-c-text2">라벨</label><input type="text" value={newItem.label} onChange={e => setNewItem({ ...newItem, label: e.target.value })} placeholder="항목명" /></div>
              <div><label className="text-xs text-c-text2">금액</label><input type="number" value={newItem.amount} onChange={e => setNewItem({ ...newItem, amount: e.target.value })} placeholder="금액" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-c-text2">카테고리</label><select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-c-text2">아이콘</label><input type="text" value={newItem.icon} onChange={e => setNewItem({ ...newItem, icon: e.target.value })} placeholder="🍚" /></div>
            </div>
            <button onClick={addQuickItem} className="w-full btn-primary py-2.5 text-sm">항목 추가</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowManual(!showManual)} className="flex items-center gap-3 p-5 rounded-2xl border border-c-border text-base font-semibold text-c-text transition-colors hover:border-[#3182F6]/50 active:scale-[0.98]"><Plus size={22} className="text-[#3182F6]" /> 직접 입력</button>
        <button onClick={() => setShowSMS(!showSMS)} className="flex items-center gap-3 p-5 rounded-2xl border border-c-border text-base font-semibold text-c-text transition-colors hover:border-[#3182F6]/50 active:scale-[0.98]"><MessageSquare size={22} className="text-green-500" /> SMS 입력</button>
        <button className="flex items-center gap-3 p-5 rounded-2xl border border-c-border text-base font-semibold text-c-text opacity-50"><Camera size={22} className="text-purple-500" /> 영수증 OCR</button>
        <button className="flex items-center gap-3 p-5 rounded-2xl border border-c-border text-base font-semibold text-c-text opacity-50"><Mic size={22} className="text-orange-500" /> 음성 입력</button>
      </div>

      {showManual && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <h3 className="font-bold text-base text-c-text">직접 입력</h3>
          <div><label className="text-xs text-c-text2">금액</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="금액 입력" /></div>
          <div><label className="text-xs text-c-text2">카테고리</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-xs text-c-text2">결제수단</label><select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })}>{paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="text-xs text-c-text2">장소</label><input type="text" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} placeholder="장소 (선택)" /></div>
          <div><label className="text-xs text-c-text2">메모</label><input type="text" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="메모 (선택)" /></div>
          <button onClick={handleManual} className="w-full btn-primary py-3">저장하기</button>
        </div>
      )}

      {showSMS && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <h3 className="font-bold text-base text-c-text">SMS 자동인식</h3>
          <textarea value={smsText} onChange={e => setSmsText(e.target.value)} placeholder={"카드 사용 문자를 붙여넣기 하세요\n예: [신한] 15,000원 승인 스타벅스"} rows={3} className="w-full border border-c-border text-c-text rounded-2xl p-3 text-sm bg-transparent" />
          <div><label className="text-xs text-c-text2">결제수단</label><select value={smsPayment} onChange={e => setSmsPayment(e.target.value)}>{paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <button onClick={handleSMS} className="w-full btn-primary py-3">인식하기</button>
        </div>
      )}

      {/* 카테고리 관리 */}
      <CategoryManager customCategories={customCategories} setCustomCategories={setCustomCategories} showCatManage={showCatManage} setShowCatManage={setShowCatManage} />
    </div>
  );
}

/* ─── CategoryManager ─── */
const PRESET_COLORS = ['#FF4757', '#3182F6', '#00C48C', '#7C5CFC', '#FF9F43', '#FF6B81', '#0ABDE3', '#8B95A1'];

function CategoryManager({ customCategories, setCustomCategories, showCatManage, setShowCatManage }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '', color: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', icon: '📌', color: PRESET_COLORS[0] });

  const startEdit = (idx) => {
    const c = customCategories[idx];
    setEditIdx(idx);
    setEditForm({ name: c.name, icon: c.icon, color: c.color });
  };

  const saveEdit = () => {
    if (!editForm.name) return;
    setCustomCategories(prev => prev.map((c, i) => i === editIdx ? { ...editForm } : c));
    setEditIdx(null);
  };

  const deleteCategory = (idx) => {
    setCustomCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    if (!addForm.name) return;
    setCustomCategories(prev => [...prev, { ...addForm }]);
    setAddForm({ name: '', icon: '📌', color: PRESET_COLORS[0] });
    setShowAdd(false);
  };

  return (
    <div className="border border-c-border rounded-2xl overflow-hidden">
      <button onClick={() => setShowCatManage(!showCatManage)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-c-text">
        <span>카테고리 관리</span>
        {showCatManage ? <ChevronUp size={16} className="text-c-text3" /> : <ChevronDown size={16} className="text-c-text3" />}
      </button>
      {showCatManage && (
        <div className="px-4 pb-4 space-y-2 animate-fade">
          {customCategories.map((cat, idx) => (
            <div key={`${cat.name}-${idx}`}>
              {editIdx === idx ? (
                <div className="p-3 border border-[#3182F6]/30 rounded-xl space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="이름" className="text-sm" />
                    <input type="text" value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} placeholder="아이콘" className="text-sm" />
                    <div className="flex gap-1 items-center flex-wrap">{PRESET_COLORS.map(c => <button key={c} onClick={() => setEditForm({ ...editForm, color: c })} className={`w-5 h-5 rounded-full transition-all ${editForm.color === c ? 'ring-2 ring-offset-1 ring-[#3182F6]' : ''}`} style={{ backgroundColor: c }} />)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1"><Check size={12} /> 저장</button>
                    <button onClick={() => setEditIdx(null)} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-c-text">{cat.name}</span>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <button onClick={() => startEdit(idx)} className="text-c-text3 hover:text-[#3182F6] transition-colors p-1"><Pencil size={14} /></button>
                  <button onClick={() => deleteCategory(idx)} className="text-c-text3 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
          {showAdd ? (
            <div className="p-3 border border-dashed border-c-border rounded-xl space-y-2 animate-fade">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="카테고리 이름" className="text-sm" />
                <input type="text" value={addForm.icon} onChange={e => setAddForm({ ...addForm, icon: e.target.value })} placeholder="이모지" className="text-sm" />
              </div>
              <div className="flex gap-1.5 items-center"><span className="text-xs text-c-text2 mr-1">색상</span>{PRESET_COLORS.map(c => <button key={c} onClick={() => setAddForm({ ...addForm, color: c })} className={`w-5 h-5 rounded-full transition-all ${addForm.color === c ? 'ring-2 ring-offset-1 ring-[#3182F6]' : ''}`} style={{ backgroundColor: c }} />)}</div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 btn-primary py-1.5 text-xs">추가</button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="w-full py-2 border-2 border-dashed border-c-border rounded-xl text-xs text-c-text2 hover:border-[#3182F6]/50 hover:text-[#3182F6] transition-colors">+ 카테고리 추가</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── DailyView ─── */
function DailyView({ transactions, budget, deleteTransaction, updateTransaction, hideAmounts, customCategories, paymentMethods, catNames }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const dayTx = useMemo(() => transactions.filter(t => t.date === selectedDate).sort((a, b) => b.time.localeCompare(a.time)), [transactions, selectedDate]);
  const dayTotal = dayTx.reduce((s, t) => s + t.amount, 0);
  const dailyBudget = Math.round(Object.values(budget).reduce((s, v) => s + v, 0) / 30);
  const catData = useMemo(() => { const b = {}; dayTx.forEach(t => b[t.category] = (b[t.category] || 0) + t.amount); return Object.entries(b).map(([name, value]) => ({ name, value, fill: getCatColor(customCategories, name) })); }, [dayTx, customCategories]);
  const dates = useMemo(() => { const d = []; for (let i = 0; i < 7; i++) { const dt = new Date(); dt.setDate(dt.getDate() - i); d.push(formatDate(dt)); } return d; }, []);

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditForm({ amount: tx.amount, category: tx.category, place: tx.place || '', memo: tx.memo || '', payment: tx.payment || '카드' });
  };

  const saveEdit = () => {
    updateTransaction(editingId, { amount: parseInt(editForm.amount) || 0, category: editForm.category, place: editForm.place, memo: editForm.memo, payment: editForm.payment });
    setEditingId(null);
  };

  return (
    <div className="px-5 py-5 space-y-6">
      <div className="flex gap-2.5 overflow-x-auto pb-2">{dates.map(d => <button key={d} onClick={() => setSelectedDate(d)} className={`px-5 py-3 rounded-xl text-sm whitespace-nowrap min-w-[72px] text-center transition-all ${selectedDate === d ? 'bg-[#3182F6] text-white font-semibold shadow-lg shadow-blue-500/25' : 'border border-c-border text-c-text2'}`}><div>{d.substring(5)}</div><div className="text-xs opacity-70">{getDayOfWeek(d)}</div></button>)}</div>
      <div>
        <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-base text-c-text">오늘 요약</h3><span className="text-xs text-c-text3">{selectedDate}</span></div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">총 지출</div><div className="text-base font-bold text-red-500">{hideAmounts ? '•••••' : formatFullKRW(dayTotal)}</div></div>
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">일 예산</div><div className="text-base font-bold text-c-text">{hideAmounts ? '•••••' : formatFullKRW(dailyBudget)}</div></div>
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">잔여</div><div className={`text-base font-bold ${dailyBudget - dayTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>{hideAmounts ? '•••••' : formatFullKRW(dailyBudget - dayTotal)}</div></div>
        </div>
        {catData.length > 0 && <div className="h-32"><ResponsiveContainer width="100%" height="100%"><BarChart data={catData} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#8B949E' }} width={45} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /><Bar dataKey="value" radius={[0, 8, 8, 0]}>{catData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart></ResponsiveContainer></div>}
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">내역</h3>
        {dayTx.length > 0 ? (
          <div className="space-y-1">
            {dayTx.map(tx => (
              <div key={tx.id}>
                {editingId === tx.id ? (
                  <div className="p-3 border border-[#3182F6]/30 rounded-xl space-y-2 animate-fade">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-c-text2">금액</label><input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} /></div>
                      <div><label className="text-xs text-c-text2">카테고리</label><select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-c-text2">장소</label><input type="text" value={editForm.place} onChange={e => setEditForm({ ...editForm, place: e.target.value })} /></div>
                      <div><label className="text-xs text-c-text2">결제수단</label><select value={editForm.payment} onChange={e => setEditForm({ ...editForm, payment: e.target.value })}>{paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                    </div>
                    <div><label className="text-xs text-c-text2">메모</label><input type="text" value={editForm.memo} onChange={e => setEditForm({ ...editForm, memo: e.target.value })} /></div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1"><Check size={12} /> 저장</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-3 border-b border-c-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-c-text">{tx.place || tx.category}</div>
                      <div className="text-sm text-c-text2">{tx.time} · <span style={{ color: getCatColor(customCategories, tx.category) }}>{tx.category}</span>{tx.payment && <span className="ml-1 text-c-text3">· {tx.payment}</span>}{tx.auto && <span className="ml-1 text-blue-500 font-medium">자동</span>}</div>
                    </div>
                    <div className="text-right flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold text-red-500">{hideAmounts ? '•••••' : `-${formatFullKRW(tx.amount)}`}</span>
                      <button onClick={() => startEdit(tx)} className="text-c-text3 hover:text-[#3182F6] transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => deleteTransaction(tx.id)} className="text-c-text3 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <div className="text-base text-c-text3 text-center py-8">내역이 없습니다</div>}
      </div>
    </div>
  );
}

/* ─── WeeklyView ─── */
function WeeklyView({ transactions, budget, hideAmounts }) {
  const weekData = useMemo(() => {
    const days = [], now = new Date(), dow = now.getDay(), mon = new Date(now);
    mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); const ds = formatDate(d); const dt = transactions.filter(t => t.date === ds); days.push({ day: getDayOfWeek(d), date: ds.substring(5), amount: dt.reduce((s, t) => s + t.amount, 0) }); }
    return days;
  }, [transactions]);
  const weekTotal = weekData.reduce((s, d) => s + d.amount, 0);
  const peerAvg = Math.round(PEER_DATA.reduce((s, p) => s + p.totalExpense, 0) / PEER_DATA.length / 4);

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">주간 요약</h3>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="border border-c-border rounded-2xl p-5 text-center"><div className="text-sm font-medium text-red-500 mb-2">주간 지출</div><div className="text-xl font-bold text-red-500">{hideAmounts ? '•••••' : formatKRW(weekTotal)}</div></div>
          <div className="border border-c-border rounded-2xl p-5 text-center"><div className="text-sm font-medium text-c-text2 mb-2">일 평균</div><div className="text-xl font-bold text-c-text">{hideAmounts ? '•••••' : formatFullKRW(Math.round(weekTotal / 7))}</div></div>
        </div>
        <div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekData}><XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8B949E' }} axisLine={false} tickLine={false} /><YAxis width={50} tick={{ fontSize: 10, fill: '#8B949E' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /><Bar dataKey="amount" fill="#FF4757" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-sm mb-2">또래 비교 (35세 간호사)</h3>
        <div className="flex justify-between text-sm"><span>내 주간 지출</span><span className="font-bold">{hideAmounts ? '•••••' : formatKRW(weekTotal)}</span></div>
        <div className="flex justify-between text-sm"><span>또래 평균</span><span className="font-semibold">{hideAmounts ? '•••••' : formatKRW(peerAvg)}</span></div>
        <div className={`text-xs mt-2 font-semibold ${weekTotal < peerAvg ? 'text-green-300' : 'text-red-300'}`}>{hideAmounts ? '•••••' : (weekTotal < peerAvg ? `또래보다 ${formatFullKRW(peerAvg - weekTotal)} 적게 쓰고 있어요!` : `또래보다 ${formatFullKRW(weekTotal - peerAvg)} 더 쓰고 있어요`)}</div>
      </div>
    </div>
  );
}

/* ─── MonthlyView ─── */
function MonthlyView({ transactions, budget, setBudget, profile, fixedExpenses, hideAmounts, customCategories, catNames }) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth)), [transactions, currentMonth]);
  const monthTotal = monthTx.reduce((s, t) => s + t.amount, 0);
  const fixedTotal = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalExpense = monthTotal + fixedTotal;
  const savings = profile.salary - totalExpense;
  const savingRate = (savings / profile.salary * 100).toFixed(1);

  const catBreakdown = useMemo(() => { const b = {}; monthTx.forEach(t => b[t.category] = (b[t.category] || 0) + t.amount); fixedExpenses.forEach(f => b[f.category] = (b[f.category] || 0) + f.amount); return Object.entries(b).map(([name, value]) => ({ name, value, budget: budget[name] || 0, usage: budget[name] ? (value / budget[name] * 100).toFixed(0) : '-', fill: getCatColor(customCategories, name) })).sort((a, b) => b.value - a.value); }, [monthTx, fixedExpenses, budget, customCategories]);

  const peerStats = useMemo(() => { const sr = parseFloat(savingRate); const bt = PEER_DATA.filter(p => p.savingRate < sr).length; const avg = PEER_DATA.reduce((s, p) => s + p.savingRate, 0) / PEER_DATA.length; return { betterThan: bt, worseThan: 600 - bt, avgRate: avg.toFixed(1) }; }, [savingRate]);
  const pieData = catBreakdown.map(c => ({ name: c.name, value: c.value }));

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">월간 요약</h3>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-green-500 mb-2">수입</div><div className="text-base font-bold text-green-500">{hideAmounts ? '•••••' : formatKRW(profile.salary)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-red-500 mb-2">지출</div><div className="text-base font-bold text-red-500">{hideAmounts ? '•••••' : formatKRW(totalExpense)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-purple-500 mb-2">저축</div><div className="text-base font-bold text-purple-500">{hideAmounts ? '•••••' : formatKRW(savings)}</div></div>
        </div>
        <div className="border border-c-border rounded-2xl p-5"><div className="flex justify-between text-sm mb-3"><span className="font-medium text-c-text">저축률</span><span className="font-bold text-purple-500">{hideAmounts ? '•••••' : `${savingRate}%`}</span></div><div className="progress-bar"><div className="progress-fill bg-purple-500" style={{ width: `${Math.min(Math.max(parseFloat(savingRate), 0), 100)}%` }} /></div></div>
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">카테고리별</h3>
        {pieData.length > 0 && <div className="h-52 mb-4"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3} cornerRadius={4}>{pieData.map((e, i) => <Cell key={i} fill={getCatColor(customCategories, e.name)} />)}</Pie><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /></PieChart></ResponsiveContainer></div>}
        <div className="space-y-3">{catBreakdown.map(c => <div key={c.name} className="border-b border-c-border pb-3"><div className="flex justify-between items-center mb-2"><span className="text-base font-medium text-c-text">{c.name}</span><span className="text-base font-bold text-c-text">{hideAmounts ? '•••••' : formatFullKRW(c.value)}</span></div>{c.budget > 0 && <><div className="progress-bar"><div className={`progress-fill ${parseInt(c.usage) > 100 ? 'bg-red-500' : parseInt(c.usage) > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(parseInt(c.usage) || 0, 100)}%` }} /></div><div className="flex justify-between text-sm text-c-text2 mt-1.5"><span>예산 <EditableNumber value={c.budget} onSave={(v) => setBudget(prev => ({ ...prev, [c.name]: Math.round(v) }))} format={formatFullKRW} /></span><span className={parseInt(c.usage) > 100 ? 'text-red-500 font-bold' : ''}>{hideAmounts ? '•••••' : `${c.usage}%`}</span></div></>}</div>)}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-sm mb-3">또래 비교 (35세 간호사 600명)</h3>
        <div className="grid grid-cols-2 gap-3"><div className="bg-white/20 rounded-lg p-3 text-center"><div className="text-xs opacity-80">내 저축률</div><div className="text-xl font-bold">{hideAmounts ? '•••••' : `${savingRate}%`}</div></div><div className="bg-white/20 rounded-lg p-3 text-center"><div className="text-xs opacity-80">또래 평균</div><div className="text-xl font-bold">{hideAmounts ? '•••••' : `${peerStats.avgRate}%`}</div></div></div>
        <div className="mt-3 bg-white/10 rounded-lg p-3 text-center"><div className="text-sm">당신이 이긴 사람: <span className="font-bold text-yellow-300">{peerStats.betterThan}명</span> | 당신보다 위: <span className="font-bold">{peerStats.worseThan}명</span></div><div className="text-xs opacity-70 mt-1">상위 {((peerStats.worseThan / 600) * 100).toFixed(0)}%</div></div>
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">AI 분석</h3>
        <div className="space-y-2 text-sm">
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-green-500 mb-1">강점</div><p className="text-green-400 text-xs">{parseFloat(savingRate) >= 30 ? '저축률이 좋습니다! 꾸준히 유지하세요.' : '가계부 기록을 시작한 것 자체가 훌륭합니다!'}</p></div>
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-yellow-500 mb-1">개선점</div><p className="text-yellow-400 text-xs">도시락이나 집밥을 활용하면 식비를 줄일 수 있어요.</p></div>
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-blue-500 mb-1">다음달 목표</div><p className="text-blue-400 text-xs">저축률 {Math.min(parseFloat(savingRate) + 5, 50)}%를 목표로 해보세요!</p></div>
        </div>
      </div>
    </div>
  );
}

/* ─── FixedView ─── */
function FixedView({ fixedExpenses, setFixedExpenses, hideAmounts, customCategories, catNames }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', day: '1', category: catNames[0] || '생활', alert: true });
  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const today = new Date().getDate();
  const upcoming = fixedExpenses.filter(f => f.day >= today).sort((a, b) => a.day - b.day);

  const handleAdd = () => {
    if (!form.name || !form.amount) return;
    setFixedExpenses(p => [...p, { id: generateId(), name: form.name, amount: parseInt(form.amount), day: parseInt(form.day), category: form.category, alert: form.alert }]);
    setForm({ name: '', amount: '', day: '1', category: catNames[0] || '생활', alert: true }); setShowAdd(false);
  };

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-base text-c-text">고정지출 관리</h3><div className="text-sm font-bold text-red-500">월 {hideAmounts ? '•••••' : formatFullKRW(totalFixed)}</div></div>
        <div className="space-y-1">{fixedExpenses.map(e => <div key={e.id} className="flex items-center gap-3 py-3 border-b border-c-border last:border-0"><div className="flex-1 min-w-0"><div className="text-base font-medium text-c-text">{e.name}</div><div className="text-sm text-c-text2">매월 {e.day}일 · <span style={{ color: getCatColor(customCategories, e.category) }}>{e.category}</span></div></div><div className="text-right flex items-center gap-3 shrink-0"><span className="text-base font-bold text-red-500">{hideAmounts ? '•••••' : formatFullKRW(e.amount)}</span><button onClick={() => setFixedExpenses(p => p.filter(f => f.id !== e.id))} className="text-c-text3 hover:text-red-400 transition-colors"><Trash2 size={16} /></button></div></div>)}</div>
        <button onClick={() => setShowAdd(!showAdd)} className="w-full mt-4 py-2.5 border-2 border-dashed border-c-border rounded-2xl text-sm text-c-text2 hover:border-[#3182F6]/50 hover:text-[#3182F6] transition-colors">+ 고정지출 추가</button>
      </div>
      {showAdd && <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade"><h3 className="font-bold text-base text-c-text">고정지출 추가</h3><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="항목명" /><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="금액" /><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-c-text2">결제일</label><select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}일</option>)}</select></div><div><label className="text-xs text-c-text2">카테고리</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div><button onClick={handleAdd} className="w-full btn-primary py-3">추가하기</button></div>}
      {upcoming.length > 0 && <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-3 text-[#FF9F43]">다가오는 결제</h3>{upcoming.map(e => <div key={e.id} className="flex justify-between text-sm py-1.5"><span className="text-c-text2">{e.day}일 - {e.name}</span><span className="font-bold text-[#FF9F43]">{hideAmounts ? '•••••' : formatFullKRW(e.amount)}</span></div>)}<div className="border-t border-c-border mt-2 pt-2 flex justify-between text-sm font-bold text-[#FF9F43]"><span>총 예정액</span><span>{hideAmounts ? '•••••' : formatFullKRW(upcoming.reduce((s, e) => s + e.amount, 0))}</span></div></div>}
    </div>
  );
}

/* ─── ChallengeView ─── */
function ChallengeView({ transactions, budget, hideAmounts }) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  const challenges = [
    { id: 1, name: '식비 50만원 이하', target: 500000, current: monthTx.filter(t => t.category === '식비').reduce((s, t) => s + t.amount, 0), active: true },
    { id: 2, name: '교통비 15만원 이하', target: 150000, current: monthTx.filter(t => t.category === '교통').reduce((s, t) => s + t.amount, 0), active: true },
    { id: 3, name: '무지출 데이 5일', target: 5, current: new Date().getDate() - new Set(monthTx.map(t => t.date)).size, type: 'count', active: true },
  ];

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">이번달 챌린지</h3>
        <div className="space-y-4">{challenges.filter(c => c.active).map(c => {
          const isOk = c.type === 'count' ? c.current >= c.target : c.current <= c.target;
          const pct = c.type === 'count' ? Math.min(c.current / c.target * 100, 100) : Math.max((c.target - c.current) / c.target * 100, 0);
          return (<div key={c.id} className="border border-c-border rounded-2xl p-6"><div className="flex justify-between mb-2.5"><span className="text-base font-semibold text-c-text">{c.name}</span><span className={`text-sm font-bold ${isOk ? 'text-green-500' : 'text-orange-500'}`}>{c.type === 'count' ? `${c.current}/${c.target}일` : `${hideAmounts ? '•••••' : formatFullKRW(c.current)} / ${hideAmounts ? '•••••' : formatFullKRW(c.target)}`}</span></div><div className="progress-bar"><div className={`progress-fill ${isOk ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div></div>);
        })}</div>
      </div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">추천 챌린지</h3><div className="space-y-3">{['커피 비용 3만원 이하', '한달 저축률 40%', '1주일 외식 제로'].map((c, i) => <div key={i} className="flex items-center justify-between border border-c-border rounded-2xl p-6"><span className="text-base font-medium text-c-text">{c}</span><button className="text-sm bg-[#3182F6] text-white px-5 py-2 rounded-xl font-semibold">참여</button></div>)}</div></div>
      <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-2 text-green-500">보상 시스템</h3><p className="text-xs text-green-400">챌린지 3개 달성 시 절약액의 10%를 자유롭게 사용하세요!</p></div>
    </div>
  );
}

/* ─── PatternView ─── */
function PatternView({ transactions, hideAmounts, customCategories }) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth)), [transactions, currentMonth]);

  const timeData = useMemo(() => { const slots = [{ label: '07-09', min: 7, max: 9, amount: 0 }, { label: '09-12', min: 9, max: 12, amount: 0 }, { label: '12-14', min: 12, max: 14, amount: 0 }, { label: '14-18', min: 14, max: 18, amount: 0 }, { label: '18-21', min: 18, max: 21, amount: 0 }, { label: '21-24', min: 21, max: 24, amount: 0 }]; monthTx.forEach(t => { const h = parseInt(t.time.split(':')[0]); const s = slots.find(s => h >= s.min && h < s.max); if (s) s.amount += t.amount; }); return slots; }, [monthTx]);
  const dayData = useMemo(() => { const d = ['월', '화', '수', '목', '금', '토', '일'].map(d => ({ day: d, amount: 0 })); monthTx.forEach(t => { const di = new Date(t.date).getDay(); const mi = di === 0 ? 6 : di - 1; d[mi].amount += t.amount; }); return d; }, [monthTx]);
  const paymentData = useMemo(() => { const m = {}; monthTx.forEach(t => { const p = t.payment || '기타'; m[p] = (m[p] || 0) + t.amount; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [monthTx]);
  const topPlaces = useMemo(() => { const p = {}; monthTx.forEach(t => { if (t.place) { if (!p[t.place]) p[t.place] = { count: 0, amount: 0 }; p[t.place].count++; p[t.place].amount += t.amount; } }); return Object.entries(p).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([name, data]) => ({ name, ...data })); }, [monthTx]);

  return (
    <div className="px-5 py-5 space-y-6">
      <div><h3 className="font-bold text-lg text-c-text mb-4">시간대별 지출</h3><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={timeData}><XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B949E' }} axisLine={false} tickLine={false} /><YAxis width={50} tick={{ fontSize: 10, fill: '#8B949E' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /><Bar dataKey="amount" fill="#3182F6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">요일별 패턴</h3><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={dayData}><XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8B949E' }} axisLine={false} tickLine={false} /><YAxis width={50} tick={{ fontSize: 10, fill: '#8B949E' }} tickFormatter={v => formatKRW(v)} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip formatter={v => formatFullKRW(v)} />} /><Bar dataKey="amount" fill="#7C5CFC" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">결제 수단별</h3><div className="space-y-2.5">{paymentData.sort((a, b) => b.value - a.value).map(p => <div key={p.name} className="flex items-center gap-2"><span className="text-xs w-20 text-c-text2 font-medium">{p.name}</span><div className="flex-1 h-6 border border-c-border rounded-full overflow-hidden"><div className="h-full bg-[#3182F6] rounded-full transition-all duration-500" style={{ width: `${(p.value / Math.max(...paymentData.map(x => x.value))) * 100}%` }} /></div><span className="text-xs font-bold text-c-text w-20 text-right">{hideAmounts ? '•••••' : formatKRW(p.value)}</span></div>)}</div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">자주 가는 곳 TOP 5</h3><div className="space-y-2">{topPlaces.map((p, i) => <div key={p.name} className="flex items-center gap-3 py-2"><span className="w-7 h-7 rounded-full bg-[#3182F6] text-white text-xs flex items-center justify-center font-bold">{i + 1}</span><div className="flex-1"><div className="text-sm font-semibold text-c-text">{p.name}</div><div className="text-xs text-c-text2">{p.count}회 방문</div></div><span className="text-sm font-bold text-c-text">{hideAmounts ? '•••••' : formatFullKRW(p.amount)}</span></div>)}{topPlaces.length === 0 && <div className="text-sm text-c-text3 text-center py-6">데이터가 부족합니다</div>}</div></div>
      <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-2 text-blue-500">AI 인사이트</h3><div className="text-xs text-blue-400 space-y-1.5"><p>• 점심시간(12-14시)에 가장 많이 지출하고 있어요.</p><p>• 주말 지출이 평일보다 높은 편이에요.</p><p>• 도시락이나 집밥을 활용하면 식비를 30% 줄일 수 있어요.</p></div></div>
    </div>
  );
}

export default HouseholdTab;
