import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('sl_token'));

  useEffect(() => {
    if (!localStorage.getItem('sl_token')) return;
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('sl_token'))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (path, body) => {
    const { data } = await api.post(path, body);
    localStorage.setItem('sl_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (payload) => authenticate('/auth/register', payload);
  const logout = () => {
    localStorage.removeItem('sl_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
