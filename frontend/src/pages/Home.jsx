import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Check, Star, Code2, Palette, Megaphone, TrendingUp, BarChart3, Landmark, Users, Headset, Settings2, Shapes } from 'lucide-react';
import api from '../lib';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { useSaveJob, useCanSave } from '../components/hooks';

const ICONS = { Engineering: Code2, Design: Palette, Marketing: Megaphone, Sales: TrendingUp, 'Data & Analytics': BarChart3, Finance: Landmark, 'Human Resources': Users, 'Customer Support': Headset, Operations: Settings2, Other: Shapes };
const QUICK = [['React', '/jobs?q=React'], ['Remote', '/jobs?workMode=remote'], ['Internships', '/jobs?type=internship'], ['Freshers', '/jobs?level=fresher'], ['Posted today', '/jobs?posted=1']];

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [meta, setMeta] = useState(null);
  const canSave = useCanSave();
  const save = useSaveJob((id, saved) => setMeta((m) => ({ ...m, featured: m.featured.map((j) => (j._id === id ? { ...j, saved } : j)) })));

  useEffect(() => { api.get('/jobs/meta').then((r) => setMeta(r.data)).catch(() => setMeta({ categories: [], featured: [], totalJobs: 0, totalCompanies: 0 })); }, []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (loc.trim()) p.set('location', loc.trim());
    nav(`/jobs?${p}`);
  };

  return (
    <>
      <section className="border-b border-line">
        <div className="page grid items-center gap-12 py-14 lg:grid-cols-[1.25fr_1fr] lg:py-20">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-[3.5rem]">Get shortlisted for work you actually want.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Search openings, see how closely your skills match each role, and follow every application from applied to hired.
            </p>

            <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-line bg-surface p-2 sm:flex-row" role="search">
              <label className="flex flex-1 items-center gap-2.5 px-3">
                <Search size={18} className="text-muted" />
                <span className="sr-only">Job title, skill or company</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title or skill" className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/70" />
              </label>
              <label className="flex items-center gap-2.5 border-t border-line px-3 sm:w-44 sm:border-l sm:border-t-0">
                <MapPin size={18} className="text-muted" />
                <span className="sr-only">Location</span>
                <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City or remote" className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/70" />
              </label>
              <button className="btn btn-primary px-6 py-3">Search jobs</button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Try:</span>
              {QUICK.map(([l, to]) => <Link key={l} to={to} className="rounded-full border border-line px-3 py-1 text-muted hover:border-brand hover:text-brand">{l}</Link>)}
            </div>

            {meta && meta.totalJobs > 0 && (
              <p className="mt-8 text-sm text-muted">
                <strong className="text-ink">{meta.totalJobs}</strong> open roles across <strong className="text-ink">{meta.totalCompanies}</strong> companies right now.
              </p>
            )}
          </div>

          <PipelineCard />
        </div>
      </section>

      <section className="page mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold sm:text-3xl">Browse by field</h2>
          <Link to="/jobs" className="text-sm font-semibold text-brand hover:underline">See all jobs</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(meta?.categories?.length ? meta.categories : Object.keys(ICONS).slice(0, 10).map((name) => ({ name, count: 0 }))).map((c) => {
            const Icon = ICONS[c.name] || Shapes;
            return (
              <Link key={c.name} to={`/jobs?category=${encodeURIComponent(c.name)}`} className="card flex items-center gap-3 p-4 transition-colors hover:border-brand/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon size={19} /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{c.name}</span>
                  <span className="text-xs text-muted">{c.count} open</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {meta?.featured?.length > 0 && (
        <section className="page mt-16">
          <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">Fresh openings</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {meta.featured.map((j) => <JobCard key={j._id} job={j} canSave={canSave} onSave={save} />)}
          </div>
        </section>
      )}

      <section className="page mt-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-8">
            <h3 className="text-2xl font-semibold">Looking for your next role?</h3>
            <p className="mt-2 max-w-md text-muted">Build a profile once, upload your resume, and apply in a click. You will see a skill match on every job.</p>
            <Link to={user ? '/jobs' : '/register'} className="btn btn-primary mt-6">{user ? 'Browse jobs' : 'Create a free profile'}</Link>
          </div>
          <div className="rounded-xl bg-brand p-8 text-white dark:text-bg">
            <h3 className="text-2xl font-semibold">Hiring?</h3>
            <p className="mt-2 max-w-md opacity-90">Post a job in minutes, review applicants ranked by skill match, and move them through your pipeline.</p>
            <Link to={user?.role === 'recruiter' ? '/recruiter/jobs/new' : '/register?role=recruiter'} className="btn mt-6 bg-white text-brand-strong hover:bg-white/90 dark:bg-bg dark:text-brand">Post a job</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// The memorable moment on the page: an application moving through the pipeline
function PipelineCard() {
  const stages = [
    { name: 'Applied', note: 'Resume and cover letter sent', done: true },
    { name: 'In review', note: 'Recruiter opened your profile', done: true },
    { name: 'Shortlisted', note: 'You are on the shortlist', current: true },
    { name: 'Interview', note: 'Waiting for a slot' },
    { name: 'Hired', note: '' },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-float">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft font-display font-bold text-brand">NL</div>
          <div>
            <div className="font-semibold leading-tight">Frontend Engineer</div>
            <div className="text-sm text-muted">Nimbus Labs · Remote</div>
          </div>
          <span className="ml-auto rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">92% match</span>
        </div>
        <ol className="mt-5 space-y-0">
          {stages.map((s, i) => (
            <li key={s.name} className="stage-in flex gap-4" style={{ animationDelay: `${i * 0.35}s` }}>
              <div className="flex flex-col items-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${s.done ? 'border-brand bg-brand text-white dark:text-bg' : s.current ? 'star-pop border-accent bg-accent text-ink' : 'border-line text-transparent'}`}>
                  {s.current ? <Star size={13} fill="currentColor" /> : <Check size={14} strokeWidth={3} />}
                </span>
                {i < stages.length - 1 && <span className={`my-1 h-7 w-0.5 ${s.done ? 'bg-brand' : 'bg-line'}`} />}
              </div>
              <div className="pb-4">
                <div className={`text-sm font-semibold leading-7 ${!s.done && !s.current ? 'text-muted' : ''}`}>{s.name}</div>
                {s.note && <div className="-mt-1 text-xs text-muted">{s.note}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
