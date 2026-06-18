import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as watchlistApi from '../api/watchlist';
import * as stocksApi from '../api/stocks';
import type { WatchlistItem } from '../api/watchlist';
import { DashboardHeader } from '../components/DashboardHeader';
import { WatchlistItemCard } from '../components/WatchlistItemCard';
import { AddStockForm } from '../components/AddStockForm';
import { StockChart } from '../components/StockChart';

export function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Fetch watchlist
  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist,
    select: (data) => {
      if (!selectedSymbol && data.length > 0) {
        setSelectedSymbol(data[0].symbol);
      }
      return data;
    },
  });

  // Fetch all quotes in parallel
  const { data: quotes = {} } = useQuery({
    queryKey: ['quotes', watchlist.map((i) => i.symbol)],
    queryFn: async () => {
      const result: Record<string, stocksApi.StockQuote> = {};
      await Promise.all(
        watchlist.map(async (item) => {
          try {
            result[item.symbol] = await stocksApi.getQuote(item.symbol);
          } catch {
            // skip failed quotes
          }
        }),
      );
      return result;
    },
    enabled: watchlist.length > 0,
    staleTime: 30_000,
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: watchlistApi.removeFromWatchlist,
    onSuccess: (_, removedId) => {
      const removed = watchlist.find((i) => i.id === removedId);
      if (removed && selectedSymbol === removed.symbol) {
        const remaining = watchlist.filter((i) => i.id !== removedId);
        setSelectedSymbol(remaining.length > 0 ? remaining[0].symbol : null);
      }
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="md:col-span-1 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Watchlist</h2>
            <AddStockForm onAddSuccess={() => void queryClient.invalidateQueries({ queryKey: ['watchlist'] })} />
          </div>

          {isLoading && <p className="text-slate-500">Loading...</p>}

          {!isLoading && watchlist.length === 0 && (
            <p className="text-slate-500">Your watchlist is empty. Add a stock symbol above.</p>
          )}

          {!isLoading && watchlist.length > 0 && (
            <ul className="space-y-3">
              {watchlist.map((item: WatchlistItem) => {
                const isActive = selectedSymbol === item.symbol;
                return (
                  <li
                    key={item.id}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`block rounded-xl cursor-pointer transition-all duration-200 transform ${
                      isActive
                        ? 'ring-2 ring-blue-500 bg-white shadow-md scale-[1.01]'
                        : 'hover:bg-white/60 hover:shadow-sm bg-white/40'
                    }`}
                  >
                    <WatchlistItemCard
                      item={item}
                      quote={quotes[item.symbol]}
                      onRemove={(id) => removeMutation.mutate(id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedSymbol ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Performance History: <span className="text-blue-600">{selectedSymbol}</span>
                </h3>
              </div>
              <StockChart symbol={selectedSymbol} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              Select a stock from your watchlist to view its data trends.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}