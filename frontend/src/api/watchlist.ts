import api from './client';

export interface WatchlistItem {
  id: string;
  symbol: string;
  notes: string;
  created_at: string;
}

export const getWatchlist = async () => {
  const res = await api.get<WatchlistItem[]>('/watchlist');
  return res.data;
};

export const addToWatchlist = async (symbol: string, notes: string = '') => {
  const res = await api.post<WatchlistItem>('/watchlist', { symbol, notes });
  return res.data;
};

export const removeFromWatchlist = async (id: string) => {
  await api.delete(`/watchlist/${id}`);
};