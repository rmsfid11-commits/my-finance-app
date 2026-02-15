import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const hasNotification = typeof window !== 'undefined' && 'Notification' in window;

export function useNotifications() {
  const { settings, budget, transactions, fixedExpenses } = useStore();
  const enabled = settings.notifications?.budgetOver;
  const sent = useRef(new Set());

  useEffect(() => {
    if (!enabled || !hasNotification) return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !hasNotification || Notification.permission !== 'granted') return;
    const month = new Date().toISOString().substring(0, 7);
    const monthTx = transactions.filter(t => t.date.startsWith(month) && !t.refunded);
    const byCategory = {};
    monthTx.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });

    Object.entries(byCategory).forEach(([cat, spent]) => {
      const limit = budget[cat];
      if (!limit || sent.current.has(`${month}-${cat}`)) return;
      const pct = spent / limit * 100;
      if (pct >= 90) {
        sent.current.add(`${month}-${cat}`);
        new Notification('예산 알림', { body: `${cat} 예산 ${Math.round(pct)}% 사용 (${pct >= 100 ? '초과!' : '거의 소진'})`, icon: '/favicon.svg' });
      }
    });
  }, [enabled, transactions, budget]);

  useEffect(() => {
    if (!enabled || !hasNotification || Notification.permission !== 'granted') return;
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrDay = tomorrow.getDate();

    fixedExpenses.forEach(fe => {
      const key = `fixed-${fe.name}-${tmrDay}`;
      if (fe.day === tmrDay && !sent.current.has(key)) {
        sent.current.add(key);
        new Notification('내일 고정지출', { body: `${fe.name} ${fe.amount.toLocaleString()}원 예정`, icon: '/favicon.svg' });
      }
    });
  }, [enabled, fixedExpenses]);
}
