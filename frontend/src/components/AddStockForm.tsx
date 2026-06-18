import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import * as watchlistApi from '../api/watchlist';

interface AddStockFormProps {
  onAddSuccess?: () => void;
}

export function AddStockForm({ onAddSuccess }: AddStockFormProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    setAddError('');
    setAddLoading(true);

    try {
      await watchlistApi.addToWatchlist(newSymbol.trim().toUpperCase());
      setNewSymbol('');
      setAddError('');
      onAddSuccess?.();
    } catch {
      setAddError(`Could not add ${newSymbol.toUpperCase()}. Check the symbol is valid.`);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleAdd} className="flex gap-2 items-center">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="e.g. AAPL, TSLA, MSFT"
          disabled={addLoading}
          className="flex-1 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={addLoading || !newSymbol.trim()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="p-2.5 text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border border-transparent transition-all duration-200 cursor-pointer active:scale-95"
          style={{ 
            backgroundColor: isHovered && !addLoading && newSymbol.trim() ? 'var(--accent-hover)' : 'var(--accent)',
          }}
          aria-label="Add Stock"
        >
          {addLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </form>

      {addError && <p className="text-red-500 text-xs font-medium mt-2 pl-1">{addError}</p>}
    </div>
  );
}