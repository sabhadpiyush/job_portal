import { useEffect, useState } from 'react';
import { Loader2, X, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS, fileUrl, initials } from '../lib';

export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path d="M16 6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L16 20.8 10.1 24l1.3-6.6-4.9-4.6 6.6-.8z" className="fill-accent" />
    </svg>
  );
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} size={18} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted">
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <Inbox className="mb-3 text-muted" size={30} />
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Colour-coded initials tile when no image exists
const TILE = ['bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', 'bg-sky-500/15 text-sky-700 dark:text-sky-300', 'bg-amber-500/20 text-amber-800 dark:text-amber-300', 'bg-rose-500/15 text-rose-700 dark:text-rose-300', 'bg-violet-500/15 text-violet-700 dark:text-violet-300'];
export function Avatar({ src, name = '', size = 44, round = false }) {
  const tone = TILE[(name.charCodeAt(0) || 0) % TILE.length];
  const shape = round ? 'rounded-full' : 'rounded-lg';
  if (src) return <img src={fileUrl(src)} alt={name} style={{ width: size, height: size }} className={`${shape} shrink-0 object-cover`} />;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }} className={`${shape} ${tone} flex shrink-0 items-center justify-center font-display font-semibold`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.applied;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const withGaps = nums.reduce((acc, n, i) => (i && n - nums[i - 1] > 1 ? [...acc, '…', n] : [...acc, n]), []);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      {withGaps.map((n, i) =>
        n === '…' ? <span key={`g${i}`} className="px-2 text-muted">…</span> : (
          <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${n === page ? 'bg-brand text-white dark:text-bg' : 'text-muted hover:bg-sunken'}`}>{n}</button>
        )
      )}
      <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
    </nav>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-float sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm -mr-2 -mt-1" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${value === t.value ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>
          {t.label}
          {t.count !== undefined && <span className="rounded-full bg-sunken px-1.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-muted"><Icon size={16} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

// Type a value and press Enter or comma to add it as a tag
export function TagInput({ value = [], onChange, placeholder = 'Type a skill and press Enter', suggestions = [] }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const t = raw.trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
            {t}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove ${t}`}><X size={12} /></button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={value.length ? '' : placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted/70" />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !value.includes(s)).slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="chip hover:bg-brand-soft hover:text-brand">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function MatchBadge({ score }) {
  if (score === null || score === undefined) return null;
  const tone = score >= 70 ? 'bg-brand-soft text-brand' : score >= 40 ? 'bg-accent/20 text-amber-800 dark:text-accent' : 'bg-sunken text-muted';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`} title="How many of the required skills are on your profile">{score}% match</span>;
}
