import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signOut } from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';
import { DEFAULT_PROFILE, DEFAULT_GOALS, DEFAULT_BUDGET, DEFAULT_QUICK_INPUTS, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '../data/initialData';

const OLD_KEYS = { profile:'finance_profile', goals:'finance_goals', budget:'finance_budget', portfolio:'finance_portfolio', dividends:'finance_dividends', fixedExpenses:'finance_fixed', transactions:'finance_transactions', badges:'finance_badges', settings:'finance_settings', theme:'finance_theme', watchlist:'finance_watchlist', hideAmounts:'finance_hide_amounts', customQuickInputs:'finance_quick_inputs', customCategories:'finance_categories', paymentMethods:'finance_payment_methods', lastBackup:'finance_last_backup', gamification:'finance_gamification' };

export const CLOUD_KEYS = Object.keys(OLD_KEYS);

export const useStore = create(
  persist(
    (set, get) => {
      const s = (key) => (v) => set(state => ({ [key]: typeof v === 'function' ? v(state[key]) : v }));
      return {
        // Persisted
        profile: DEFAULT_PROFILE, goals: DEFAULT_GOALS, budget: DEFAULT_BUDGET,
        portfolio: [], dividends: [], fixedExpenses: [], transactions: [],
        badges: {}, settings: { smsAutoDetect: true, notifications: { fixedExpense: true, budgetOver: true, economic: true, badge: true, report: true } },
        theme: 'black', watchlist: [], hideAmounts: false,
        customQuickInputs: DEFAULT_QUICK_INPUTS, customCategories: DEFAULT_CATEGORIES,
        paymentMethods: DEFAULT_PAYMENT_METHODS, lastBackup: null,
        gamification: { xp: 0, level: 1, streak: 0, lastCheckIn: null, challenges: [], completedChallenges: [] },

        // Non-persisted
        user: null, authLoading: firebaseEnabled, skipped: !firebaseEnabled,
        marketData: {}, stockPrices: {}, exchangeRate: null,
        toast: null, showOnboarding: false,

        // Setters
        setProfile: s('profile'), setGoals: s('goals'), setBudget: s('budget'),
        setPortfolio: s('portfolio'), setDividends: s('dividends'),
        setFixedExpenses: s('fixedExpenses'), setTransactions: s('transactions'),
        setBadges: s('badges'), setSettings: s('settings'), setTheme: s('theme'),
        setWatchlist: s('watchlist'), setHideAmounts: s('hideAmounts'),
        setCustomQuickInputs: s('customQuickInputs'), setCustomCategories: s('customCategories'),
        setPaymentMethods: s('paymentMethods'), setLastBackup: s('lastBackup'),
        setGamification: s('gamification'), setUser: s('user'),
        setAuthLoading: s('authLoading'), setSkipped: s('skipped'),
        setMarketData: s('marketData'), setStockPrices: s('stockPrices'),
        setExchangeRate: s('exchangeRate'), setToast: s('toast'),
        setShowOnboarding: s('showOnboarding'),

        // Actions
        addTransaction: (tx) => {
          if (!tx.auto) {
            const dup = get().transactions.find(t => t.date === tx.date && t.amount === tx.amount && t.category === tx.category);
            if (dup && !confirm(`같은 날 같은 금액(${tx.amount?.toLocaleString()}원) ${tx.category} 거래가 있어요. 추가?`)) return;
          }
          set(st => ({ transactions: [tx, ...st.transactions] }));
        },
        deleteTransaction: (id) => {
          const del = get().transactions.find(t => t.id === id);
          set(st => ({ transactions: st.transactions.filter(t => t.id !== id) }));
          if (del) set({ toast: { message: '삭제됨', undo: () => set(st => ({ transactions: [del, ...st.transactions] })) } });
        },
        updateTransaction: (id, updates) => set(st => ({ transactions: st.transactions.map(t => t.id === id ? { ...t, ...updates } : t) })),
        handleLogout: async () => { if (auth) { await signOut(auth); set({ skipped: false }); } },
        bulkUpdate: (data) => set(data),
      };
    },
    {
      name: 'finance-store',
      partialize: (s) => {
        const out = {};
        CLOUD_KEYS.forEach(k => { out[k] = s[k]; });
        return out;
      },
      merge: (persisted, current) => {
        if (persisted) return { ...current, ...persisted };
        const migrated = {};
        for (const [k, oldKey] of Object.entries(OLD_KEYS)) {
          try { const v = localStorage.getItem(oldKey); if (v !== null) migrated[k] = JSON.parse(v); } catch {}
        }
        return { ...current, ...migrated };
      },
    }
  )
);
