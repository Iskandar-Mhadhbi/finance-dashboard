import { useAuth } from '../context/useAuth';

export function DashboardHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">
          Finance Dashboard
        </h1>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>
            Hi, {user?.name || user?.email}
          </span>

          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}