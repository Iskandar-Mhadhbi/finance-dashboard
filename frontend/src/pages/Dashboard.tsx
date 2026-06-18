import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as watchlistApi from '../api/watchlist';
import * as stocksApi from '../api/stocks';
import type { WatchlistItem } from '../api/watchlist';
import { DashboardHeader } from '../components/DashboardHeader';
import { WatchlistItemCard } from '../components/WatchlistItemCard';
import { AddStockForm } from '../components/AddStockForm';
import { StockChart } from '../components/StockChart';
import { useStockPrices } from '../hooks/useStockPrices';

export function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

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
    staleTime: 5 * 60_000,
  });

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

  const { prices: livePrices, connected } = useStockPrices(true);

  const mergeQuote = (symbol: string) => {
    const base = quotes[symbol];
    const live = livePrices[symbol];
    if (!base) return undefined;
    if (!live) return base;
    return { ...base, ...live };
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-[var(--bg-secondary)] via-[var(--accent)]/10 to-[var(--bg-primary)] transition-colors duration-200">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="md:col-span-1 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Watchlist
            </h2>

            {/* Live connection indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {connected ? 'Live prices active' : 'Connecting...'}
              </span>
            </div>

            <AddStockForm onAddSuccess={() => void queryClient.invalidateQueries({ queryKey: ['watchlist'] })} />
          </div>

          {isLoading && (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          )}

          {!isLoading && watchlist.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>
              Your watchlist is empty. Add a stock symbol above.
            </p>
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
                        ? 'ring-2 ring-blue-500 shadow-md scale-[1.01]'
                        : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    }}
                  >
                    <WatchlistItemCard
                      item={item}
                      quote={mergeQuote(item.symbol)}
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
            <div
              className="p-6 rounded-xl shadow-sm sticky top-8 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  <span style={{ color: 'var(--text-primary)' }}>Performance History: </span>
                  <span style={{ color: 'var(--accent)' }}>{selectedSymbol}</span>
                </h3>
                {livePrices[selectedSymbol] && (
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      ${livePrices[selectedSymbol].price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${livePrices[selectedSymbol].change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {livePrices[selectedSymbol].change >= 0 ? '+' : ''}
                      {livePrices[selectedSymbol].change.toFixed(2)} ({livePrices[selectedSymbol].change_percent.toFixed(2)}%)
                    </div>
                  </div>
                )}
              </div>
              <StockChart symbol={selectedSymbol} />
            </div>
          ) : (
            <div
              className="h-72 flex items-center justify-center border-2 border-dashed rounded-xl transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              Select a stock from your watchlist to view its data trends.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}