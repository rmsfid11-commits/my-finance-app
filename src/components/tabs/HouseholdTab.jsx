import { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatFullKRW, formatKRW, generateId, formatDate, formatTime, getDayOfWeek } from '../../utils/formatters';
import { PEER_DATA } from '../../data/initialData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, MessageSquare, Camera, Mic, Pencil, X, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Download, Image as ImageIcon } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import EditableNumber from '../EditableNumber';

const SUB_TABS = [
  { id: 'quick', label: '입력' }, { id: 'calendar', label: '달력' }, { id: 'daily', label: '일일' }, { id: 'search', label: '검색' },
  { id: 'weekly', label: '주간' }, { id: 'monthly', label: '월간' }, { id: 'compare', label: '비교' }, { id: 'yearly', label: '연간' },
  { id: 'income', label: '수입' }, { id: 'fixed', label: '고정지출' }, { id: 'installment', label: '할부' },
  { id: 'challenge', label: '챌린지' }, { id: 'pattern', label: '패턴' },
];
const TAB_ROWS = [[0,4,4],[4,8,4],[8,11,3],[11,13,2]];
const getCatColor = (cats, name) => cats.find(c => c.name === name)?.color || '#8B95A1';
const getCatIcon = (cats, name) => cats.find(c => c.name === name)?.icon || '📦';

const exportCSV = (data, filename) => {
  const h = '날짜,시간,금액,카테고리,장소,메모,결제수단,환불\n';
  const r = data.map(t => `${t.date},${t.time},${t.amount},${t.category},${t.place||''},${t.memo||''},${t.payment||''},${t.refunded?'Y':'N'}`).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+h+r],{type:'text/csv;charset=utf-8;'})); a.download = filename; a.click();
};

