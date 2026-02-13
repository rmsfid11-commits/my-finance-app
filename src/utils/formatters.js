export function formatKRW(amount) {
  if (amount === null || amount === undefined) return '0원';
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) return (amount / 100000000).toFixed(1) + '억원';
  if (absAmount >= 10000) return (amount / 10000).toFixed(0) + '만원';
  return amount.toLocaleString('ko-KR') + '원';
}

export function formatFullKRW(amount) {
  if (amount === null || amount === undefined) return '0원';
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

export function formatUSD(amount) {
  if (amount === null || amount === undefined) return '$0';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '0%';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('ko-KR');
}

export function formatComma(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(Math.round(num)).toLocaleString('ko-KR');
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function formatTime(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function getDayOfWeek(date) {
  const days = ['일','월','화','수','목','금','토'];
  return days[new Date(date).getDay()];
}
