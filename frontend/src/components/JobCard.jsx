import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Briefcase, Wifi, Star } from 'lucide-react';
import { Avatar, MatchBadge } from './ui';
import { formatSalary, timeAgo, label, JOB_TYPES, WORK_MODES } from '../lib';

export default function JobCard({ job, onSave, canSave }) {
  return (
    <article className="card group relative p-5 transition-colors hover:border-brand/60">
      <div className="flex gap-4">
        <Avatar src={job.company?.logo} name={job.company?.name} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-snug">
                <Link to={`/jobs/${job._id}`} className="after:absolute after:inset-0 hover:text-brand">{job.title}</Link>
              </h3>
              <p className="text-sm text-muted">{job.company?.name}</p>
            </div>
            <div className="relative z-10 flex shrink-0 items-center gap-2">
              {job.featured && <span className="hidden items-center gap-1 rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-amber-800 dark:text-accent sm:inline-flex"><Star size={11} fill="currentColor" /> Featured</span>}
              {canSave && (
                <button onClick={() => onSave?.(job)} aria-pressed={!!job.saved} aria-label={job.saved ? 'Remove from saved jobs' : 'Save job'}
                  className={`rounded-lg p-2 transition-colors ${job.saved ? 'text-accent' : 'text-muted hover:bg-sunken hover:text-ink'}`}>
                  <Bookmark size={18} fill={job.saved ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase size={14} /> {label(JOB_TYPES, job.type)}</span>
            <span className="inline-flex items-center gap-1.5"><Wifi size={14} /> {label(WORK_MODES, job.workMode)}</span>
          </div>

          {job.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}
              {job.skills.length > 5 && <span className="chip">+{job.skills.length - 5}</span>}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-base font-semibold">{formatSalary(job.salary)}</span>
            <div className="flex items-center gap-3">
              <MatchBadge score={job.matchScore} />
              <span className="text-xs text-muted">{timeAgo(job.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
