import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import * as watchlistApi from '../api/watchlist';
import * as stocksApi from '../api/stocks';
import type { WatchlistItem } from '../api/watchlist';
import type { StockQuote } from '../api/stocks';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const items = await watchlistApi.getWatchlist();
        setWatchlist(items);

        const quotePairs = await Promise.all(
          items.map(async (item) => {
            try {
              const quote = await stocksApi.getQuote(item.symbol);
              return [item.symbol, quote] as const;
            } catch {
              return null;
            }
          }),
        );

        const quoteMap: Record<string, StockQuote> = {};
        for (const pair of quotePairs) {
          if (pair) {
            quoteMap[pair[0]] = pair[1];
          }
        }
        setQuotes(quoteMap);
      } finally {
        setLoading(false);
      }
    };

    void loadWatchlist();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Finance Dashboard</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Hi, {user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Watchlist</h2>

        {loading && <p className="text-slate-500">Loading...</p>}

        {!loading && watchlist.length === 0 && (
          <p className="text-slate-500">Your watchlist is empty.</p>
        )}

        {!loading && watchlist.length > 0 && (
          <ul className="space-y-2">
            {watchlist.map((item) => {
              const quote = quotes[item.symbol];
              const isPositive = quote ? quote.change >= 0 : true;

              return (
                <li
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold">{item.symbol}</span>
                    {quote && (
                      <span className="text-sm text-slate-500 ml-2">{quote.name}</span>
                    )}
                  </div>

                  {quote ? (
                    <div className="text-right">
                      <div className="font-semibold">
                        {quote.price.toFixed(2)} {quote.currency}
                      </div>
                      <div
                        className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {isPositive ? '+' : ''}
                        {quote.change.toFixed(2)} ({quote.change_percent.toFixed(2)}%)
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">No data</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}