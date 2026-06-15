import api from './client';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  currency: string;
}

export interface StockHistoryPoint {
  date: string;
  close: number;
}

export interface StockHistory {
  symbol: string;
  points: StockHistoryPoint[];
}

export const getQuote = async (symbol: string) => {
  const res = await api.get<StockQuote>(`/stocks/${symbol}/quote`);
  return res.data;
};

export const getHistory = async (symbol: string, period: string = '1mo') => {
  const res = await api.get<StockHistory>(`/stocks/${symbol}/history`, {
    params: { period },
  });
  return res.data;
};