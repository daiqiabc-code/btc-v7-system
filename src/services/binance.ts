import type { Kline, Ticker } from '@/types';

const BASE_URL = 'https://fapi.binance.com';

export async function fetchKlines(symbol = 'BTCUSDT', interval = '1d', limit = 365): Promise<Kline[]> {
  const url = `${BASE_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();
  return data.map((k: any[]) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

export async function fetchTicker(symbol = 'BTCUSDT'): Promise<Ticker> {
  const url = `${BASE_URL}/fapi/v1/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();
  return {
    symbol: data.symbol,
    price: data.lastPrice,
    priceChangePercent: data.priceChangePercent,
    high24h: data.highPrice,
    low24h: data.lowPrice,
    volume: data.volume,
  };
}

export function connectWebSocket(
  symbol: string,
  onPrice: (price: number) => void,
  onError?: (err: Event) => void
): WebSocket {
  const ws = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}usdt@markPrice@1s`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onPrice(parseFloat(data.p));
    } catch { /* ignore parse errors */ }
  };
  ws.onerror = (err) => onError?.(err);
  return ws;
}

export async function fetchMultipleIntervals(symbol = 'BTCUSDT'): Promise<Record<string, Kline[]>> {
  const intervals = ['1d', '4h'];
  const [daily, h4] = await Promise.all(
    intervals.map(i => fetchKlines(symbol, i, i === '1d' ? 365 : 200))
  );
  return { '1d': daily, '4h': h4 };
}
