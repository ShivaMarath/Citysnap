import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="sticky top-0 z-40 border-b border-black/10 bg-civic-paper/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-wider">CitySnap</span>
          <span className="font-mono text-xs text-black/60">civic issue reporting</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NavLink to="/feed" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}>
                Feed
              </NavLink>
              <NavLink
                to="/report/new"
                className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}
              >
                New report
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}
              >
                Profile
              </NavLink>
              {user.role === 'authority' && (
                <NavLink
                  to="/authority"
                  className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}
                >
                  Authority
                </NavLink>
              )}
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  nav('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}>
                Login
              </NavLink>
              <NavLink
                to="/authority/login"
                className={({ isActive }) => (isActive ? 'font-semibold' : 'text-black/70 hover:text-black')}
              >
                Authority login
              </NavLink>
              <NavLink to="/register" className="btn-primary">
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

