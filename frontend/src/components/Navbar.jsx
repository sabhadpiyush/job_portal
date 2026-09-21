import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, X, LogOut, LayoutDashboard, UserRound, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib';
import { Logo, Avatar } from './ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  // Poll for unread notifications once a minute while logged in
  useEffect(() => {
    if (!user) return setUnread(0);
    const load = () => api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-brand' : 'text-muted hover:text-ink'}`;
  const isRec = user?.role === 'recruiter';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="page flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Shortlist home">
          <Logo />
          <span className="font-display text-xl font-bold tracking-tight">Shortlist</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/jobs" className={link}>Find jobs</NavLink>
          {user && <NavLink to={isRec ? '/recruiter' : '/dashboard'} className={link}>Dashboard</NavLink>}
          {isRec && <NavLink to="/recruiter/jobs/new" className={(st) => `${link(st)} lg:hidden`}>Post a job</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={toggle} className="btn btn-ghost btn-sm !p-2" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <Link to="/notifications" className="btn btn-ghost btn-sm relative !p-2" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                <Bell size={18} />
                {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <div className="relative hidden md:block" ref={menuRef}>
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-sunken" aria-haspopup="menu" aria-expanded={menu}>
                  <Avatar src={isRec ? user.company?.logo || user.avatar : user.avatar} name={user.name} size={30} round />
                  <span className="max-w-[110px] truncate text-sm font-semibold">{user.name.split(' ')[0]}</span>
                </button>
                {menu && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-float">
                    <div className="px-3 py-2">
                      <div className="truncate text-sm font-semibold">{user.name}</div>
                      <div className="truncate text-xs text-muted">{user.email}</div>
                    </div>
                    <div className="my-1 h-px bg-line" />
                    <MenuLink to={isRec ? '/recruiter' : '/dashboard'} icon={LayoutDashboard} onClick={() => setMenu(false)}>Dashboard</MenuLink>
                    <MenuLink to="/profile" icon={UserRound} onClick={() => setMenu(false)}>{isRec ? 'Company profile' : 'My profile'}</MenuLink>
                    <button role="menuitem" onClick={() => { logout(); setMenu(false); nav('/'); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10">
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                )}
              </div>
              {isRec && <Link to="/recruiter/jobs/new" className="btn btn-primary btn-sm hidden lg:inline-flex"><Plus size={15} /> Post a job</Link>}
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}

          <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm !p-2 md:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-bg md:hidden">
          <div className="page flex flex-col gap-1 py-3" onClick={() => setOpen(false)}>
            <NavLink to="/jobs" className={link}>Find jobs</NavLink>
            {user ? (
              <>
                <NavLink to={isRec ? '/recruiter' : '/dashboard'} className={link}>Dashboard</NavLink>
                {isRec && <NavLink to="/recruiter/jobs/new" className={link}>Post a job</NavLink>}
                <NavLink to="/profile" className={link}>{isRec ? 'Company profile' : 'My profile'}</NavLink>
                <button onClick={() => { logout(); nav('/'); }} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger">Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={link}>Log in</NavLink>
                <NavLink to="/register" className={link}>Sign up</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link role="menuitem" to={to} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sunken">
      <Icon size={16} className="text-muted" /> {children}
    </Link>
  );
}
