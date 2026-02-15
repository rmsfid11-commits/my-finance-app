import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSwipe } from './hooks/useSwipe';
import { useAuth } from './hooks/useAuth';
import { firebaseEnabled, auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { DEFAULT_PROFILE, DEFAULT_GOALS, DEFAULT_BUDGET, DEFAULT_PORTFOLIO, DEFAULT_DIVIDENDS, DEFAULT_FIXED_EXPENSES, DEFAULT_TRANSACTIONS, DEFAULT_QUICK_INPUTS, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from './data/initialData';
import Banner from './components/Banner';
import Onboarding from './components/Onboarding';
import AuthScreen from './components/AuthScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import { useNotifications } from './hooks/useNotifications';
import HomeTab from './components/tabs/HomeTab';
import InvestTab from './components/tabs/InvestTab';
import HouseholdTab from './components/tabs/HouseholdTab';
import BadgeTab from './components/tabs/BadgeTab';
import StatsTab from './components/tabs/StatsTab';
import SettingsTab from './components/tabs/SettingsTab';
import { Home, TrendingUp, Wallet, Award, BarChart3, Settings } from 'lucide-react';
import { fetchAllMarketData, fetchStockPrice } from './utils/api';
import { formatDate, formatTime, generateId } from './utils/formatters';

const TABS = [
  { id: 'home', label: '홈', Icon: Home },
  { id: 'invest', label: '투자', Icon: TrendingUp },
  { id: 'household', label: '가계부', Icon: Wallet },
  { id: 'badges', label: '배지', Icon: Award },
  { id: 'stats', label: '통계', Icon: BarChart3 },
  { id: 'settings', label: '설정', Icon: Settings },
];

const CLOUD_KEYS = ['profile','goals','budget','portfolio','dividends','fixedExpenses','transactions','badges','settings','theme','watchlist','hideAmounts','customQuickInputs','customCategories','paymentMethods','lastBackup'];

function App() {
  const { user, loading: authLoading } = useAuth();
  const [skipped, setSkipped] = useState(!firebaseEnabled);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useLocalStorage('finance_profile', DEFAULT_PROFILE);
  const [goals, setGoals] = useLocalStorage('finance_goals', DEFAULT_GOALS);
  const [budget, setBudget] = useLocalStorage('finance_budget', DEFAULT_BUDGET);
  const [portfolio, setPortfolio] = useLocalStorage('finance_portfolio', DEFAULT_PORTFOLIO);
  const [dividends, setDividends] = useLocalStorage('finance_dividends', DEFAULT_DIVIDENDS);
  const [fixedExpenses, setFixedExpenses] = useLocalStorage('finance_fixed', DEFAULT_FIXED_EXPENSES);
  const [transactions, setTransactions] = useLocalStorage('finance_transactions', DEFAULT_TRANSACTIONS);
  const [badges, setBadges] = useLocalStorage('finance_badges', {});
  const [settings, setSettings] = useLocalStorage('finance_settings', { smsAutoDetect: true, notifications: { fixedExpense: true, budgetOver: true, economic: true, badge: true, report: true } });
  const [theme, setTheme] = useLocalStorage('finance_theme', 'black');
  const [watchlist, setWatchlist] = useLocalStorage('finance_watchlist', []);
  const [hideAmounts, setHideAmounts] = useLocalStorage('finance_hide_amounts', false);
  const [customQuickInputs, setCustomQuickInputs] = useLocalStorage('finance_quick_inputs', DEFAULT_QUICK_INPUTS);
  const [customCategories, setCustomCategories] = useLocalStorage('finance_categories', DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useLocalStorage('finance_payment_methods', DEFAULT_PAYMENT_METHODS);
  const [lastBackup, setLastBackup] = useLocalStorage('finance_last_backup', null);
  const [marketData, setMarketData] = useState({});
  const [stockPrices, setStockPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [toast, setToast] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Cloud data map
  const cloudSetters = { profile: setProfile, goals: setGoals, budget: setBudget, portfolio: setPortfolio, dividends: setDividends, fixedExpenses: setFixedExpenses, transactions: setTransactions, badges: setBadges, settings: setSettings, theme: setTheme, watchlist: setWatchlist, hideAmounts: setHideAmounts, customQuickInputs: setCustomQuickInputs, customCategories: setCustomCategories, paymentMethods: setPaymentMethods, lastBackup: setLastBackup };
  const cloudData = { profile, goals, budget, portfolio, dividends, fixedExpenses, transactions, badges, settings, theme, watchlist, hideAmounts, customQuickInputs, customCategories, paymentMethods, lastBackup };

  // Firestore: load on login
  useEffect(() => {
    if (!user || !db) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          CLOUD_KEYS.forEach(k => { if (d[k] !== undefined) cloudSetters[k](d[k]); });
        } else {
          // First login: upload local data
          await setDoc(doc(db, 'users', user.uid), { ...cloudData, createdAt: new Date().toISOString() });
        }
      } catch (e) { console.error('Firestore load:', e); }
      setCloudLoaded(true);
    };
    load();
  }, [user?.uid]);

  // Firestore: debounced save on data change
  const saveTimer = useRef(null);
  const dataRef = useRef('');
  useEffect(() => {
    if (!user || !db || !cloudLoaded) return;
    const str = JSON.stringify(cloudData);
    if (str === dataRef.current) return;
    dataRef.current = str;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'users', user.uid), { ...cloudData, updatedAt: new Date().toISOString() }, { merge: true }); }
      catch (e) { console.error('Firestore save:', e); }
    }, 3000);
    return () => clearTimeout(saveTimer.current);
  });

  const handleLogout = async () => {
    if (auth) { await signOut(auth); setSkipped(false); }
  };

  // Market data
  useEffect(() => {
    const load = async () => { const data = await fetchAllMarketData(); setMarketData(data); if (data.exchange) setExchangeRate(data.exchange.rate); };
    load(); const interval = setInterval(load, 60000); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => { const results = await Promise.allSettled(portfolio.map(s => fetchStockPrice(s.symbol))); const prices = {}; portfolio.forEach((s, i) => { if (results[i].status === 'fulfilled' && results[i].value) prices[s.symbol] = results[i].value; }); setStockPrices(prices); };
    load(); const interval = setInterval(load, 30000); return () => clearInterval(interval);
  }, [portfolio]);

  useEffect(() => {
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => document.documentElement.setAttribute('data-theme', mq.matches ? 'black' : 'notion');
      apply(); mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { if (!profile.name) setShowOnboarding(true); }, []);

  useEffect(() => {
    setTransactions(prev => {
      const today = new Date(), day = today.getDate(), month = today.toISOString().substring(0, 7);
      const add = [];
      fixedExpenses.forEach(fe => {
        if (fe.day === day && !prev.some(t => t.date.startsWith(month) && t.amount === fe.amount && t.memo === `[자동] ${fe.name}`))
          add.push({ id: generateId(), date: formatDate(today), time: formatTime(today), amount: fe.amount, category: fe.category, place: fe.name, memo: `[자동] ${fe.name}`, payment: '자동이체', auto: true });
      });
      return add.length > 0 ? [...add, ...prev] : prev;
    });
  }, []);

  useEffect(() => {
    if (lastBackup) { const diff = (Date.now() - new Date(lastBackup).getTime()) / 86400000; if (diff >= 30) setToast({ message: '30일 이상 백업하지 않았어요', action: '설정에서 백업', type: 'warn' }); }
  }, []);

  useNotifications(settings.notifications?.budgetOver, { budget, transactions, fixedExpenses, profile });

  const txRef = useRef(transactions); txRef.current = transactions;
  const addTransaction = useCallback((tx) => { if (!tx.auto) { const dup = txRef.current.find(t => t.date === tx.date && t.amount === tx.amount && t.category === tx.category); if (dup && !confirm(`같은 날 같은 금액(${tx.amount?.toLocaleString()}원) ${tx.category} 거래가 있어요. 추가?`)) return; } setTransactions(prev => [tx, ...prev]); }, [setTransactions]);
  const deleteTransaction = useCallback((id) => { const del = txRef.current.find(t => t.id === id); setTransactions(prev => prev.filter(t => t.id !== id)); if (del) setToast({ message: '삭제됨', undo: () => setTransactions(prev => [del, ...prev]) }); }, [setTransactions]);
  const updateTransaction = useCallback((id, updates) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)), [setTransactions]);

  const mainRef = useRef(null);
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(80);
  const tabIds = TABS.map(t => t.id);
  useSwipe(mainRef, {
    onSwipeLeft: () => setActiveTab(prev => { const i = tabIds.indexOf(prev); return i < tabIds.length - 1 ? tabIds[i + 1] : prev; }),
    onSwipeRight: () => setActiveTab(prev => { const i = tabIds.indexOf(prev); return i > 0 ? tabIds[i - 1] : prev; }),
  });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(([entry]) => setNavHeight(entry.target.offsetHeight));
    ro.observe(nav);
    setNavHeight(nav.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onStart = (e) => { const glass = e.target.closest('.glass'); if (!glass) return; const rect = glass.getBoundingClientRect(); const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left; const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top; glass.style.setProperty('--touch-x', `${x}px`); glass.style.setProperty('--touch-y', `${y}px`); glass.classList.add('glass-touched'); };
    const onMove = (e) => { const glass = document.querySelector('.glass-touched'); if (!glass) return; const rect = glass.getBoundingClientRect(); const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left; const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top; glass.style.setProperty('--touch-x', `${x}px`); glass.style.setProperty('--touch-y', `${y}px`); };
    const onEnd = () => { document.querySelectorAll('.glass-touched').forEach(el => el.classList.remove('glass-touched')); };
    document.addEventListener('touchstart', onStart, { passive: true }); document.addEventListener('touchmove', onMove, { passive: true }); document.addEventListener('touchend', onEnd); document.addEventListener('mousedown', onStart); document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onEnd);
    return () => { document.removeEventListener('touchstart', onStart); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); document.removeEventListener('mousedown', onStart); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); };
  }, []);

  // Auth gate
  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}><div className="text-c-text2 text-sm">로딩중...</div></div>;
  if (firebaseEnabled && !user && !skipped) return <AuthScreen onSkip={() => setSkipped(true)} />;

  const props = { profile, setProfile, goals, setGoals, budget, setBudget, portfolio, setPortfolio, dividends, setDividends, fixedExpenses, setFixedExpenses, transactions, setTransactions, badges, setBadges, settings, setSettings, theme, setTheme, watchlist, setWatchlist, marketData, stockPrices, exchangeRate, addTransaction, deleteTransaction, updateTransaction, hideAmounts, setHideAmounts, customQuickInputs, setCustomQuickInputs, customCategories, setCustomCategories, paymentMethods, setPaymentMethods, setToast, lastBackup, setLastBackup, user, handleLogout };

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: navHeight }}>
      {showOnboarding && <Onboarding profile={profile} setProfile={setProfile} onComplete={() => setShowOnboarding(false)} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Banner marketData={marketData} exchangeRate={exchangeRate} />
      <main ref={mainRef} className="flex-1 flex flex-col">
        {activeTab === 'home' && <HomeTab {...props} />}
        {activeTab === 'invest' && <InvestTab {...props} />}
        {activeTab === 'household' && <HouseholdTab {...props} />}
        {activeTab === 'badges' && <BadgeTab {...props} />}
        {activeTab === 'stats' && <StatsTab {...props} />}
        {activeTab === 'settings' && <SettingsTab {...props} />}
      </main>
      <nav ref={navRef} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[960px] glass-nav flex justify-around items-center py-3 px-1 z-50" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${activeTab === id ? 'text-[#3182F6]' : 'text-c-text3'}`}>
            <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.5} />
            <span className={`text-[10px] ${activeTab === id ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