const readPhoto = (e, cb) => {
  const f = e.target.files?.[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { const img = new window.Image(); img.onload = () => { const c = document.createElement('canvas'); const s = Math.min(200/img.width,200/img.height,1); c.width=img.width*s; c.height=img.height*s; c.getContext('2d').drawImage(img,0,0,c.width,c.height); cb(c.toDataURL('image/jpeg',0.5)); }; img.src=r.result; };
  r.readAsDataURL(f);
};

/* ─── EditForm (reusable) ─── */
function EditForm({ editForm, setEditForm, onSave, onCancel, catNames, paymentMethods, showRefund, showPhoto }) {
  const fileRef = useRef(null);
  return (
    <div className="p-3 border border-[#3182F6]/30 rounded-xl space-y-2 animate-fade">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">금액</label><input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} /></div>
        <div><label className="text-xs text-c-text2">카테고리</label><select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-c-text2">장소</label><input type="text" value={editForm.place} onChange={e => setEditForm({...editForm, place: e.target.value})} /></div>
        <div><label className="text-xs text-c-text2">결제수단</label><select value={editForm.payment} onChange={e => setEditForm({...editForm, payment: e.target.value})}>{paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
      </div>
      <div><label className="text-xs text-c-text2">메모</label><input type="text" value={editForm.memo} onChange={e => setEditForm({...editForm, memo: e.target.value})} /></div>
      <div className="flex items-center gap-3">
        {showRefund && <label className="flex items-center gap-1.5 text-xs text-c-text2"><input type="checkbox" checked={editForm.refunded||false} onChange={e => setEditForm({...editForm, refunded: e.target.checked})} className="rounded" /> 환불</label>}
        {showPhoto && <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e => readPhoto(e, p => setEditForm(f=>({...f, photo:p})))} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-c-text2 border border-c-border rounded-lg px-2 py-1"><ImageIcon size={12}/> 사진</button>
          {editForm.photo && <img src={editForm.photo} className="w-8 h-8 rounded object-cover" />}
        </>}
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1"><Check size={12}/> 저장</button>
        <button onClick={onCancel} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
      </div>
    </div>
  );
}

/* ─── TxRow (reusable) ─── */
function TxRow({ tx, hideAmounts, customCategories, onEdit, onDelete, showDate }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-c-border last:border-0">
      {tx.photo && <img src={tx.photo} className="w-9 h-9 rounded-lg object-cover shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-c-text">{tx.place||tx.category}</div>
        <div className="text-sm text-c-text2">{showDate && `${tx.date} `}{tx.time} · <span style={{color:getCatColor(customCategories,tx.category)}}>{tx.category}</span>{tx.payment && <span className="ml-1 text-c-text3">· {tx.payment}</span>}{tx.refunded && <span className="ml-1 text-green-500 font-medium">환불</span>}</div>
      </div>
      <div className="text-right flex items-center gap-2 shrink-0">
        <span className={`text-base font-bold ${tx.refunded ? 'text-green-500 line-through' : 'text-red-500'}`}>{hideAmounts ? '•••••' : `${tx.refunded?'+':'-'}${formatFullKRW(tx.amount)}`}</span>
        {onEdit && <button onClick={() => onEdit(tx)} className="text-c-text3 hover:text-[#3182F6] p-1"><Pencil size={15}/></button>}
        {onDelete && <button onClick={() => onDelete(tx.id)} className="text-c-text3 hover:text-red-400 p-1"><Trash2 size={15}/></button>}
      </div>
    </div>
  );
}

/* ─── Main ─── */
function HouseholdTab({ profile, goals, budget, setBudget, transactions, fixedExpenses, setFixedExpenses, addTransaction, deleteTransaction, updateTransaction, hideAmounts, customQuickInputs, setCustomQuickInputs, customCategories, setCustomCategories, paymentMethods, setPaymentMethods }) {
  const [subTab, setSubTab] = useState('quick');
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const catNames = useMemo(() => customCategories.map(c => c.name), [customCategories]);
  const sharedProps = { transactions, hideAmounts, customCategories, catNames, paymentMethods, deleteTransaction, updateTransaction };

  // #4 서브탭 정리 - 메인 4개 + 더보기
  const mainTabs = SUB_TABS.slice(0, 4);
  const moreTabs = SUB_TABS.slice(4);

  return (
    <div className="animate-slide">
      <div className="glass flex-1 flex flex-col">
        <div className="grid grid-cols-4 border-b border-c-border">
          {mainTabs.map(({id,label},i) => (
            <button key={id} onClick={() => setSubTab(id)} className={`py-7 text-lg font-bold text-center transition-all relative ${i<3?'border-r border-c-border':''} ${subTab===id?'text-[#3182F6] bg-[#3182F6]/5':'text-c-text3 active:bg-c-subtle'}`}>
              {label}
              {subTab===id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#3182F6] rounded-full"/>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowMoreTabs(!showMoreTabs)} className="py-2 text-xs font-bold text-c-text3 text-center border-b border-c-border active:bg-c-subtle transition-colors">
          {showMoreTabs ? '접기 ▲' : `더보기 ▼ (${moreTabs.length}개)`}
          {moreTabs.some(t => t.id === subTab) && !showMoreTabs && <span className="ml-1 text-[#3182F6]">· {SUB_TABS.find(t=>t.id===subTab)?.label}</span>}
        </button>
        {showMoreTabs && (
          <div className="animate-fade">
            {[[0,4,4],[4,5,1],[5,9,4]].map(([from,to,cols], ri) => {
              const slice = moreTabs.slice(from, to);
              if (slice.length === 0) return null;
              return (
                <div key={ri} className={`grid border-b border-c-border ${slice.length>=4?'grid-cols-4':slice.length===3?'grid-cols-3':slice.length===2?'grid-cols-2':'grid-cols-1'}`}>
                  {slice.map(({id,label},i) => (
                    <button key={id} onClick={() => { setSubTab(id); setShowMoreTabs(false); }} className={`py-5 text-base font-bold text-center transition-all relative ${i<slice.length-1?'border-r border-c-border':''} ${subTab===id?'text-[#3182F6] bg-[#3182F6]/5':'text-c-text3 active:bg-c-subtle'}`}>
                      {label}
                      {subTab===id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-[#3182F6] rounded-full"/>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {subTab==='quick' && <QuickInput addTransaction={addTransaction} {...sharedProps} customQuickInputs={customQuickInputs} setCustomQuickInputs={setCustomQuickInputs} setCustomCategories={setCustomCategories} />}
        {subTab==='calendar' && <CalendarView {...sharedProps} />}
        {subTab==='daily' && <DailyView budget={budget} {...sharedProps} />}
        {subTab==='search' && <SearchView {...sharedProps} />}
        {subTab==='weekly' && <WeeklyView transactions={transactions} budget={budget} hideAmounts={hideAmounts} profile={profile} />}
        {subTab==='monthly' && <MonthlyView transactions={transactions} budget={budget} setBudget={setBudget} profile={profile} fixedExpenses={fixedExpenses} hideAmounts={hideAmounts} customCategories={customCategories} catNames={catNames} />}
        {subTab==='compare' && <CompareView transactions={transactions} hideAmounts={hideAmounts} customCategories={customCategories} />}
        {subTab==='yearly' && <YearlyView transactions={transactions} hideAmounts={hideAmounts} />}
        {subTab==='income' && <IncomeView profile={profile} hideAmounts={hideAmounts} />}
        {subTab==='fixed' && <FixedView fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses} hideAmounts={hideAmounts} customCategories={customCategories} catNames={catNames} />}
        {subTab==='installment' && <InstallmentView hideAmounts={hideAmounts} />}
        {subTab==='challenge' && <ChallengeView transactions={transactions} budget={budget} hideAmounts={hideAmounts} />}
        {subTab==='pattern' && <PatternView transactions={transactions} hideAmounts={hideAmounts} customCategories={customCategories} />}
      </div>
    </div>
  );
}

/* ─── QuickInput ─── */
function QuickInput({ addTransaction, hideAmounts, customQuickInputs, setCustomQuickInputs, customCategories, setCustomCategories, paymentMethods, catNames, transactions, deleteTransaction, updateTransaction }) {
  const [showManual, setShowManual] = useState(false);
  const [showSMS, setShowSMS] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', amount: '', category: catNames[0]||'식비', icon: '🍚' });
  const [form, setForm] = useState({ amount: '', category: catNames[0]||'식비', memo: '', place: '', payment: '카드', photo: null });
  const [smsText, setSmsText] = useState('');
  const [smsPayment, setSmsPayment] = useState('카드');
  const [showCatManage, setShowCatManage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const fileRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const recentTx = useMemo(() => transactions.filter(t => t.date===today).sort((a,b) => b.time.localeCompare(a.time)).slice(0,10), [transactions, today]);

  const handleQuick = (item) => { const now = new Date(); addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: item.amount, category: item.category, subcategory: item.label, place: item.label, memo: '', payment: '카드', auto: false }); };
  // #8 카테고리 자동 추천
  const suggestCategory = (place) => {
    if (!place) return;
    const prev = transactions.find(t => t.place && t.place.toLowerCase() === place.toLowerCase());
    if (prev) setForm(f => ({ ...f, category: prev.category }));
  };

  const handleManual = () => {
    if (!form.amount) return; const now = new Date();
    addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: parseInt(form.amount), category: form.category, subcategory: '', place: form.place, memo: form.memo, payment: form.payment, photo: form.photo, auto: false });
    setForm({ amount: '', category: catNames[0]||'식비', memo: '', place: '', payment: '카드', photo: null }); setShowManual(false);
  };
  const handleSMS = () => {
    const m = smsText.match(/(\d{1,3}(,\d{3})*)\s*원/); const p = smsText.match(/승인\s*([\w가-힣]+)/);
    if (m) { const now = new Date(); addTransaction({ id: generateId(), date: formatDate(now), time: formatTime(now), amount: parseInt(m[1].replace(/,/g,'')), category: '기타', subcategory: '', place: p?p[1]:'미확인', memo: 'SMS 자동인식', payment: smsPayment, auto: true }); setSmsText(''); setShowSMS(false); }
  };
  const startEditTx = (tx) => { setEditingId(tx.id); setEditForm({ amount: tx.amount, category: tx.category, place: tx.place||'', memo: tx.memo||'', payment: tx.payment||'카드', refunded: tx.refunded||false, photo: tx.photo||null }); };
  const saveEditTx = () => { updateTransaction(editingId, { ...editForm, amount: parseInt(editForm.amount)||0 }); setEditingId(null); };

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-c-text">자주 쓰는 항목</h3>
          <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-xl transition-colors ${editMode ? 'text-[#3182F6] bg-[#3182F6]/10' : 'text-c-text3'}`}><Pencil size={18}/></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {customQuickInputs.map((item,idx) => (
            <div key={`${item.label}-${idx}`} className="relative">
              <button onClick={() => !editMode && handleQuick(item)} className={`w-full rounded-2xl py-8 px-5 text-center transition-all border border-c-border ${editMode ? 'opacity-80' : 'hover:bg-c-subtle active:scale-95'}`}>
                <div className="text-lg font-bold text-c-text mb-1.5"><span className="text-sm mr-1">{item.icon}</span>{item.label}</div>
                <div className="text-base text-c-text2">{hideAmounts ? '•••••' : formatFullKRW(item.amount)}</div>
              </button>
              {editMode && <button onClick={() => setCustomQuickInputs(p=>p.filter((_,i)=>i!==idx))} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"><X size={16}/></button>}
            </div>
          ))}
          {editMode && <button onClick={() => setShowAddItem(!showAddItem)} className="rounded-2xl py-8 px-5 text-center border-2 border-dashed border-c-border hover:border-[#3182F6]/50"><Plus size={32} className="mx-auto text-c-text3 mb-3"/><div className="text-lg text-c-text3">추가</div></button>}
        </div>
        {showAddItem && editMode && (
          <div className="mt-3 p-4 border border-c-border rounded-2xl space-y-2 animate-fade">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-c-text2">라벨</label><input type="text" value={newItem.label} onChange={e => setNewItem({...newItem, label: e.target.value})} placeholder="항목명" /></div>
              <div><label className="text-xs text-c-text2">금액</label><input type="number" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} placeholder="금액" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-c-text2">카테고리</label><select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>{catNames.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-c-text2">아이콘</label><input type="text" value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} placeholder="🍚" /></div>
            </div>
            <button onClick={() => { if(!newItem.label||!newItem.amount)return; setCustomQuickInputs(p=>[...p,{label:newItem.label,amount:parseInt(newItem.amount),category:newItem.category,icon:newItem.icon}]); setNewItem({label:'',amount:'',category:catNames[0]||'식비',icon:'🍚'}); setShowAddItem(false); }} className="w-full btn-primary py-2.5 text-sm">항목 추가</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setShowManual(!showManual)} className="flex items-center justify-center gap-3 py-6 px-5 rounded-2xl border border-c-border text-lg font-bold text-c-text active:scale-[0.98]"><Plus size={26} className="text-[#3182F6]"/> 직접 입력</button>
        <button onClick={() => setShowSMS(!showSMS)} className="flex items-center justify-center gap-3 py-6 px-5 rounded-2xl border border-c-border text-lg font-bold text-c-text active:scale-[0.98]"><MessageSquare size={26} className="text-green-500"/> SMS 입력</button>
        <button className="flex items-center justify-center gap-3 py-6 px-5 rounded-2xl border border-c-border text-lg font-bold text-c-text opacity-50"><Camera size={26} className="text-purple-500"/> 영수증 OCR</button>
        <button className="flex items-center justify-center gap-3 py-6 px-5 rounded-2xl border border-c-border text-lg font-bold text-c-text opacity-50"><Mic size={26} className="text-orange-500"/> 음성 입력</button>
      </div>

      {showManual && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <h3 className="font-bold text-base text-c-text">직접 입력</h3>
          <div><label className="text-xs text-c-text2">금액</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="금액 입력" /></div>
          <div><label className="text-xs text-c-text2">카테고리</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{catNames.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-xs text-c-text2">결제수단</label><select value={form.payment} onChange={e => setForm({...form, payment: e.target.value})}>{paymentMethods.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="text-xs text-c-text2">장소</label><input type="text" value={form.place} onChange={e => { setForm({...form, place: e.target.value}); suggestCategory(e.target.value); }} placeholder="장소 (선택)" /></div>
          <div><label className="text-xs text-c-text2">메모</label><input type="text" value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} placeholder="메모 (선택)" /></div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e => readPhoto(e, p => setForm(f=>({...f,photo:p})))} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-c-text2 border border-c-border rounded-lg px-2 py-1.5"><ImageIcon size={12}/> 영수증 사진</button>
            {form.photo && <img src={form.photo} className="w-10 h-10 rounded-lg object-cover" />}
          </div>
          <button onClick={handleManual} className="w-full btn-primary py-3">저장하기</button>
        </div>
      )}

      {showSMS && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <h3 className="font-bold text-base text-c-text">SMS 자동인식</h3>
          <textarea value={smsText} onChange={e => setSmsText(e.target.value)} placeholder={"카드 사용 문자를 붙여넣기 하세요\n예: [신한] 15,000원 승인 스타벅스"} rows={3} className="w-full border border-c-border text-c-text rounded-2xl p-3 text-sm bg-transparent" />
          <div><label className="text-xs text-c-text2">결제수단</label><select value={smsPayment} onChange={e => setSmsPayment(e.target.value)}>{paymentMethods.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
          <button onClick={handleSMS} className="w-full btn-primary py-3">인식하기</button>
        </div>
      )}

      {recentTx.length > 0 && (
        <div>
          <h3 className="font-bold text-lg text-c-text mb-4">오늘 입력한 내역</h3>
          <div className="space-y-1">
            {recentTx.map(tx => editingId===tx.id
              ? <EditForm key={tx.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEditTx} onCancel={()=>setEditingId(null)} catNames={catNames} paymentMethods={paymentMethods} showRefund showPhoto />
              : <TxRow key={tx.id} tx={tx} hideAmounts={hideAmounts} customCategories={customCategories} onEdit={startEditTx} onDelete={deleteTransaction} />
            )}
          </div>
        </div>
      )}

      <CategoryManager customCategories={customCategories} setCustomCategories={setCustomCategories} showCatManage={showCatManage} setShowCatManage={setShowCatManage} />
    </div>
  );
}

/* ─── CategoryManager ─── */
const PRESET_COLORS = ['#FF4757','#3182F6','#00C48C','#7C5CFC','#FF9F43','#FF6B81','#0ABDE3','#8B95A1'];
function CategoryManager({ customCategories, setCustomCategories, showCatManage, setShowCatManage }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '', color: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', icon: '📌', color: PRESET_COLORS[0] });

  return (
    <div className="border border-c-border rounded-2xl overflow-hidden">
      <button onClick={() => setShowCatManage(!showCatManage)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-c-text">
        <span>카테고리 관리</span>{showCatManage ? <ChevronUp size={16} className="text-c-text3"/> : <ChevronDown size={16} className="text-c-text3"/>}
      </button>
      {showCatManage && (
        <div className="px-4 pb-4 space-y-2 animate-fade">
          {customCategories.map((cat,idx) => (
            <div key={`${cat.name}-${idx}`}>
              {editIdx===idx ? (
                <div className="p-3 border border-[#3182F6]/30 rounded-xl space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="이름" className="text-sm" />
                    <input type="text" value={editForm.icon} onChange={e => setEditForm({...editForm, icon: e.target.value})} placeholder="아이콘" className="text-sm" />
                    <div className="flex gap-1 items-center flex-wrap">{PRESET_COLORS.map(c=><button key={c} onClick={()=>setEditForm({...editForm,color:c})} className={`w-5 h-5 rounded-full ${editForm.color===c?'ring-2 ring-offset-1 ring-[#3182F6]':''}`} style={{backgroundColor:c}}/>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>{if(!editForm.name)return; setCustomCategories(p=>p.map((c,i)=>i===editIdx?{...editForm}:c)); setEditIdx(null);}} className="flex-1 btn-primary py-1.5 text-xs"><Check size={12}/> 저장</button>
                    <button onClick={()=>setEditIdx(null)} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <span className="text-lg">{cat.icon}</span><span className="flex-1 text-sm font-medium text-c-text">{cat.name}</span>
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor:cat.color}}/>
                  <button onClick={()=>{setEditIdx(idx);setEditForm({name:cat.name,icon:cat.icon,color:cat.color});}} className="text-c-text3 p-1"><Pencil size={14}/></button>
                  <button onClick={()=>setCustomCategories(p=>p.filter((_,i)=>i!==idx))} className="text-c-text3 p-1"><Trash2 size={14}/></button>
                </div>
              )}
            </div>
          ))}
          {showAdd ? (
            <div className="p-3 border border-dashed border-c-border rounded-xl space-y-2 animate-fade">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="카테고리 이름" className="text-sm" />
                <input type="text" value={addForm.icon} onChange={e => setAddForm({...addForm, icon: e.target.value})} placeholder="이모지" className="text-sm" />
              </div>
              <div className="flex gap-1.5 items-center"><span className="text-xs text-c-text2 mr-1">색상</span>{PRESET_COLORS.map(c=><button key={c} onClick={()=>setAddForm({...addForm,color:c})} className={`w-5 h-5 rounded-full ${addForm.color===c?'ring-2 ring-offset-1 ring-[#3182F6]':''}`} style={{backgroundColor:c}}/>)}</div>
              <div className="flex gap-2">
                <button onClick={()=>{if(!addForm.name)return; setCustomCategories(p=>[...p,{...addForm}]); setAddForm({name:'',icon:'📌',color:PRESET_COLORS[0]}); setShowAdd(false);}} className="flex-1 btn-primary py-1.5 text-xs">추가</button>
                <button onClick={()=>setShowAdd(false)} className="flex-1 py-1.5 text-xs border border-c-border rounded-xl text-c-text2">취소</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowAdd(true)} className="w-full py-2 border-2 border-dashed border-c-border rounded-xl text-xs text-c-text2 hover:border-[#3182F6]/50">+ 카테고리 추가</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── CalendarView (NEW) ─── */
function CalendarView({ transactions, hideAmounts, customCategories, deleteTransaction }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selDate, setSelDate] = useState(null);

  const cells = useMemo(() => {
    const first = new Date(month.y, month.m, 1), last = new Date(month.y, month.m+1, 0);
    const arr = Array.from({length: first.getDay()}, () => null);
    for (let d=1; d<=last.getDate(); d++) {
      const ds = `${month.y}-${String(month.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      arr.push({ day: d, date: ds, total: transactions.filter(t=>t.date===ds&&!t.refunded).reduce((s,t)=>s+t.amount,0) });
    }
    return arr;
  }, [month, transactions]);

  const selTx = useMemo(() => selDate ? transactions.filter(t=>t.date===selDate).sort((a,b)=>b.time.localeCompare(a.time)) : [], [transactions, selDate]);

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={()=>setMonth(p=>p.m===0?{y:p.y-1,m:11}:{...p,m:p.m-1})}><ChevronLeft size={22} className="text-c-text2"/></button>
        <h3 className="font-bold text-lg text-c-text">{month.y}년 {month.m+1}월</h3>
        <button onClick={()=>setMonth(p=>p.m===11?{y:p.y+1,m:0}:{...p,m:p.m+1})}><ChevronRight size={22} className="text-c-text2"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['일','월','화','수','목','금','토'].map(d=><div key={d} className="text-xs font-bold text-c-text3 py-1">{d}</div>)}
        {cells.map((c,i) => c ? (
          <button key={i} onClick={()=>setSelDate(c.date)} className={`py-2 rounded-lg text-xs transition-all ${selDate===c.date?'bg-[#3182F6] text-white':'hover:bg-c-subtle'}`}>
            <div className="font-semibold">{c.day}</div>
            {c.total>0 && <div className={`text-[10px] ${selDate===c.date?'text-white/80':'text-red-400'}`}>{formatKRW(c.total)}</div>}
          </button>
        ) : <div key={i}/>)}
      </div>
      {selDate && (
        <div>
          <h4 className="font-bold text-base text-c-text mb-2">{selDate} 내역</h4>
          {selTx.length > 0
            ? selTx.map(tx => <TxRow key={tx.id} tx={tx} hideAmounts={hideAmounts} customCategories={customCategories} onDelete={deleteTransaction} />)
            : <div className="text-sm text-c-text3 text-center py-4">내역 없음</div>}
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

  const dayTx = useMemo(() => transactions.filter(t=>t.date===selectedDate).sort((a,b)=>b.time.localeCompare(a.time)), [transactions, selectedDate]);
  const dayTotal = dayTx.filter(t=>!t.refunded).reduce((s,t)=>s+t.amount, 0);
  const dailyBudget = Math.round(Object.values(budget).reduce((s,v)=>s+v,0)/30);
  const catData = useMemo(() => { const b={}; dayTx.filter(t=>!t.refunded).forEach(t=>b[t.category]=(b[t.category]||0)+t.amount); return Object.entries(b).map(([name,value])=>({name,value,fill:getCatColor(customCategories,name)})); }, [dayTx,customCategories]);
  const dates = useMemo(() => { const d=[]; for(let i=0;i<7;i++){const dt=new Date();dt.setDate(dt.getDate()-i);d.push(formatDate(dt));} return d; }, []);

  const startEdit = (tx) => { setEditingId(tx.id); setEditForm({ amount: tx.amount, category: tx.category, place: tx.place||'', memo: tx.memo||'', payment: tx.payment||'카드', refunded: tx.refunded||false, photo: tx.photo||null }); };
  const saveEdit = () => { updateTransaction(editingId, { ...editForm, amount: parseInt(editForm.amount)||0 }); setEditingId(null); };

  return (
    <div className="px-5 py-5 space-y-6">
      <div className="flex gap-2.5 overflow-x-auto pb-2">{dates.map(d=><button key={d} onClick={()=>setSelectedDate(d)} className={`px-5 py-3 rounded-xl text-sm whitespace-nowrap min-w-[72px] text-center transition-all ${selectedDate===d?'bg-[#3182F6] text-white font-semibold shadow-lg shadow-blue-500/25':'border border-c-border text-c-text2'}`}><div>{d.substring(5)}</div><div className="text-xs opacity-70">{getDayOfWeek(d)}</div></button>)}</div>
      <div>
        <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-base text-c-text">오늘 요약</h3><span className="text-xs text-c-text3">{selectedDate}</span></div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">총 지출</div><div className="text-base font-bold text-red-500">{hideAmounts?'•••••':formatFullKRW(dayTotal)}</div></div>
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">일 예산</div><div className="text-base font-bold text-c-text">{hideAmounts?'•••••':formatFullKRW(dailyBudget)}</div></div>
          <div className="text-center border border-c-border rounded-2xl p-4"><div className="text-xs font-medium text-c-text2 mb-2">잔여</div><div className={`text-base font-bold ${dailyBudget-dayTotal>=0?'text-green-500':'text-red-500'}`}>{hideAmounts?'•••••':formatFullKRW(dailyBudget-dayTotal)}</div></div>
        </div>
        {catData.length>0 && <div className="h-32"><ResponsiveContainer width="100%" height="100%"><BarChart data={catData} layout="vertical"><XAxis type="number" hide/><YAxis type="category" dataKey="name" tick={{fontSize:12,fill:'#8B949E'}} width={45} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Bar dataKey="value" radius={[0,8,8,0]}>{catData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar></BarChart></ResponsiveContainer></div>}
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">내역</h3>
        {dayTx.length > 0 ? (
          <div className="space-y-1">
            {dayTx.map(tx => editingId===tx.id
              ? <EditForm key={tx.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={()=>setEditingId(null)} catNames={catNames} paymentMethods={paymentMethods} showRefund showPhoto />
              : <TxRow key={tx.id} tx={tx} hideAmounts={hideAmounts} customCategories={customCategories} onEdit={startEdit} onDelete={deleteTransaction} />
            )}
          </div>
        ) : <div className="text-center py-8"><div className="text-base text-c-text3 mb-2">내역이 없습니다</div><div className="text-xs text-c-text3">위의 빠른 입력이나 직접 입력으로 지출을 기록해보세요</div></div>}
      </div>
    </div>
  );
}

/* ─── SearchView (NEW) ─── */
function SearchView({ transactions, deleteTransaction, updateTransaction, hideAmounts, customCategories, paymentMethods, catNames }) {
  const [q, setQ] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return transactions.filter(t => (t.place||'').toLowerCase().includes(lq)||(t.memo||'').toLowerCase().includes(lq)||t.category.toLowerCase().includes(lq)||String(t.amount).includes(q))
      .sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)).slice(0,50);
  }, [q, transactions]);

  const startEdit = (tx) => { setEditingId(tx.id); setEditForm({ amount:tx.amount, category:tx.category, place:tx.place||'', memo:tx.memo||'', payment:tx.payment||'카드', refunded:tx.refunded||false, photo:tx.photo||null }); };
  const saveEdit = () => { updateTransaction(editingId, { ...editForm, amount: parseInt(editForm.amount)||0 }); setEditingId(null); };

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-c-text3"/>
        <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="장소, 메모, 카테고리, 금액 검색" className="w-full pl-10 pr-4 py-3 border border-c-border rounded-xl text-sm bg-transparent text-c-text" />
      </div>
      {q && <div className="text-xs text-c-text3">{results.length}건</div>}
      <div className="space-y-1">
        {results.map(tx => editingId===tx.id
          ? <EditForm key={tx.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={()=>setEditingId(null)} catNames={catNames} paymentMethods={paymentMethods} showRefund showPhoto />
          : <TxRow key={tx.id} tx={tx} hideAmounts={hideAmounts} customCategories={customCategories} onEdit={startEdit} onDelete={deleteTransaction} showDate />
        )}
      </div>
    </div>
  );
}

/* ─── WeeklyView ─── */
function WeeklyView({ transactions, budget, hideAmounts, profile }) {
  const weekData = useMemo(() => {
    const days=[], now=new Date(), dow=now.getDay(), mon=new Date(now);
    mon.setDate(now.getDate()-(dow===0?6:dow-1));
    for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);const ds=formatDate(d);const dt=transactions.filter(t=>t.date===ds&&!t.refunded);days.push({day:getDayOfWeek(d),date:ds.substring(5),amount:dt.reduce((s,t)=>s+t.amount,0)});}
    return days;
  }, [transactions]);
  const weekTotal = weekData.reduce((s,d)=>s+d.amount,0);
  const peerAvg = Math.round(PEER_DATA.reduce((s,p)=>s+p.totalExpense,0)/PEER_DATA.length/4);

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">주간 요약</h3>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="border border-c-border rounded-2xl p-5 text-center"><div className="text-sm font-medium text-red-500 mb-2">주간 지출</div><div className="text-xl font-bold text-red-500">{hideAmounts?'•••••':formatKRW(weekTotal)}</div></div>
          <div className="border border-c-border rounded-2xl p-5 text-center"><div className="text-sm font-medium text-c-text2 mb-2">일 평균</div><div className="text-xl font-bold text-c-text">{hideAmounts?'•••••':formatFullKRW(Math.round(weekTotal/7))}</div></div>
        </div>
        <div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekData}><XAxis dataKey="day" tick={{fontSize:12,fill:'#8B949E'}} axisLine={false} tickLine={false}/><YAxis width={50} tick={{fontSize:10,fill:'#8B949E'}} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Bar dataKey="amount" fill="#FF4757" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-sm mb-2">또래 비교 ({profile.age}세 {profile.job || '직장인'})</h3>
        <div className="flex justify-between text-sm"><span>내 주간 지출</span><span className="font-bold">{hideAmounts?'•••••':formatKRW(weekTotal)}</span></div>
        <div className="flex justify-between text-sm"><span>또래 평균</span><span className="font-semibold">{hideAmounts?'•••••':formatKRW(peerAvg)}</span></div>
        <div className={`text-xs mt-2 font-semibold ${weekTotal<peerAvg?'text-green-300':'text-red-300'}`}>{hideAmounts?'•••••':(weekTotal<peerAvg?`또래보다 ${formatFullKRW(peerAvg-weekTotal)} 적게 쓰고 있어요!`:`또래보다 ${formatFullKRW(weekTotal-peerAvg)} 더 쓰고 있어요`)}</div>
      </div>
    </div>
  );
}

/* ─── MonthlyView (enhanced: budget alerts + CSV) ─── */
function MonthlyView({ transactions, budget, setBudget, profile, fixedExpenses, hideAmounts, customCategories, catNames }) {
  const currentMonth = new Date().toISOString().substring(0,7);
  const monthTx = useMemo(() => transactions.filter(t=>t.date.startsWith(currentMonth)), [transactions, currentMonth]);
  const monthTotal = monthTx.filter(t=>!t.refunded).reduce((s,t)=>s+t.amount,0);
  const fixedTotal = fixedExpenses.reduce((s,f)=>s+f.amount,0);
  const totalExpense = monthTotal + fixedTotal;
  const savings = profile.salary - totalExpense;
  const savingRate = (savings/profile.salary*100).toFixed(1);

  const catBreakdown = useMemo(() => {
    const b={}; monthTx.filter(t=>!t.refunded).forEach(t=>b[t.category]=(b[t.category]||0)+t.amount); fixedExpenses.forEach(f=>b[f.category]=(b[f.category]||0)+f.amount);
    return Object.entries(b).map(([name,value])=>({name,value,budget:budget[name]||0,usage:budget[name]?(value/budget[name]*100).toFixed(0):'-',fill:getCatColor(customCategories,name)})).sort((a,b)=>b.value-a.value);
  }, [monthTx, fixedExpenses, budget, customCategories]);

  const peerStats = useMemo(() => { const sr=parseFloat(savingRate); const bt=PEER_DATA.filter(p=>p.savingRate<sr).length; const avg=PEER_DATA.reduce((s,p)=>s+p.savingRate,0)/PEER_DATA.length; return {betterThan:bt,worseThan:600-bt,avgRate:avg.toFixed(1)}; }, [savingRate]);
  const pieData = catBreakdown.map(c=>({name:c.name,value:c.value}));
  const overBudget = catBreakdown.filter(c=>c.budget>0&&parseInt(c.usage)>=80);

  return (
    <div className="px-5 py-5 space-y-6">
      {/* Budget alerts */}
      {overBudget.length>0 && (
        <div className="space-y-2">
          {overBudget.map(c=>(
            <div key={c.name} className={`p-3 rounded-xl text-sm font-semibold ${parseInt(c.usage)>=100?'bg-red-500/10 text-red-500':'bg-yellow-500/10 text-yellow-500'}`}>
              ⚠️ {c.name} 예산 {c.usage}% 사용{parseInt(c.usage)>=100?' - 초과!':''}
            </div>
          ))}
        </div>
      )}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-c-text">월간 요약</h3>
          <button onClick={()=>exportCSV(monthTx, `지출_${currentMonth}.csv`)} className="flex items-center gap-1 text-xs text-[#3182F6] font-semibold"><Download size={14}/> CSV</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-green-500 mb-2">수입</div><div className="text-base font-bold text-green-500">{hideAmounts?'•••••':formatKRW(profile.salary)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-red-500 mb-2">지출</div><div className="text-base font-bold text-red-500">{hideAmounts?'•••••':formatKRW(totalExpense)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs font-medium text-purple-500 mb-2">저축</div><div className="text-base font-bold text-purple-500">{hideAmounts?'•••••':formatKRW(savings)}</div></div>
        </div>
        <div className="border border-c-border rounded-2xl p-5"><div className="flex justify-between text-sm mb-3"><span className="font-medium text-c-text">저축률</span><span className="font-bold text-purple-500">{hideAmounts?'•••••':`${savingRate}%`}</span></div><div className="progress-bar"><div className="progress-fill bg-purple-500" style={{width:`${Math.min(Math.max(parseFloat(savingRate),0),100)}%`}}/></div></div>
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">카테고리별</h3>
        {pieData.length>0 && <div className="h-52 mb-4"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3} cornerRadius={4}>{pieData.map((e,i)=><Cell key={i} fill={getCatColor(customCategories,e.name)}/>)}</Pie><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/></PieChart></ResponsiveContainer></div>}
        <div className="space-y-3">{catBreakdown.map(c=><div key={c.name} className="border-b border-c-border pb-3"><div className="flex justify-between items-center mb-2"><span className="text-base font-medium text-c-text">{c.name}</span><span className="text-base font-bold text-c-text">{hideAmounts?'•••••':formatFullKRW(c.value)}</span></div>{c.budget>0&&<><div className="progress-bar"><div className={`progress-fill ${parseInt(c.usage)>100?'bg-red-500':parseInt(c.usage)>80?'bg-yellow-500':'bg-green-500'}`} style={{width:`${Math.min(parseInt(c.usage)||0,100)}%`}}/></div><div className="flex justify-between text-sm text-c-text2 mt-1.5"><span>예산 <EditableNumber value={c.budget} onSave={(v)=>setBudget(prev=>({...prev,[c.name]:Math.round(v)}))} format={formatFullKRW}/></span><span className={parseInt(c.usage)>100?'text-red-500 font-bold':''}>{hideAmounts?'•••••':`${c.usage}%`}</span></div></>}</div>)}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-sm mb-3">또래 비교 ({profile.age}세 {profile.job || '직장인'} 600명)</h3>
        <div className="grid grid-cols-2 gap-3"><div className="bg-white/20 rounded-lg p-3 text-center"><div className="text-xs opacity-80">내 저축률</div><div className="text-xl font-bold">{hideAmounts?'•••••':`${savingRate}%`}</div></div><div className="bg-white/20 rounded-lg p-3 text-center"><div className="text-xs opacity-80">또래 평균</div><div className="text-xl font-bold">{hideAmounts?'•••••':`${peerStats.avgRate}%`}</div></div></div>
        <div className="mt-3 bg-white/10 rounded-lg p-3 text-center"><div className="text-sm">이긴 사람: <span className="font-bold text-yellow-300">{peerStats.betterThan}명</span> | 위: <span className="font-bold">{peerStats.worseThan}명</span></div><div className="text-xs opacity-70 mt-1">상위 {((peerStats.worseThan/600)*100).toFixed(0)}%</div></div>
      </div>
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">AI 분석</h3>
        <div className="space-y-2 text-sm">
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-green-500 mb-1">강점</div><p className="text-green-400 text-xs">{parseFloat(savingRate)>=30?`저축률 ${savingRate}% — 또래 상위권이에요! 꾸준히 유지하세요.`:parseFloat(savingRate)>=15?`저축률 ${savingRate}% — 평균적이에요. 조금만 더 아끼면 큰 차이!`:'가계부 기록을 시작한 것 자체가 훌륭합니다!'}</p></div>
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-yellow-500 mb-1">개선점</div><p className="text-yellow-400 text-xs">{catBreakdown.length>0?`${catBreakdown[0].name}(${hideAmounts?'•••••':formatFullKRW(catBreakdown[0].value)})이 가장 큰 비중이에요. 여기서 10% 줄이면 월 ${hideAmounts?'•••••':formatFullKRW(Math.round(catBreakdown[0].value*0.1))} 절약!`:'아직 지출 데이터가 부족해요. 기록을 계속하면 맞춤 분석을 제공할게요.'}</p></div>
          <div className="border border-c-border rounded-2xl p-4"><div className="font-bold text-blue-500 mb-1">다음달 목표</div><p className="text-blue-400 text-xs">저축률 {Math.min(parseFloat(savingRate)+5,50)}%를 목표로 해보세요! 월 {hideAmounts?'•••••':formatFullKRW(Math.round(profile.salary*(Math.min(parseFloat(savingRate)+5,50)/100)))} 저축 가능</p></div>
        </div>
      </div>
    </div>
  );
}

/* ─── CompareView (NEW) ─── */
function CompareView({ transactions, hideAmounts, customCategories }) {
  const now = new Date();
  const thisMonth = now.toISOString().substring(0,7);
  const lastMonth = (() => { const d=new Date(now); d.setMonth(d.getMonth()-1); return d.toISOString().substring(0,7); })();

  const thisData = useMemo(() => transactions.filter(t=>t.date.startsWith(thisMonth)&&!t.refunded), [transactions, thisMonth]);
  const lastData = useMemo(() => transactions.filter(t=>t.date.startsWith(lastMonth)&&!t.refunded), [transactions, lastMonth]);
  const thisTotal = thisData.reduce((s,t)=>s+t.amount,0);
  const lastTotal = lastData.reduce((s,t)=>s+t.amount,0);
  const diff = thisTotal - lastTotal;

  const catCompare = useMemo(() => {
    const cats={};
    thisData.forEach(t=>{cats[t.category]=cats[t.category]||{cur:0,prev:0};cats[t.category].cur+=t.amount;});
    lastData.forEach(t=>{cats[t.category]=cats[t.category]||{cur:0,prev:0};cats[t.category].prev+=t.amount;});
    return Object.entries(cats).map(([name,v])=>({name,cur:v.cur,prev:v.prev,diff:v.cur-v.prev,fill:getCatColor(customCategories,name)})).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));
  }, [thisData, lastData, customCategories]);

  const chartData = catCompare.slice(0,6).map(c=>({name:c.name, 지난달:c.prev, 이번달:c.cur}));

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">월별 비교</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">지난달</div><div className="text-lg font-bold text-c-text">{hideAmounts?'•••••':formatKRW(lastTotal)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">이번달</div><div className="text-lg font-bold text-c-text">{hideAmounts?'•••••':formatKRW(thisTotal)}</div></div>
        </div>
        <div className={`text-center p-3 rounded-xl text-sm font-bold ${diff>0?'bg-red-500/10 text-red-500':'bg-green-500/10 text-green-500'}`}>
          {hideAmounts?'•••••':`${diff>0?'▲':'▼'} ${formatFullKRW(Math.abs(diff))} ${diff>0?'더 씀':'절약'}`}
        </div>
      </div>
      {chartData.length>0 && (
        <div>
          <h3 className="font-bold text-base text-c-text mb-3">카테고리별 비교</h3>
          <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="name" tick={{fontSize:10,fill:'#8B949E'}} axisLine={false} tickLine={false}/><YAxis width={50} tick={{fontSize:9,fill:'#8B949E'}} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Bar dataKey="지난달" fill="#8B95A1" radius={[4,4,0,0]}/><Bar dataKey="이번달" fill="#3182F6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
        </div>
      )}
      <div>
        <h3 className="font-bold text-base text-c-text mb-3">증감 상세</h3>
        <div className="space-y-1">{catCompare.map(c=>(
          <div key={c.name} className="flex items-center gap-2 py-2.5 border-b border-c-border last:border-0">
            <span className="text-sm font-medium text-c-text w-16">{c.name}</span>
            <div className="flex-1 text-xs text-c-text2">{hideAmounts?'•••••':`${formatKRW(c.prev)} → ${formatKRW(c.cur)}`}</div>
            <span className={`text-xs font-bold ${c.diff>0?'text-red-500':c.diff<0?'text-green-500':'text-c-text3'}`}>{hideAmounts?'•••••':`${c.diff>0?'+':''}${formatKRW(c.diff)}`}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

/* ─── YearlyView (NEW) ─── */
function YearlyView({ transactions, hideAmounts }) {
  const year = new Date().getFullYear();
  const monthlyData = useMemo(() => Array.from({length:12},(_,i)=>{
    const m=`${year}-${String(i+1).padStart(2,'0')}`;
    return {month:`${i+1}월`, total: transactions.filter(t=>t.date.startsWith(m)&&!t.refunded).reduce((s,t)=>s+t.amount,0)};
  }), [transactions, year]);
  const yearTotal = monthlyData.reduce((s,d)=>s+d.total,0);
  const curMonth = new Date().getMonth()+1;
  const monthAvg = curMonth>0 ? Math.round(yearTotal/curMonth) : 0;
  const bestMonth = monthlyData.reduce((a,b)=>a.total<b.total?a:b);
  const worstMonth = monthlyData.filter(m=>m.total>0).reduce((a,b)=>a.total>b.total?a:b, monthlyData[0]);

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-c-text">{year}년 리포트</h3>
          <button onClick={()=>exportCSV(transactions.filter(t=>t.date.startsWith(String(year))),`지출_${year}.csv`)} className="flex items-center gap-1 text-xs text-[#3182F6] font-semibold"><Download size={14}/> CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">연간 총 지출</div><div className="text-lg font-bold text-red-500">{hideAmounts?'•••••':formatKRW(yearTotal)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">월 평균</div><div className="text-lg font-bold text-c-text">{hideAmounts?'•••••':formatKRW(monthAvg)}</div></div>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-base text-c-text mb-3">월별 추이</h3>
        <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyData}><XAxis dataKey="month" tick={{fontSize:10,fill:'#8B949E'}} axisLine={false} tickLine={false}/><YAxis width={50} tick={{fontSize:10,fill:'#8B949E'}} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Line type="monotone" dataKey="total" stroke="#3182F6" strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">최소 지출월</div><div className="text-sm font-bold text-green-500">{bestMonth.month}</div><div className="text-xs text-c-text2">{hideAmounts?'•••••':formatKRW(bestMonth.total)}</div></div>
        <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">최대 지출월</div><div className="text-sm font-bold text-red-500">{worstMonth.month}</div><div className="text-xs text-c-text2">{hideAmounts?'•••••':formatKRW(worstMonth.total)}</div></div>
      </div>
    </div>
  );
}

/* ─── IncomeView (NEW) ─── */
function IncomeView({ profile, hideAmounts }) {
  const [incomes, setIncomes] = useLocalStorage('finance_incomes', []);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ source: '', amount: '', date: formatDate(new Date()), memo: '' });

  const currentMonth = new Date().toISOString().substring(0,7);
  const monthIncomes = useMemo(() => incomes.filter(i=>i.date.startsWith(currentMonth)), [incomes, currentMonth]);
  const extraTotal = monthIncomes.reduce((s,i)=>s+i.amount,0);

  const handleAdd = () => {
    if (!form.source||!form.amount) return;
    setIncomes(p=>[...p, {id:generateId(), source:form.source, amount:parseInt(form.amount), date:form.date, memo:form.memo}]);
    setForm({source:'',amount:'',date:formatDate(new Date()),memo:''}); setShowAdd(false);
  };

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">이번달 수입</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">급여</div><div className="text-base font-bold text-green-500">{hideAmounts?'•••••':formatKRW(profile.salary)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">부수입</div><div className="text-base font-bold text-blue-500">{hideAmounts?'•••••':formatKRW(extraTotal)}</div></div>
          <div className="border border-c-border rounded-2xl p-4 text-center"><div className="text-xs text-c-text2 mb-1">총 수입</div><div className="text-base font-bold text-green-500">{hideAmounts?'•••••':formatKRW(profile.salary+extraTotal)}</div></div>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-base text-c-text mb-3">부수입 내역</h3>
        <div className="space-y-1">
          {monthIncomes.map(i=>(
            <div key={i.id} className="flex items-center gap-2 py-3 border-b border-c-border last:border-0">
              <div className="flex-1"><div className="text-sm font-medium text-c-text">{i.source}</div><div className="text-xs text-c-text2">{i.date}{i.memo&&` · ${i.memo}`}</div></div>
              <span className="text-sm font-bold text-green-500">{hideAmounts?'•••••':`+${formatFullKRW(i.amount)}`}</span>
              <button onClick={()=>setIncomes(p=>p.filter(x=>x.id!==i.id))} className="text-c-text3 p-1"><Trash2 size={14}/></button>
            </div>
          ))}
          {monthIncomes.length===0 && <div className="text-sm text-c-text3 text-center py-4">부수입 내역이 없습니다</div>}
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="w-full mt-3 py-2.5 border-2 border-dashed border-c-border rounded-2xl text-sm text-c-text2">+ 수입 추가</button>
      </div>
      {showAdd && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <input type="text" value={form.source} onChange={e=>setForm({...form,source:e.target.value})} placeholder="수입원 (예: 과외, 용돈)" />
          <input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="금액" />
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <input type="text" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} placeholder="메모 (선택)" />
          <button onClick={handleAdd} className="w-full btn-primary py-3">추가하기</button>
        </div>
      )}
    </div>
  );
}

/* ─── InstallmentView (NEW) ─── */
function InstallmentView({ hideAmounts }) {
  const [installments, setInstallments] = useLocalStorage('finance_installments', []);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', totalAmount: '', months: '3', startDate: formatDate(new Date()) });

  const monthlyTotal = installments.reduce((s,inst) => {
    const end = new Date(inst.startDate); end.setMonth(end.getMonth()+inst.months);
    return new Date()<end ? s+Math.round(inst.totalAmount/inst.months) : s;
  }, 0);

  const handleAdd = () => {
    if (!form.name||!form.totalAmount) return;
    setInstallments(p=>[...p, {id:generateId(), name:form.name, totalAmount:parseInt(form.totalAmount), months:parseInt(form.months), startDate:form.startDate}]);
    setForm({name:'',totalAmount:'',months:'3',startDate:formatDate(new Date())}); setShowAdd(false);
  };

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-c-text">할부 관리</h3>
          <div className="text-sm font-bold text-orange-500">월 {hideAmounts?'•••••':formatFullKRW(monthlyTotal)}</div>
        </div>
        <div className="space-y-3">
          {installments.map(inst => {
            const monthly=Math.round(inst.totalAmount/inst.months);
            const elapsed=Math.max(1,Math.min(inst.months,Math.ceil((new Date()-new Date(inst.startDate))/(30*24*60*60*1000))));
            const remaining=Math.max(0,inst.months-elapsed);
            const pct=Math.round(elapsed/inst.months*100);
            return (
              <div key={inst.id} className="border border-c-border rounded-2xl p-4">
                <div className="flex justify-between mb-2"><span className="text-base font-semibold text-c-text">{inst.name}</span><button onClick={()=>setInstallments(p=>p.filter(x=>x.id!==inst.id))} className="text-c-text3"><Trash2 size={14}/></button></div>
                <div className="text-xs text-c-text2 mb-2">월 {hideAmounts?'•••••':formatFullKRW(monthly)} · {elapsed}/{inst.months}개월 · 잔여 {remaining}개월</div>
                <div className="progress-bar"><div className="progress-fill bg-orange-500" style={{width:`${pct}%`}}/></div>
                <div className="flex justify-between text-xs text-c-text2 mt-1"><span>납부 {hideAmounts?'•••••':formatFullKRW(monthly*elapsed)}</span><span>총 {hideAmounts?'•••••':formatFullKRW(inst.totalAmount)}</span></div>
              </div>
            );
          })}
          {installments.length===0 && <div className="text-sm text-c-text3 text-center py-4">등록된 할부가 없습니다</div>}
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="w-full mt-3 py-2.5 border-2 border-dashed border-c-border rounded-2xl text-sm text-c-text2">+ 할부 추가</button>
      </div>
      {showAdd && (
        <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade">
          <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="항목명 (예: 노트북, TV)" />
          <input type="number" value={form.totalAmount} onChange={e=>setForm({...form,totalAmount:e.target.value})} placeholder="총 금액" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-c-text2">개월수</label><select value={form.months} onChange={e=>setForm({...form,months:e.target.value})}>{[2,3,6,10,12,18,24,36].map(m=><option key={m} value={m}>{m}개월</option>)}</select></div>
            <div><label className="text-xs text-c-text2">시작일</label><input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} /></div>
          </div>
          <button onClick={handleAdd} className="w-full btn-primary py-3">추가하기</button>
        </div>
      )}
    </div>
  );
}

/* ─── FixedView ─── */
function FixedView({ fixedExpenses, setFixedExpenses, hideAmounts, customCategories, catNames }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', day: '1', category: catNames[0]||'생활', alert: true });
  const totalFixed = fixedExpenses.reduce((s,f)=>s+f.amount,0);
  const today = new Date().getDate();
  const upcoming = fixedExpenses.filter(f=>f.day>=today).sort((a,b)=>a.day-b.day);

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-base text-c-text">고정지출 관리</h3><div className="text-sm font-bold text-red-500">월 {hideAmounts?'•••••':formatFullKRW(totalFixed)}</div></div>
        <div className="space-y-1">{fixedExpenses.map(e=><div key={e.id} className="flex items-center gap-3 py-3 border-b border-c-border last:border-0"><div className="flex-1 min-w-0"><div className="text-base font-medium text-c-text">{e.name}</div><div className="text-sm text-c-text2">매월 {e.day}일 · <span style={{color:getCatColor(customCategories,e.category)}}>{e.category}</span></div></div><div className="text-right flex items-center gap-3 shrink-0"><span className="text-base font-bold text-red-500">{hideAmounts?'•••••':formatFullKRW(e.amount)}</span><button onClick={()=>setFixedExpenses(p=>p.filter(f=>f.id!==e.id))} className="text-c-text3"><Trash2 size={16}/></button></div></div>)}</div>
        <button onClick={()=>setShowAdd(!showAdd)} className="w-full mt-4 py-2.5 border-2 border-dashed border-c-border rounded-2xl text-sm text-c-text2">+ 고정지출 추가</button>
      </div>
      {showAdd && <div className="p-4 border border-c-border rounded-2xl space-y-3 animate-fade"><h3 className="font-bold text-base text-c-text">고정지출 추가</h3><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="항목명"/><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="금액"/><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-c-text2">결제일</label><select value={form.day} onChange={e=>setForm({...form,day:e.target.value})}>{Array.from({length:28},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}일</option>)}</select></div><div><label className="text-xs text-c-text2">카테고리</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{catNames.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div><button onClick={()=>{if(!form.name||!form.amount)return;setFixedExpenses(p=>[...p,{id:generateId(),name:form.name,amount:parseInt(form.amount),day:parseInt(form.day),category:form.category,alert:form.alert}]);setForm({name:'',amount:'',day:'1',category:catNames[0]||'생활',alert:true});setShowAdd(false);}} className="w-full btn-primary py-3">추가하기</button></div>}
      {upcoming.length>0 && <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-3 text-[#FF9F43]">다가오는 결제</h3>{upcoming.map(e=><div key={e.id} className="flex justify-between text-sm py-1.5"><span className="text-c-text2">{e.day}일 - {e.name}</span><span className="font-bold text-[#FF9F43]">{hideAmounts?'•••••':formatFullKRW(e.amount)}</span></div>)}<div className="border-t border-c-border mt-2 pt-2 flex justify-between text-sm font-bold text-[#FF9F43]"><span>총 예정액</span><span>{hideAmounts?'•••••':formatFullKRW(upcoming.reduce((s,e)=>s+e.amount,0))}</span></div></div>}
    </div>
  );
}

/* ─── ChallengeView (#9 실제 동작) ─── */
function ChallengeView({ transactions, budget, hideAmounts }) {
  const [joined, setJoined] = useLocalStorage('finance_challenges', []);
  const currentMonth = new Date().toISOString().substring(0,7);
  const monthTx = transactions.filter(t=>t.date.startsWith(currentMonth)&&!t.refunded);

  const defaultChallenges = [
    {id:'food50',name:'식비 50만원 이하',target:500000,getCurrent:tx=>tx.filter(t=>t.category==='식비').reduce((s,t)=>s+t.amount,0)},
    {id:'transport15',name:'교통비 15만원 이하',target:150000,getCurrent:tx=>tx.filter(t=>t.category==='교통').reduce((s,t)=>s+t.amount,0)},
    {id:'nospend5',name:'무지출 데이 5일',target:5,getCurrent:tx=>new Date().getDate()-new Set(tx.map(t=>t.date)).size,type:'count'},
  ];
  const recommendedChallenges = [
    {id:'coffee3',name:'커피 비용 3만원 이하',target:30000,getCurrent:tx=>tx.filter(t=>(t.place||'').includes('커피')||(t.place||'').includes('스타벅스')||(t.place||'').includes('이디야')).reduce((s,t)=>s+t.amount,0)},
    {id:'save40',name:'한달 저축률 40%',target:40,getCurrent:()=>40,type:'rate'},
    {id:'noeat7',name:'1주일 외식 제로',target:0,getCurrent:tx=>{const w=new Date();w.setDate(w.getDate()-7);const ws=w.toISOString().split('T')[0];return tx.filter(t=>t.date>=ws&&(t.place||'').match(/외식|식당|맛집|레스토랑/)).length;},type:'zero'},
  ];

  const allActive = [...defaultChallenges, ...recommendedChallenges.filter(c => joined.includes(c.id))];
  const unjoined = recommendedChallenges.filter(c => !joined.includes(c.id));

  return (
    <div className="px-5 py-5 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-c-text mb-4">진행 중 챌린지</h3>
        <div className="space-y-4">{allActive.map(c=>{
          const current = c.getCurrent(monthTx);
          const isOk = c.type==='count'?current>=c.target:c.type==='zero'?current===0:current<=c.target;
          const pct = c.type==='count'?Math.min(current/c.target*100,100):c.type==='zero'?(current===0?100:0):Math.max((c.target-current)/c.target*100,0);
          return (<div key={c.id} className={`border rounded-2xl p-6 ${isOk?'border-green-500/30 bg-green-500/5':'border-c-border'}`}><div className="flex justify-between mb-2.5"><span className="text-base font-semibold text-c-text">{c.name}</span><span className={`text-sm font-bold ${isOk?'text-green-500':'text-orange-500'}`}>{isOk?'달성!':c.type==='count'?`${current}/${c.target}일`:`${hideAmounts?'•••••':formatFullKRW(current)} / ${hideAmounts?'•••••':formatFullKRW(c.target)}`}</span></div><div className="progress-bar"><div className={`progress-fill ${isOk?'bg-green-500':'bg-orange-500'}`} style={{width:`${Math.min(pct,100)}%`}}/></div></div>);
        })}</div>
      </div>
      {unjoined.length > 0 && <div><h3 className="font-bold text-lg text-c-text mb-4">추천 챌린지</h3><div className="space-y-3">{unjoined.map(c=><div key={c.id} className="flex items-center justify-between border border-c-border rounded-2xl p-6"><span className="text-base font-medium text-c-text">{c.name}</span><button onClick={()=>setJoined(p=>[...p,c.id])} className="text-sm bg-[#3182F6] text-white px-5 py-2 rounded-xl font-semibold active:scale-95 transition-transform">참여</button></div>)}</div></div>}
      <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-2 text-green-500">보상 시스템</h3><p className="text-xs text-green-400">챌린지 달성 시 배지를 획득할 수 있어요! ({allActive.filter(c=>c.getCurrent(monthTx)<=(c.type==='count'?-1:c.target)).length}/{allActive.length} 달성)</p></div>
    </div>
  );
}

/* ─── PatternView ─── */
function PatternView({ transactions, hideAmounts, customCategories }) {
  const currentMonth = new Date().toISOString().substring(0,7);
  const monthTx = useMemo(() => transactions.filter(t=>t.date.startsWith(currentMonth)&&!t.refunded), [transactions, currentMonth]);

  const timeData = useMemo(() => { const slots=[{label:'07-09',min:7,max:9,amount:0},{label:'09-12',min:9,max:12,amount:0},{label:'12-14',min:12,max:14,amount:0},{label:'14-18',min:14,max:18,amount:0},{label:'18-21',min:18,max:21,amount:0},{label:'21-24',min:21,max:24,amount:0}]; monthTx.forEach(t=>{const h=parseInt(t.time.split(':')[0]);const s=slots.find(s=>h>=s.min&&h<s.max);if(s)s.amount+=t.amount;}); return slots; }, [monthTx]);
  const dayData = useMemo(() => { const d=['월','화','수','목','금','토','일'].map(d=>({day:d,amount:0})); monthTx.forEach(t=>{const di=new Date(t.date).getDay();d[di===0?6:di-1].amount+=t.amount;}); return d; }, [monthTx]);
  const paymentData = useMemo(() => { const m={}; monthTx.forEach(t=>{const p=t.payment||'기타';m[p]=(m[p]||0)+t.amount;}); return Object.entries(m).map(([name,value])=>({name,value})); }, [monthTx]);
  const topPlaces = useMemo(() => { const p={}; monthTx.forEach(t=>{if(t.place){if(!p[t.place])p[t.place]={count:0,amount:0};p[t.place].count++;p[t.place].amount+=t.amount;}}); return Object.entries(p).sort((a,b)=>b[1].count-a[1].count).slice(0,5).map(([name,data])=>({name,...data})); }, [monthTx]);

  return (
    <div className="px-5 py-5 space-y-6">
      <div><h3 className="font-bold text-lg text-c-text mb-4">시간대별 지출</h3><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={timeData}><XAxis dataKey="label" tick={{fontSize:11,fill:'#8B949E'}} axisLine={false} tickLine={false}/><YAxis width={50} tick={{fontSize:10,fill:'#8B949E'}} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Bar dataKey="amount" fill="#3182F6" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">요일별 패턴</h3><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={dayData}><XAxis dataKey="day" tick={{fontSize:12,fill:'#8B949E'}} axisLine={false} tickLine={false}/><YAxis width={50} tick={{fontSize:10,fill:'#8B949E'}} tickFormatter={v=>formatKRW(v)} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip formatter={v=>formatFullKRW(v)}/>}/><Bar dataKey="amount" fill="#7C5CFC" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">결제 수단별</h3><div className="space-y-2.5">{paymentData.sort((a,b)=>b.value-a.value).map(p=><div key={p.name} className="flex items-center gap-2"><span className="text-xs w-20 text-c-text2 font-medium">{p.name}</span><div className="flex-1 h-6 border border-c-border rounded-full overflow-hidden"><div className="h-full bg-[#3182F6] rounded-full transition-all duration-500" style={{width:`${(p.value/Math.max(...paymentData.map(x=>x.value)))*100}%`}}/></div><span className="text-xs font-bold text-c-text w-20 text-right">{hideAmounts?'•••••':formatKRW(p.value)}</span></div>)}</div></div>
      <div><h3 className="font-bold text-lg text-c-text mb-4">자주 가는 곳 TOP 5</h3><div className="space-y-2">{topPlaces.map((p,i)=><div key={p.name} className="flex items-center gap-3 py-2"><span className="w-7 h-7 rounded-full bg-[#3182F6] text-white text-xs flex items-center justify-center font-bold">{i+1}</span><div className="flex-1"><div className="text-sm font-semibold text-c-text">{p.name}</div><div className="text-xs text-c-text2">{p.count}회 방문</div></div><span className="text-sm font-bold text-c-text">{hideAmounts?'•••••':formatFullKRW(p.amount)}</span></div>)}{topPlaces.length===0&&<div className="text-sm text-c-text3 text-center py-6">데이터가 부족합니다</div>}</div></div>
      <div className="border border-c-border rounded-2xl p-4"><h3 className="font-bold text-sm mb-2 text-blue-500">AI 인사이트</h3><div className="text-xs text-blue-400 space-y-1.5">
        {(() => {
          const tips = [];
          const peak = timeData.reduce((a,b) => a.amount > b.amount ? a : b, timeData[0]);
          if (peak.amount > 0) tips.push(`• ${peak.label}시에 가장 많이 지출 (${formatKRW(peak.amount)})`);
          const wkend = dayData[5].amount + dayData[6].amount;
          const wkday = dayData.slice(0,5).reduce((s,d)=>s+d.amount,0);
          tips.push(wkend > wkday/5*2 ? '• 주말 지출이 평일 평균보다 높아요. 주말 예산을 세워보세요.' : '• 주말 절약을 잘 하고 있어요!');
          if (topPlaces.length > 0) tips.push(`• ${topPlaces[0].name}에 가장 자주 방문 (${topPlaces[0].count}회, ${formatKRW(topPlaces[0].amount)})`);
          const cash = paymentData.find(p => p.name === '현금');
          const card = paymentData.find(p => p.name === '카드');
          if (cash && card && cash.value > card.value) tips.push('• 현금 지출이 많아요. 카드로 전환하면 지출 추적이 쉬워져요.');
          return tips.map((t,i) => <p key={i}>{t}</p>);
        })()}
      </div></div>
    </div>
  );
}

export default HouseholdTab;
