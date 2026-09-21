import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Search, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib';
import { Logo, Spinner } from '../components/ui';

function Shell({ title, sub, children, footer }) {
  return (
    <div className="page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <Logo size={40} />
        <h1 className="mt-6 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted">{sub}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-muted">{footer}</p>
      </div>
      <div className="hidden rounded-2xl bg-brand p-12 text-white dark:text-bg lg:block">
        <h2 className="max-w-sm text-3xl font-semibold leading-tight">One place to find the role, or find the person.</h2>
        <ul className="mt-8 space-y-4 text-[15px] opacity-95">
          <li>See a skill match score on every job</li>
          <li>Track each application from applied to hired</li>
          <li>Recruiters get analytics and a ranked applicant list</li>
        </ul>
      </div>
    </div>
  );
}

function Password({ value, onChange, id = 'pw', autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} required minLength={6} autoComplete={autoComplete} className="input pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const go = async (email, password) => {
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      nav(loc.state?.from || (u.role === 'recruiter' ? '/recruiter' : '/dashboard'), { replace: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Log in" sub="Pick up where you left off." footer={<>New here? <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link></>}>
      <form onSubmit={(e) => { e.preventDefault(); go(form.email, form.password); }} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="pw">Password</label><Password value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></div>
        <button disabled={busy} className="btn btn-primary w-full py-3">{busy && <Spinner />} Log in</button>
      </form>
      <div className="mt-6 rounded-xl border border-dashed border-line p-4">
        <p className="mb-3 text-sm font-semibold">Try a demo account</p>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => go('seeker@demo.com', 'password123')} className="btn btn-outline btn-sm flex-1"><Search size={14} /> Job seeker</button>
          <button disabled={busy} onClick={() => go('recruiter@demo.com', 'password123')} className="btn btn-outline btn-sm flex-1"><Users size={14} /> Recruiter</button>
        </div>
        <p className="hint">Available after running <code>npm run seed</code> on the server.</p>
      </div>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState(sp.get('role') === 'recruiter' ? 'recruiter' : 'seeker');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register({ ...form, role });
      toast.success('Account created');
      nav(u.role === 'recruiter' ? '/recruiter' : '/profile', { replace: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const opts = [['seeker', 'I am looking for a job'], ['recruiter', 'I am hiring']];
  return (
    <Shell title="Create your account" sub="It takes under a minute." footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link></>}>
      <div role="radiogroup" aria-label="Account type" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
        {opts.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={role === v} onClick={() => setRole(v)}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${role === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" required autoComplete="name" className="input" value={form.name} onChange={up('name')} /></div>
        {role === 'recruiter' && <div><label className="label" htmlFor="co">Company name</label><input id="co" required className="input" value={form.companyName} onChange={up('companyName')} /></div>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={up('email')} /></div>
        <div><label className="label" htmlFor="pw">Password</label><Password value={form.password} onChange={up('password')} autoComplete="new-password" /><p className="hint">At least 6 characters.</p></div>
        <button disabled={busy} className="btn btn-primary w-full py-3">{busy && <Spinner />} Create account</button>
      </form>
    </Shell>
  );
}
