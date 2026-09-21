import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Briefcase, Wifi, Clock, Users, Eye, CalendarDays, Bookmark, Pencil, Globe, Check, FileText, Upload } from 'lucide-react';
import api, { errMsg, formatSalary, timeAgo, formatDate, label, JOB_TYPES, WORK_MODES, LEVELS } from '../lib';
import { useAuth } from '../context/AuthContext';
import { Avatar, MatchBadge, Modal, PageLoader, Spinner, StatusBadge, Empty } from '../components/ui';
import JobCard from '../components/JobCard';

export default function JobDetail() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    setData(null);
    api.get(`/jobs/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
    window.scrollTo(0, 0);
  }, [id]);

  if (error) return <div className="page py-16"><Empty title="Job not found" action={<Link className="btn btn-primary" to="/jobs">Browse jobs</Link>}>{error}</Empty></div>;
  if (!data) return <PageLoader />;

  const { job, similar, application, isOwner } = data;
  const isSeeker = user?.role === 'seeker';
  const closed = job.status !== 'open' || (job.deadline && new Date(job.deadline) < new Date());
  const mine = new Set((user?.skills || []).map((s) => s.toLowerCase()));

  const toggleSave = async () => {
    if (!user) return nav('/login', { state: { from: `/jobs/${id}` } });
    try {
      const r = await api.post(`/jobs/${id}/save`);
      setData((d) => ({ ...d, job: { ...d.job, saved: r.data.saved } }));
      toast.success(r.data.saved ? 'Job saved' : 'Removed from saved jobs');
    } catch (e) { toast.error(errMsg(e)); }
  };

  const onApplied = (app) => {
    setApplyOpen(false);
    setData((d) => ({ ...d, application: { status: app.status, createdAt: app.createdAt }, job: { ...d.job, applicantsCount: d.job.applicantsCount + 1 } }));
    toast.success('Application sent. Good luck!');
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => {});
  };

  const facts = [
    [Briefcase, 'Job type', label(JOB_TYPES, job.type)],
    [Wifi, 'Work mode', label(WORK_MODES, job.workMode)],
    [Clock, 'Experience', label(LEVELS, job.experienceLevel)],
    [Users, 'Openings', job.openings],
    [CalendarDays, 'Apply by', job.deadline ? formatDate(job.deadline) : 'Open until filled'],
  ];

  return (
    <div className="page py-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar src={job.company?.logo} name={job.company?.name} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1>
            <p className="mt-1 text-muted">{job.company?.name}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {job.location}</span>
              <span className="inline-flex items-center gap-1.5"><Eye size={15} /> {job.views} views</span>
              <span className="inline-flex items-center gap-1.5"><Users size={15} /> {job.applicantsCount} applied</span>
              <span>Posted {timeAgo(job.createdAt)}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="font-display text-xl font-semibold">{formatSalary(job.salary)}</span>
              {isSeeker && <MatchBadge score={job.matchScore} />}
              {closed && <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Closed</span>}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:w-48">
            {isOwner ? (
              <>
                <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-primary"><Users size={16} /> View applicants</Link>
                <Link to={`/recruiter/jobs/${job._id}/edit`} className="btn btn-outline"><Pencil size={16} /> Edit job</Link>
              </>
            ) : application ? (
              <div className="rounded-lg bg-sunken p-3 text-center">
                <div className="text-xs text-muted">You applied {timeAgo(application.createdAt)}</div>
                <div className="mt-1.5"><StatusBadge status={application.status} /></div>
              </div>
            ) : user?.role === 'recruiter' ? null : (
              <button disabled={closed} onClick={() => (user ? setApplyOpen(true) : nav('/login', { state: { from: `/jobs/${id}` } }))} className="btn btn-primary py-3">
                {closed ? 'Applications closed' : user ? 'Apply now' : 'Log in to apply'}
              </button>
            )}
            {!isOwner && user?.role !== 'recruiter' && (
              <button onClick={toggleSave} className="btn btn-outline" aria-pressed={!!job.saved}>
                <Bookmark size={16} fill={job.saved ? 'currentColor' : 'none'} className={job.saved ? 'text-accent' : ''} /> {job.saved ? 'Saved' : 'Save job'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-6 sm:p-8">
            <h2 className="mb-3 text-xl font-semibold">Job description</h2>
            <div className="max-w-[70ch] whitespace-pre-line leading-7 text-ink/90">{job.description}</div>
          </section>

          {job.skills?.length > 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-semibold">Skills required</h2>
              {isSeeker && <p className="mb-3 text-sm text-muted">Skills already on your profile are ticked.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => {
                  const has = isSeeker && mine.has(s.toLowerCase());
                  return <span key={s} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${has ? 'bg-brand-soft text-brand' : 'bg-sunken text-muted'}`}>{has && <Check size={14} strokeWidth={3} />}{s}</span>;
                })}
              </div>
            </section>
          )}

          {job.perks?.length > 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="mb-3 text-xl font-semibold">Perks and benefits</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {job.perks.map((p) => <li key={p} className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand" /> {p}</li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold">Job overview</h2>
            <dl className="space-y-3.5">
              {facts.map(([Icon, k, v]) => (
                <div key={k} className="flex items-start gap-3">
                  <Icon size={17} className="mt-0.5 text-muted" />
                  <div><dt className="text-xs text-muted">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-3">
              <Avatar src={job.company?.logo} name={job.company?.name} size={40} />
              <div className="font-semibold">{job.company?.name}</div>
            </div>
            {job.recruiter?.company?.description && <p className="mt-3 text-sm text-muted">{job.recruiter.company.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.recruiter?.company?.industry && <span className="chip">{job.recruiter.company.industry}</span>}
              {job.recruiter?.company?.size && <span className="chip">{job.recruiter.company.size} people</span>}
            </div>
            {job.company?.website && <a href={job.company.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><Globe size={15} /> Company website</a>}
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-semibold">Similar jobs</h2>
          <div className="grid gap-4 lg:grid-cols-2">{similar.map((j) => <JobCard key={j._id} job={j} />)}</div>
        </section>
      )}

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} job={job} user={user} onDone={onApplied} />
    </div>
  );
}

function ApplyModal({ open, onClose, job, user, onDone }) {
  const [cover, setCover] = useState('');
  const [file, setFile] = useState(null);
  const [useProfile, setUseProfile] = useState(true);
  const [busy, setBusy] = useState(false);
  const hasProfileResume = !!user?.resume?.url;

  useEffect(() => { if (open) { setCover(''); setFile(null); setUseProfile(hasProfileResume); } }, [open, hasProfileResume]);

  const submit = async (e) => {
    e.preventDefault();
    const usingFile = !useProfile || !hasProfileResume;
    if (usingFile && !file) return toast.error('Attach your resume to apply');
    const fd = new FormData();
    fd.append('coverLetter', cover);
    if (usingFile) fd.append('resume', file);
    setBusy(true);
    try {
      const { data } = await api.post(`/applications/${job._id}`, fd);
      onDone(data.application);
    } catch (err) {
      toast.error(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Apply to ${job.company?.name}`} wide>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-muted">Applying for <strong className="text-ink">{job.title}</strong></p>

        <div>
          <span className="label">Resume</span>
          {hasProfileResume && (
            <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50">
              <input type="radio" name="r" checked={useProfile} onChange={() => setUseProfile(true)} className="accent-[rgb(var(--brand))]" />
              <FileText size={18} className="text-muted" /> <span className="truncate">{user.resume.originalName || 'My profile resume'}</span>
            </label>
          )}
          <label className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm ${!useProfile || !hasProfileResume ? 'border-brand bg-brand-soft/50' : 'border-line'}`}>
            {hasProfileResume && <input type="radio" name="r" checked={!useProfile} onChange={() => setUseProfile(false)} className="accent-[rgb(var(--brand))]" />}
            <Upload size={18} className="text-muted" />
            <span className="truncate">{file ? file.name : hasProfileResume ? 'Upload a different resume' : 'Upload your resume (PDF or Word, max 5 MB)'}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => { setFile(e.target.files[0] || null); setUseProfile(false); }} />
          </label>
        </div>

        <div>
          <label className="label" htmlFor="cl">Cover letter <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="cl" rows={5} maxLength={3000} value={cover} onChange={(e) => setCover(e.target.value)} className="input" placeholder="Tell them why you are a good fit for this role." />
          <p className="hint text-right">{cover.length}/3000</p>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button disabled={busy} className="btn btn-primary">{busy && <Spinner />} Send application</button>
        </div>
      </form>
    </Modal>
  );
}
