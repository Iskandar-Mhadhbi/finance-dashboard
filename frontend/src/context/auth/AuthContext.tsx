import { useState, useEffect, type ReactNode } from 'react';
import * as authApi from '../../api/auth';
import type { User } from '../../api/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        setUser(me);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.access_token);
    const me = await authApi.getMe();
    setUser(me);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await authApi.register(email, password, name);
    localStorage.setItem('token', res.access_token);
    const me = await authApi.getMe();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
