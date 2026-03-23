import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/api';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ward: '',
    city: '',
    phone: '',
  });

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created.');
      nav('/feed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 grid place-items-center">
      <div className="card w-full max-w-md p-8">
        <div className="font-display text-4xl tracking-wide">Register</div>
        <div className="text-sm text-black/70 mt-1">Civilians only. Authorities are added manually.</div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="font-mono text-xs text-black/60">Name</label>
            <input className="input mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="font-mono text-xs text-black/60">Email</label>
            <input className="input mt-1" value={form.email} onChange={(e) => set('email', e.target.value)} type="email" required />
          </div>
          <div>
            <label className="font-mono text-xs text-black/60">Password</label>
            <input
              className="input mt-1"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              type="password"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs text-black/60">Ward</label>
              <input className="input mt-1" value={form.ward} onChange={(e) => set('ward', e.target.value)} />
            </div>
            <div>
              <label className="font-mono text-xs text-black/60">City</label>
              <input className="input mt-1" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="font-mono text-xs text-black/60">Phone</label>
            <input className="input mt-1" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="text-sm text-black/70 mt-5">
          Already have an account?{' '}
          <Link className="underline" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

