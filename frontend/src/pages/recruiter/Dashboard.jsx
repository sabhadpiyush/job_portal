import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Users, Eye, UserCheck, Plus, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg, timeAgo, STATUS } from '../../lib';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Empty, PageLoader, Stat } from '../../components/ui';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);

  const load = () => {
    api.get('/dashboard/recruiter').then((r) => setStats(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/jobs/mine').then((r) => setJobs(r.data.jobs)).catch(() => setJobs([]));
  };
  useEffect(load, []);

  const toggle = async (job) => {
    try { await api.patch(`/jobs/${job._id}/status`); toast.success(job.status === 'open' ? 'Job closed' : 'Job reopened'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}" and all of its applications? This cannot be undone.`)) return;
    try { await api.delete(`/jobs/${job._id}`); toast.success('Job deleted'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (!stats || !jobs) return <PageLoader />;

  // SVG attributes cannot read CSS variables, so charts take concrete colours
  const c = dark ? { brand: '#34BE9C', grid: '#243631', text: '#94A69F', tip: '#13201D' } : { brand: '#0E7C66', grid: '#DAE3E0', text: '#5B6B66', tip: '#FFFFFF' };
  const funnel = ['applied', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected'].map((s) => ({ name: STATUS[s].label, value: stats.statusCounts[s] }));
  const t = stats.totals;

  return (
    <div className="page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{user.company?.name || 'Your company'}</h1>
          <p className="text-muted">Hiring dashboard</p>
        </div>
        <Link to="/recruiter/jobs/new" className="btn btn-primary"><Plus size={16} /> Post a job</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Open jobs" value={t.openJobs} hint={`${t.jobs} posted in total`} />
        <Stat icon={Users} label="Applicants" value={t.applications} hint={`${t.newThisWeek} in the last 7 days`} />
        <Stat icon={Eye} label="Job views" value={t.views} />
        <Stat icon={UserCheck} label="Hired" value={t.hired} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="mb-4 text-base font-semibold">Applications in the last 30 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.series} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.brand} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: c.tip, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 13 }} labelStyle={{ color: c.text }} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke={c.brand} strokeWidth={2} fill="url(#fill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Hiring pipeline</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="name" width={84} tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: c.grid, opacity: 0.4 }} contentStyle={{ background: c.tip, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="value" name="Candidates" fill={c.brand} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Your job posts</h2>
        {jobs.length === 0 ? (
          <Empty title="You have not posted a job yet" action={<Link to="/recruiter/jobs/new" className="btn btn-primary">Post your first job</Link>}>
            Once you post a job, applicants will appear here.
          </Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr><th className="p-4 font-medium">Job</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Applicants</th><th className="p-4 font-medium">Views</th><th className="p-4 font-medium">Posted</th><th className="p-4 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {jobs.map((j) => (
                  <tr key={j._id}>
                    <td className="p-4"><Link to={`/jobs/${j._id}`} className="font-semibold hover:text-brand">{j.title}</Link><div className="text-xs text-muted">{j.location}</div></td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${j.status === 'open' ? 'bg-brand-soft text-brand' : 'bg-sunken text-muted'}`}>{j.status === 'open' ? 'Open' : 'Closed'}</span></td>
                    <td className="p-4"><Link to={`/recruiter/jobs/${j._id}/applicants`} className="font-semibold text-brand hover:underline">{j.applicantsCount} {j.applicantsCount === 1 ? 'applicant' : 'applicants'}</Link></td>
                    <td className="p-4 tabular-nums">{j.views}</td>
                    <td className="p-4 text-muted">{timeAgo(j.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Link to={`/recruiter/jobs/${j._id}/edit`} className="btn btn-ghost btn-sm !p-2" aria-label={`Edit ${j.title}`}><Pencil size={16} /></Link>
                        <button onClick={() => toggle(j)} className="btn btn-ghost btn-sm !p-2" aria-label={j.status === 'open' ? `Close ${j.title}` : `Reopen ${j.title}`}>{j.status === 'open' ? <Lock size={16} /> : <Unlock size={16} />}</button>
                        <button onClick={() => remove(j)} className="btn btn-ghost btn-sm !p-2 hover:!text-danger" aria-label={`Delete ${j.title}`}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
