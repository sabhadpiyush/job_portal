import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import api, { errMsg, CATEGORIES, JOB_TYPES, WORK_MODES, LEVELS } from '../lib';
import JobCard from '../components/JobCard';
import { Empty, Pagination, Spinner, TagInput } from '../components/ui';
import { useSaveJob, useCanSave } from '../components/hooks';

const SALARY = [['', 'Any'], ['300000', '₹3 LPA+'], ['600000', '₹6 LPA+'], ['1000000', '₹10 LPA+'], ['1800000', '₹18 LPA+']];
const POSTED = [['', 'Any time'], ['1', 'Last 24 hours'], ['7', 'Last 7 days'], ['30', 'Last 30 days']];
const SORTS = [['latest', 'Newest first'], ['salary-high', 'Highest salary'], ['popular', 'Most viewed']];
const list = (v) => (v ? v.split(',').filter(Boolean) : []);


function Section({ title, children }) {
  return (
    <div role="group" aria-label={title} className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="mb-2.5 font-sans text-sm font-semibold tracking-normal">{title}</h3>
      {children}
    </div>
  );
}

function Checks({ opts, selected, onToggle }) {
  return (
    <div className="space-y-1.5">
      {opts.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-line accent-[rgb(var(--brand))]" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const canSave = useCanSave();
  const save = useSaveJob((id, saved) => setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j._id === id ? { ...j, saved } : j)) })));

  const get = (k) => params.get(k) || '';
  const [q, setQ] = useState(get('q'));
  const [loc, setLoc] = useState(get('location'));

  const set = (patch) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v === '' || v == null || (Array.isArray(v) && !v.length) ? p.delete(k) : p.set(k, Array.isArray(v) ? v.join(',') : v)));
      if (!('page' in patch)) p.delete('page');
      return p;
    });
  };
  const toggle = (key, val) => {
    const cur = list(get(key));
    set({ [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  // Debounce typing in the search boxes
  useEffect(() => {
    const t = setTimeout(() => { if (q !== get('q') || loc !== get('location')) set({ q: q.trim(), location: loc.trim() }); }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, loc]);

  const key = params.toString();
  useEffect(() => {
    let live = true;
    setLoading(true);
    api.get(`/jobs?${key}&limit=8`)
      .then((r) => { if (live) { setData(r.data); setError(''); } })
      .catch((e) => live && setError(errMsg(e)))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [key]);

  const active = useMemo(() => {
    const out = [];
    ['type', 'workMode', 'level'].forEach((k) => list(get(k)).forEach((v) => out.push({ k, v, text: [...JOB_TYPES, ...WORK_MODES, ...LEVELS].find((x) => x.value === v)?.label || v })));
    if (get('category')) out.push({ k: 'category', v: get('category'), text: get('category') });
    if (get('minSalary')) out.push({ k: 'minSalary', v: '', text: SALARY.find((s) => s[0] === get('minSalary'))?.[1] });
    if (get('posted')) out.push({ k: 'posted', v: '', text: POSTED.find((s) => s[0] === get('posted'))?.[1] });
    list(get('skills')).forEach((v) => out.push({ k: 'skills', v, text: v }));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const remove = ({ k, v }) => (['type', 'workMode', 'level', 'skills'].includes(k) ? toggle(k, v) : set({ [k]: '' }));
  const clearAll = () => { setQ(''); setLoc(''); setParams({}); };

  return (
    <div className="page py-8">
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2.5 px-3">
          <Search size={18} className="text-muted" /><span className="sr-only">Search jobs</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, skill or company" className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/70" />
        </label>
        <label className="flex items-center gap-2.5 border-t border-line px-3 sm:w-64 sm:border-l sm:border-t-0">
          <MapPin size={18} className="text-muted" /><span className="sr-only">Location</span>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City or state" className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/70" />
        </label>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="card space-y-4 p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Filters</h2>
              {active.length > 0 && <button onClick={clearAll} className="text-xs font-semibold text-brand hover:underline">Clear all</button>}
            </div>
            <Section title="Job type"><Checks opts={JOB_TYPES} selected={list(get('type'))} onToggle={(v) => toggle('type', v)} /></Section>
            <Section title="Work mode"><Checks opts={WORK_MODES} selected={list(get('workMode'))} onToggle={(v) => toggle('workMode', v)} /></Section>
            <Section title="Experience"><Checks opts={LEVELS} selected={list(get('level'))} onToggle={(v) => toggle('level', v)} /></Section>
            <Section title="Field">
              <select className="input" value={get('category')} onChange={(e) => set({ category: e.target.value })} aria-label="Field">
                <option value="">All fields</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Section>
            <Section title="Minimum salary">
              <select className="input" value={get('minSalary')} onChange={(e) => set({ minSalary: e.target.value })} aria-label="Minimum salary">
                {SALARY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Section>
            <Section title="Date posted">
              <select className="input" value={get('posted')} onChange={(e) => set({ posted: e.target.value })} aria-label="Date posted">
                {POSTED.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Section>
            <Section title="Skills">
              <TagInput value={list(get('skills'))} onChange={(v) => set({ skills: v })} placeholder="e.g. React" />
            </Section>
          </div>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {loading && !data ? 'Searching…' : <><strong className="text-ink">{data?.total ?? 0}</strong> {data?.total === 1 ? 'job' : 'jobs'} found</>}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters((s) => !s)} className="btn btn-outline btn-sm lg:hidden"><SlidersHorizontal size={15} /> Filters{active.length ? ` (${active.length})` : ''}</button>
              <label className="sr-only" htmlFor="sort">Sort</label>
              <select id="sort" className="input !w-auto !py-1.5" value={get('sort') || 'latest'} onChange={(e) => set({ sort: e.target.value })}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {active.map((a) => (
                <button key={a.k + a.v} onClick={() => remove(a)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand hover:opacity-80" aria-label={`Remove filter ${a.text}`}>
                  {a.text} <X size={12} />
                </button>
              ))}
            </div>
          )}

          {error && <div className="card border-danger/40 p-4 text-sm text-danger">{error}</div>}

          <div className={`space-y-4 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
            {!data && loading && <div className="flex justify-center py-16 text-muted"><Spinner /></div>}
            {data?.jobs.map((j) => <JobCard key={j._id} job={j} canSave={canSave} onSave={save} />)}
            {data && data.jobs.length === 0 && (
              <Empty title="No jobs match these filters" action={<button onClick={clearAll} className="btn btn-outline">Clear filters</button>}>
                Try a broader search, remove a filter, or check a different location.
              </Empty>
            )}
          </div>
          {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
        </section>
      </div>
    </div>
  );
}
