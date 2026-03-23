import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/api';

export default function AuthorityLogin() {
  const { login, logout } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role !== 'authority') {
        logout();
        toast.error('This account is not an authority.');
        return;
      }
      toast.success('Authority access granted.');
      nav('/authority');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 grid place-items-center">
      <div className="card w-full max-w-md p-8">
        <div className="font-display text-4xl tracking-wide">Authority login</div>
        <div className="text-sm text-black/70 mt-1">For municipal teams only.</div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="font-mono text-xs text-black/60">Email</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="font-mono text-xs text-black/60">Password</label>
            <input
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in as authority'}
          </button>
        </form>

        <div className="text-sm text-black/70 mt-5 flex items-center justify-between gap-3 flex-wrap">
          <Link className="underline" to="/login">
            Civilian login
          </Link>
          <Link className="underline" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

