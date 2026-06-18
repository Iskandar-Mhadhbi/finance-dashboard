import { useAuth } from '../context/auth/useAuth';
import { useTheme } from '../context/theme/useTheme';
import type { Theme } from '../context/theme/theme-context';

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: '☀️ Light' },
  { value: 'dim', label: '🌆 Dim' },
  { value: 'dark', label: '🌙 Dark' },
];

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border)' }} className="border-b px-8 py-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">
          Finance Dashboard
        </h1>

        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>
            Hi, {user?.name || user?.email}
          </span>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
            className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            onClick={logout}
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            className="px-4 py-2 border rounded-lg hover:opacity-80 transition-opacity"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}