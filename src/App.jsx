import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, CLOUD_KEYS } from './store/useStore';
import { firebaseEnabled, auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Banner from './components/Banner';
import Onboarding from './components/Onboarding';
import AuthScreen from './components/AuthScreen';
import Toast from './components/Toast';
import { useNotifications } from './hooks/useNotifications';
const HomeTab = lazy(() => import('./components/tabs/HomeTab'));
const InvestTab = lazy(() => import('./components/tabs/InvestTab'));
const HouseholdTab = lazy(() => import('./components/tabs/HouseholdTab'));
const BadgeTab = lazy(() => import('./components/tabs/BadgeTab'));
const StatsTab = lazy(() => import('./components/tabs/StatsTab'));
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'));
import { Home, TrendingUp, Wallet, Award, BarChart3, Settings } from 'lucide-react';
import { fetchAllMarketData, fetchStockPrice } from './utils/api';
import { formatDate, formatTime, generateId } from './utils/formatters';
import { haptic } from './utils/haptic';
import { useSwipe } from './hooks/useSwipe';

const TABS = [
  { path: '/', label: '홈', Icon: Home },
  { path: '/invest', label: '투자', Icon: TrendingUp },
  { path: '/household', label: '가계부', Icon: Wallet },
  { path: '/badges', label: '배지', Icon: Award },
  { path: '/stats', label: '통계', Icon: BarChart3 },
  { path: '/settings', label: '설정', Icon: Settings },
];

const pageMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

function Page({ children }) {
  return <motion.div variants={pageMotion} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">{children}</motion.div>;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { user, authLoading, skipped, showOnboarding, profile, settings, portfolio, theme, lastBackup, fixedExpenses } = store;

  // Auth listener
  useEffect(() => {
    if (!firebaseEnabled) { store.setAuthLoading(false); return; }
    return onAuthStateChanged(auth, u => { store.setUser(u); store.setAuthLoading(false); });
  }, []);

  // Cloud sync: load
  const cloudLoaded = useRef(false);
  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data(), update = {};
          CLOUD_KEYS.forEach(k => { if (d[k] !== undefined) update[k] = d[k]; });
          store.bulkUpdate(update);
        } else {
          const data = {}; CLOUD_KEYS.forEach(k => { data[k] = store[k]; });
          await setDoc(doc(db, 'users', user.uid), { ...data, createdAt: new Date().toISOString() });
        }
      } catch (e) { console.error('Firestore load:', e); }
      cloudLoaded.current = true;
    })();
  }, [user?.uid]);

  // Cloud sync: debounced save
  const saveTimer = useRef(null);
  const dataRef = useRef('');
  useEffect(() => {
    if (!user || !db || !cloudLoaded.current) return;
    const data = {}; CLOUD_KEYS.forEach(k => { data[k] = store[k]; });
    const str = JSON.stringify(data);
    if (str === dataRef.current) return;
    dataRef.current = str;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'users', user.uid), { ...data, updatedAt: new Date().toISOString() }, { merge: true }); }
      catch (e) { console.error('Firestore save:', e); }
    }, 3000);
    return () => clearTimeout(saveTimer.current);
  });

  // Market data
  useEffect(() => {
    const load = async () => { const data = await fetchAllMarketData(); store.setMarketData(data); if (data.exchange) store.setExchangeRate(data.exchange.rate); };
    load(); const interval = setInterval(load, 60000); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => { const results = await Promise.allSettled(portfolio.map(s => fetchStockPrice(s.symbol))); const prices = {}; portfolio.forEach((s, i) => { if (results[i].status === 'fulfilled' && results[i].value) prices[s.symbol] = results[i].value; }); store.setStockPrices(prices); };
    load(); const interval = setInterval(load, 30000); return () => clearInterval(interval);
  }, [portfolio]);

  // Theme
  useEffect(() => {
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => document.documentElement.setAttribute('data-theme', mq.matches ? 'black' : 'notion');
      apply(); mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Onboarding
  useEffect(() => { if (!profile.name) store.setShowOnboarding(true); }, []);

  // Auto fixed expenses
  useEffect(() => {
    store.setTransactions(prev => {
      const today = new Date(), day = today.getDate(), month = today.toISOString().substring(0, 7);
      const add = [];
      fixedExpenses.forEach(fe => {
        if (fe.day === day && !prev.some(t => t.date.startsWith(month) && t.amount === fe.amount && t.memo === `[자동] ${fe.name}`))
          add.push({ id: generateId(), date: formatDate(today), time: formatTime(today), amount: fe.amount, category: fe.category, place: fe.name, memo: `[자동] ${fe.name}`, payment: '자동이체', auto: true });
      });
      return add.length > 0 ? [...add, ...prev] : prev;
    });
  }, []);

  // Backup reminder
  useEffect(() => {
    if (lastBackup) { const diff = (Date.now() - new Date(lastBackup).getTime()) / 86400000; if (diff >= 30) store.setToast({ message: '30일 이상 백업하지 않았어요', action: '설정에서 백업', type: 'warn' }); }
  }, []);

  useNotifications();

  // Swipe navigation
  const mainRef = useRef(null);
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = [useRef(80), (v) => { navRef._h = v; }];
  useSwipe(mainRef, {
    onSwipeLeft: () => { const i = TABS.findIndex(t => t.path === location.pathname); if (i < TABS.length - 1) { haptic(); navigate(TABS[i + 1].path); } },
    onSwipeRight: () => { const i = TABS.findIndex(t => t.path === location.pathname); if (i > 0) { haptic(); navigate(TABS[i - 1].path); } },
  });

  const navRefEl = useRef(null);
  const navH = useRef(80);
  useEffect(() => {
    const nav = navRefEl.current; if (!nav) return;
    const ro = new ResizeObserver(([entry]) => { navH.current = entry.target.offsetHeight; });
    ro.observe(nav); navH.current = nav.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // Glass touch effects
  useEffect(() => {
    const onStart = (e) => { const glass = e.target.closest('.glass'); if (!glass) return; const rect = glass.getBoundingClientRect(); const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left; const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top; glass.style.setProperty('--touch-x', `${x}px`); glass.style.setProperty('--touch-y', `${y}px`); glass.classList.add('glass-touched'); };
    const onMove = (e) => { const glass = document.querySelector('.glass-touched'); if (!glass) return; const rect = glass.getBoundingClientRect(); const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left; const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top; glass.style.setProperty('--touch-x', `${x}px`); glass.style.setProperty('--touch-y', `${y}px`); };
    const onEnd = () => { document.querySelectorAll('.glass-touched').forEach(el => el.classList.remove('glass-touched')); };
    document.addEventListener('touchstart', onStart, { passive: true }); document.addEventListener('touchmove', onMove, { passive: true }); document.addEventListener('touchend', onEnd); document.addEventListener('mousedown', onStart); document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onEnd);
    return () => { document.removeEventListener('touchstart', onStart); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); document.removeEventListener('mousedown', onStart); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); };
  }, []);

  // Auth gate
  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}><div className="text-c-text2 text-sm">로딩중...</div></div>;
  if (firebaseEnabled && !user && !skipped) return <AuthScreen />;

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: navH.current }}>
      {showOnboarding && <Onboarding onComplete={() => store.setShowOnboarding(false)} />}
      <Toast />
      <Banner />
      <main ref={mainRef} className="flex-1 flex flex-col">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-c-text2 text-sm">로딩중...</div>}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Page><HomeTab /></Page>} />
              <Route path="/invest" element={<Page><InvestTab /></Page>} />
              <Route path="/household" element={<Page><HouseholdTab /></Page>} />
              <Route path="/badges" element={<Page><BadgeTab /></Page>} />
              <Route path="/stats" element={<Page><StatsTab /></Page>} />
              <Route path="/settings" element={<Page><SettingsTab /></Page>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <nav ref={navRefEl} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[960px] glass-nav flex justify-around items-center py-3 px-1 z-50" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {TABS.map(({ path, label, Icon }) => (
          <button key={path} onClick={() => { haptic(); navigate(path); }} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${location.pathname === path ? 'text-[#3182F6]' : 'text-c-text3'}`}>
            <Icon size={20} strokeWidth={location.pathname === path ? 2.5 : 1.5} />
            <span className={`text-[10px] ${location.pathname === path ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
