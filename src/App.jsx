import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSwipe } from './hooks/useSwipe';
import { DEFAULT_PROFILE, DEFAULT_GOALS, DEFAULT_BUDGET, DEFAULT_PORTFOLIO, DEFAULT_DIVIDENDS, DEFAULT_FIXED_EXPENSES, DEFAULT_TRANSACTIONS } from './data/initialData';
import Banner from './components/Banner';
import HomeTab from './components/tabs/HomeTab';
import InvestTab from './components/tabs/InvestTab';
import HouseholdTab from './components/tabs/HouseholdTab';
import BadgeTab from './components/tabs/BadgeTab';
import StatsTab from './components/tabs/StatsTab';
import SettingsTab from './components/tabs/SettingsTab';
import { Home, TrendingUp, Wallet, Award, BarChart3, Settings } from 'lucide-react';
import { fetchAllMarketData, fetchStockPrice } from './utils/api';

const TABS = [
  { id: 'home', label: '홈', Icon: Home },
  { id: 'invest', label: '투자', Icon: TrendingUp },
  { id: 'household', label: '가계부', Icon: Wallet },
  { id: 'badges', label: '배지', Icon: Award },
  { id: 'stats', label: '통계', Icon: BarChart3 },
  { id: 'settings', label: '설정', Icon: Settings },
];

function App() {
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
  const [marketData, setMarketData] = useState({});
  const [stockPrices, setStockPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);

  useEffect(() => {
    const load = async () => { const data = await fetchAllMarketData(); setMarketData(data); if (data.exchange) setExchangeRate(data.exchange.rate); };
    load(); const interval = setInterval(load, 60000); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => { const prices = {}; for (const s of portfolio) { const d = await fetchStockPrice(s.symbol); if (d) prices[s.symbol] = d; } setStockPrices(prices); };
    load(); const interval = setInterval(load, 30000); return () => clearInterval(interval);
  }, [portfolio]);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const addTransaction = useCallback((tx) => setTransactions(prev => [tx, ...prev]), [setTransactions]);
  const deleteTransaction = useCallback((id) => setTransactions(prev => prev.filter(t => t.id !== id)), [setTransactions]);

  const mainRef = useRef(null);
  const tabIds = TABS.map(t => t.id);
  useSwipe(mainRef, {
    onSwipeLeft: () => setActiveTab(prev => { const i = tabIds.indexOf(prev); return i < tabIds.length - 1 ? tabIds[i + 1] : prev; }),
    onSwipeRight: () => setActiveTab(prev => { const i = tabIds.indexOf(prev); return i > 0 ? tabIds[i - 1] : prev; }),
  });

  const props = { profile, setProfile, goals, setGoals, budget, setBudget, portfolio, setPortfolio, dividends, setDividends, fixedExpenses, setFixedExpenses, transactions, setTransactions, badges, setBadges, settings, setSettings, theme, setTheme, marketData, stockPrices, exchangeRate, addTransaction, deleteTransaction };

  return (
    <div className="min-h-screen bg-c-bg pb-44">
      <Banner marketData={marketData} exchangeRate={exchangeRate} />
      <main ref={mainRef} className="px-6 py-3">
        {activeTab === 'home' && <HomeTab {...props} />}
        {activeTab === 'invest' && <InvestTab {...props} />}
        {activeTab === 'household' && <HouseholdTab {...props} />}
        {activeTab === 'badges' && <BadgeTab {...props} />}
        {activeTab === 'stats' && <StatsTab {...props} />}
        {activeTab === 'settings' && <SettingsTab {...props} />}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[960px] bg-c-card/95 backdrop-blur-xl border-t border-c-border flex justify-around items-center py-3 px-1 z-50" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
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
