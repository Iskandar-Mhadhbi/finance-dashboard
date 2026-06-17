import type { WatchlistItem } from '../api/watchlist';
import type { StockQuote } from '../api/stocks';

type Props = {
  item: WatchlistItem;
  quote?: StockQuote;
  onRemove: (id: string) => void;
};

export function WatchlistItemCard({
  item,
  quote,
  onRemove,
}: Props) {
  const isPositive = quote ? quote.change >= 0 : true;

  return (
    <li className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
      <div>
        <span className="font-semibold">
          {item.symbol}
        </span>

        {quote && (
          <span className="text-sm text-slate-500 ml-2">
            {quote.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {quote ? (
          <div className="text-right">
            <div className="font-semibold">
              {quote.price.toFixed(2)} {quote.currency}
            </div>

            <div
              className={`text-sm ${
                isPositive
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)}
              {' '}
              ({quote.change_percent.toFixed(2)}%)
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">
            No data
          </span>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-100"
        >
          Remove
        </button>
      </div>
    </li>
  );
}