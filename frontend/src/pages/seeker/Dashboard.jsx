import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, Hourglass, Bookmark, PartyPopper, ArrowRight, Check, Star } from 'lucide-react';
import api, { errMsg, profileScore, timeAgo, PIPELINE, STATUS } from '../../lib';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Empty, PageLoader, Stat, StatusBadge, Tabs } from '../../components/ui';
import JobCard from '../../components/JobCard';

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState(null);
  const [saved, setSaved] = useState(null);

  const load = () => {
    api.get('/dashboard/seeker').then((r) => setStats(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/applications/mine').then((r) => setApps(r.data.applications)).catch(() => setApps([]));
    api.get('/jobs/saved').then((r) => setSaved(r.data.jobs)).catch(() => setSaved([]));
  };
  useEffect(load, []);

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this application? You can apply again later.')) return;
    try { await api.delete(`/applications/${id}`); toast.success('Application withdrawn'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const unsave = async (job) => {
    try { await api.post(`/jobs/${job._id}/save`); setSaved((s) => s.filter((j) => j._id !== job._id)); toast.success('Removed from saved jobs'); } catch (e) { toast.error(errMsg(e)); }
  };

  if (!stats || !apps || !saved) return <PageLoader />;
  const { pct, missing } = profileScore(user);

  return (
    <div className="page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar} name={user.name} size={56} round />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Hi, {user.name.split(' ')[0]}</h1>
            <p className="text-muted">{user.headline || 'Add a headline to your profile so recruiters know what you do.'}</p>
          </div>
        </div>
        <Link to="/jobs" className="btn btn-primary">Find jobs</Link>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'applications', label: 'Applications', count: apps.length },
        { value: 'saved', label: 'Saved jobs', count: saved.length },
      ]} />

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat icon={Send} label="Applied" value={stats.totals.applied} />
              <Stat icon={Hourglass} label="In progress" value={stats.totals.inProgress} hint="Reviewing, shortlisted or interview" />
              <Stat icon={Bookmark} label="Saved" value={stats.totals.saved} />
              <Stat icon={PartyPopper} label="Offers" value={stats.totals.offers} />
            </div>

            {pct < 100 && (
              <div className="card p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">Your profile is {pct}% complete</h2>
                  <Link to="/profile" className="btn btn-outline btn-sm">Finish profile</Link>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted">Next: {missing.slice(0, 3).join(' · ')}</p>
              </div>
            )}

            <section>
              <h2 className="mb-4 text-xl font-semibold">Recommended for you</h2>
              {stats.recommended.length ? (
                <div className="grid gap-4 lg:grid-cols-2">{stats.recommended.map((j) => <JobCard key={j._id} job={j} />)}</div>
              ) : (
                <Empty title="No recommendations yet" action={<Link to="/profile" className="btn btn-primary">Add your skills</Link>}>
                  Add the skills you have and we will show open roles that match them.
                </Empty>
              )}
            </section>

            {stats.recent.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Recent applications</h2>
                  <button onClick={() => setTab('applications')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">View all <ArrowRight size={14} /></button>
                </div>
                <div className="card divide-y divide-line">
                  {stats.recent.map((a) => (
                    <div key={a._id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <Link to={`/jobs/${a.job?._id}`} className="block truncate font-semibold hover:text-brand">{a.job?.title}</Link>
                        <span className="text-sm text-muted">{a.job?.company?.name} · {timeAgo(a.createdAt)}</span>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'applications' && (
          apps.length ? (
            <div className="space-y-4">{apps.map((a) => <ApplicationRow key={a._id} a={a} onWithdraw={() => withdraw(a._id)} />)}</div>
          ) : (
            <Empty title="You have not applied to any jobs yet" action={<Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}>
              Applications you send will show up here, with their status.
            </Empty>
          )
        )}

        {tab === 'saved' && (
          saved.length ? (
            <div className="grid gap-4 lg:grid-cols-2">{saved.map((j) => <JobCard key={j._id} job={j} canSave onSave={unsave} />)}</div>
          ) : (
            <Empty title="No saved jobs" action={<Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}>Tap the bookmark on any job to keep it here for later.</Empty>
          )
        )}
      </div>
    </div>
  );
}

function ApplicationRow({ a, onWithdraw }) {
  const idx = PIPELINE.indexOf(a.status);
  const rejected = a.status === 'rejected';
  const last = a.statusHistory?.[a.statusHistory.length - 1];
  const canWithdraw = ['applied', 'reviewing'].includes(a.status);
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/jobs/${a.job?._id}`} className="text-lg font-semibold hover:text-brand">{a.job?.title || 'Job removed'}</Link>
          <p className="text-sm text-muted">{a.job?.company?.name} · {a.job?.location} · Applied {timeAgo(a.createdAt)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {!rejected && (
        <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Application progress">
          {PIPELINE.map((s, i) => (
            <li key={s} className="min-w-0">
              <div className="flex items-center">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white dark:text-bg ${i < idx ? 'bg-brand' : i === idx ? (s === 'shortlisted' ? 'bg-accent !text-ink' : 'bg-brand') : 'bg-sunken text-transparent'}`}>
                  {s === 'shortlisted' && i === idx ? <Star size={12} fill="currentColor" /> : <Check size={13} strokeWidth={3} />}
                </span>
                {i < PIPELINE.length - 1 && <span className={`h-0.5 flex-1 ${i < idx ? 'bg-brand' : 'bg-line'}`} />}
              </div>
              <div className={`mt-1.5 truncate text-[11px] font-medium sm:text-xs ${i <= idx ? 'text-ink' : 'text-muted'}`}>{STATUS[s].label}</div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">{last?.note ? `Latest note: ${last.note}` : ''}</span>
        {canWithdraw && <button onClick={onWithdraw} className="btn btn-danger btn-sm">Withdraw</button>}
      </div>
    </article>
  );
}
