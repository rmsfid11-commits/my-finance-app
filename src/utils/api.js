const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
];

async function fetchWithProxy(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url));
      if (res.ok) return res;
    } catch {}
  }
  return fetch(url);
}

const CORS_PROXY = CORS_PROXIES[0];

export async function fetchStockPrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    return {
      symbol, price: meta.regularMarketPrice,
      previousClose: meta.previousClose || meta.chartPreviousClose,
      change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
      changePercent: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
      currency: meta.currency, timestamp: Date.now()
    };
  } catch (error) { console.error(`Error fetching ${symbol}:`, error); return null; }
}

export async function fetchChartData(symbol, range = '6mo', interval = '1d') {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const q = result.indicators.quote[0];
    return timestamps.map((t, i) => ({
      date: new Date(t * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      timestamp: t, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], price: q.close[i],
    })).filter(d => d.close !== null && d.open !== null);
  } catch (error) { console.error(`Error fetching chart for ${symbol}:`, error); return []; }
}

export async function fetchMarketIndex(symbol) { return fetchStockPrice(symbol); }

export async function fetchExchangeRate() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    return { rate: data.rates.KRW, timestamp: Date.now() };
  } catch (error) { console.error('Error fetching exchange rate:', error); return null; }
}

export async function fetchCryptoPrice(symbol = 'BTCUSDT') {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    const data = await response.json();
    return { symbol: symbol.replace('USDT', ''), price: parseFloat(data.lastPrice), change: parseFloat(data.priceChange), changePercent: parseFloat(data.priceChangePercent), high: parseFloat(data.highPrice), low: parseFloat(data.lowPrice), volume: parseFloat(data.volume) };
  } catch (error) { console.error(`Error fetching crypto ${symbol}:`, error); return null; }
}

export async function fetchUpbitPrice(market = 'KRW-BTC') {
  try {
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${market}`);
    const data = await response.json();
    const d = data[0];
    return { market, price: d.trade_price, change: d.signed_change_price, changePercent: d.signed_change_rate * 100, high: d.high_price, low: d.low_price };
  } catch (error) { console.error(`Error fetching upbit ${market}:`, error); return null; }
}

export async function searchStock(query) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    return (data.quotes || []).filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF').map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchDisp || q.exchange,
      type: q.quoteType,
    }));
  } catch (error) { console.error('Error searching stock:', error); return []; }
}

export async function fetchAllMarketData() {
  const [sp500, nasdaq, kospi, exchange, btc] = await Promise.allSettled([
    fetchMarketIndex('^GSPC'), fetchMarketIndex('^IXIC'), fetchMarketIndex('^KS11'),
    fetchExchangeRate(), fetchCryptoPrice('BTCUSDT')
  ]);
  return {
    sp500: sp500.status === 'fulfilled' ? sp500.value : null,
    nasdaq: nasdaq.status === 'fulfilled' ? nasdaq.value : null,
    kospi: kospi.status === 'fulfilled' ? kospi.value : null,
    exchange: exchange.status === 'fulfilled' ? exchange.value : null,
    btc: btc.status === 'fulfilled' ? btc.value : null
  };
}
