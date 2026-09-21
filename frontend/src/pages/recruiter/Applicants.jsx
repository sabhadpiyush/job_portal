import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, FileText, Mail, Phone, MapPin, ChevronDown, Github, Linkedin, Globe } from 'lucide-react';
import api, { errMsg, fileUrl, timeAgo, formatDate, STATUS } from '../../lib';
import { Avatar, Empty, MatchBadge, PageLoader, StatusBadge, Tabs } from '../../components/ui';

const ORDER = ['applied', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected'];

export default function Applicants() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('match');
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/applications/job/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e))); }, [id]);

  const list = useMemo(() => {
    if (!data) return [];
    const l = data.applications.filter((a) => tab === 'all' || a.status === tab);
    return [...l].sort((a, b) => (sort === 'match' ? (b.matchScore ?? -1) - (a.matchScore ?? -1) : new Date(b.createdAt) - new Date(a.createdAt)));
  }, [data, tab, sort]);

  const patch = (appId, changes) => setData((d) => {
    const applications = d.applications.map((a) => (a._id === appId ? { ...a, ...changes } : a));
    const counts = ORDER.reduce((acc, s) => ({ ...acc, [s]: applications.filter((a) => a.status === s).length }), {});
    return { ...d, applications, counts };
  });

  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Phone', 'Location', 'Experience (yrs)', 'Skill match %', 'Status', 'Applied on']];
    data.applications.forEach((a) => rows.push([a.applicant?.name, a.applicant?.email, a.applicant?.phone || '', a.applicant?.location || '', a.applicant?.experienceYears ?? '', a.matchScore ?? '', STATUS[a.status].label, formatDate(a.createdAt)]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${data.job.title.replace(/\W+/g, '-').toLowerCase()}-applicants.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <div className="page py-16"><Empty title="Cannot load applicants" action={<Link className="btn btn-primary" to="/recruiter">Back to dashboard</Link>}>{error}</Empty></div>;
  if (!data) return <PageLoader />;

  return (
    <div className="page py-8">
      <Link to="/recruiter" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand"><ArrowLeft size={15} /> Dashboard</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{data.job.title}</h1>
          <p className="text-muted">{data.applications.length} {data.applications.length === 1 ? 'applicant' : 'applicants'} · <Link to={`/jobs/${id}`} className="text-brand hover:underline">View listing</Link></p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="match">Best skill match</option>
            <option value="new">Newest first</option>
          </select>
          <button onClick={exportCsv} disabled={!data.applications.length} className="btn btn-outline"><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: data.applications.length }, ...ORDER.map((s) => ({ value: s, label: STATUS[s].label, count: data.counts[s] }))]} />
      </div>

      <div className="mt-6 space-y-4">
        {list.length === 0 && <Empty title={data.applications.length ? 'No candidates at this stage' : 'No applicants yet'}>{data.applications.length ? 'Change the tab to see other candidates.' : 'Share your listing to start receiving applications.'}</Empty>}
        {list.map((a) => <ApplicantCard key={a._id} a={a} job={data.job} onChange={(c) => patch(a._id, c)} />)}
      </div>
    </div>
  );
}

function ApplicantCard({ a, job, onChange }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(a.recruiterNotes || '');
  const p = a.applicant || {};
  const jobSkills = new Set(job.skills.map((s) => s.toLowerCase()));

  const setStatus = async (status) => {
    try {
      await api.patch(`/applications/${a._id}/status`, { status });
      onChange({ status, statusHistory: [...(a.statusHistory || []), { status, at: new Date().toISOString() }] });
      toast.success(`Moved to ${STATUS[status].label}`);
    } catch (e) { toast.error(errMsg(e)); }
  };
  const saveNotes = async () => {
    if (notes === (a.recruiterNotes || '')) return;
    try { await api.patch(`/applications/${a._id}/status`, { recruiterNotes: notes }); onChange({ recruiterNotes: notes }); toast.success('Notes saved'); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar src={p.avatar} name={p.name} size={52} round />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <MatchBadge score={a.matchScore} />
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-muted">{p.headline || 'No headline'} · {p.experienceYears ?? 0} yrs experience · Applied {timeAgo(a.createdAt)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(p.skills || []).map((s) => <span key={s} className={`chip ${jobSkills.has(s.toLowerCase()) ? '!bg-brand-soft !text-brand' : ''}`}>{s}</span>)}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-44">
          <label className="sr-only" htmlFor={`st-${a._id}`}>Change status</label>
          <select id={`st-${a._id}`} value={a.status} onChange={(e) => setStatus(e.target.value)} className="input !py-2 font-semibold">
            {ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
          {a.resume?.url && <a href={fileUrl(a.resume.url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><FileText size={14} /> Open resume</a>}
        </div>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand" aria-expanded={open}>
        {open ? 'Hide details' : 'Show details'} <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 grid gap-6 border-t border-line pt-4 md:grid-cols-2">
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5 text-muted">
              <a className="flex items-center gap-2 hover:text-brand" href={`mailto:${p.email}`}><Mail size={15} /> {p.email}</a>
              {p.phone && <div className="flex items-center gap-2"><Phone size={15} /> {p.phone}</div>}
              {p.location && <div className="flex items-center gap-2"><MapPin size={15} /> {p.location}</div>}
              {p.links?.github && <a className="flex items-center gap-2 hover:text-brand" href={p.links.github} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>}
              {p.links?.linkedin && <a className="flex items-center gap-2 hover:text-brand" href={p.links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a>}
              {p.links?.portfolio && <a className="flex items-center gap-2 hover:text-brand" href={p.links.portfolio} target="_blank" rel="noreferrer"><Globe size={15} /> Portfolio</a>}
            </div>
            {p.education && <div><div className="text-xs text-muted">Education</div>{p.education}</div>}
            {p.bio && <div><div className="text-xs text-muted">About</div><p className="whitespace-pre-line">{p.bio}</p></div>}
            <div>
              <div className="text-xs text-muted">Cover letter</div>
              <p className="whitespace-pre-line">{a.coverLetter || 'No cover letter provided.'}</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label htmlFor={`n-${a._id}`} className="label">Private notes</label>
              <textarea id={`n-${a._id}`} rows={4} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Only you can see these." />
            </div>
            <div>
              <div className="mb-2 text-xs text-muted">History</div>
              <ol className="space-y-1.5">
                {(a.statusHistory || []).map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-brand" /><span className="font-medium text-ink">{STATUS[h.status]?.label || h.status}</span> · {formatDate(h.at)}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
