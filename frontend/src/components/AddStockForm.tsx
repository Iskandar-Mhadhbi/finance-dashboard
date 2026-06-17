import { useState } from 'react';
import * as watchlistApi from '../api/watchlist';

interface AddStockFormProps {
  onAddSuccess?: () => void;   // Callback to refresh watchlist in parent
}

export function AddStockForm({ onAddSuccess }: AddStockFormProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    setAddError('');
    setAddLoading(true);

    try {
      await watchlistApi.addToWatchlist(newSymbol.trim().toUpperCase());
      setNewSymbol('');           // Clear input on success
      setAddError('');
      onAddSuccess?.();           // Tell parent to reload watchlist
    } catch {
      setAddError(`Could not add ${newSymbol.toUpperCase()}. Check the symbol is valid.`);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="e.g. AAPL, TSLA, MSFT"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={addLoading}
        />
        <button
          type="submit"
          disabled={addLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300"
        >
          {addLoading ? 'Adding...' : 'Add'}
        </button>
      </form>

      {addError && <p className="text-red-500 text-sm mt-2">{addError}</p>}
    </div>
  );
}