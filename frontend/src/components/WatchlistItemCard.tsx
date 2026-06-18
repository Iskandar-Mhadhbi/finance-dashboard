import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye } from 'lucide-react'; 
import type { WatchlistItem } from '../api/watchlist';
import type { StockQuote } from '../api/stocks';

type Props = {
  item: WatchlistItem;
  quote?: StockQuote;
  onRemove: (id: string) => void;
};

export function WatchlistItemCard({ item, quote, onRemove }: Props) {
  const navigate = useNavigate();
  const isPositive = quote ? quote.change >= 0 : true;

  // Local hover states for fashionable theme button transitions
  const [isDetailsHovered, setIsDetailsHovered] = useState(false);
  const [isRemoveHovered, setIsRemoveHovered] = useState(false);

  return (
    <div
      className="p-4 rounded-xl flex justify-between items-center transition-all duration-200"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div>
        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          {item.symbol}
        </span>
        {quote && (
          <span className="text-xs ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
            {quote.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {quote ? (
          <div className="text-right">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              ${quote.price.toFixed(2)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{quote.currency}</span>
            </div>
            <div className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.change_percent.toFixed(2)}%)
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No data</span>
        )}

        <div className="flex items-center gap-1.5">
          {/* Details Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/stocks/${item.symbol}`);
            }}
            onMouseEnter={() => setIsDetailsHovered(true)}
            onMouseLeave={() => setIsDetailsHovered(false)}
            className="p-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border border-transparent shadow-sm"
            style={{ 
              backgroundColor: isDetailsHovered ? 'var(--accent-hover)' : 'var(--accent)', 
              color: '#ffffff' 
            }}
            title="View Details"
            aria-label={`View details for ${item.symbol}`}
          >
            <Eye className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Remove Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              void onRemove(item.id);
            }}
            onMouseEnter={() => setIsRemoveHovered(true)}
            onMouseLeave={() => setIsRemoveHovered(false)}
            className="p-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border"
            style={{ 
              backgroundColor: isRemoveHovered ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)', 
              borderColor: isRemoveHovered ? '#ef4444' : 'var(--border)', 
              color: isRemoveHovered ? '#ef4444' : 'var(--text-secondary)' 
            }}
            title="Remove from Watchlist"
            aria-label={`Remove ${item.symbol} from watchlist`}
          >
            <Trash2 className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
}