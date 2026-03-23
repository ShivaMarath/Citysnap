import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('citysnap_token') || '');
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (e) {
      localStorage.removeItem('citysnap_token');
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('citysnap_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('citysnap_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('citysnap_token');
    setToken('');
    setUser(null);
  }

  async function updateUser(payload) {
    const res = await api.put('/auth/profile', payload);
    setUser(res.data.user);
    return res.data.user;
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateUser, reload: loadMe }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

