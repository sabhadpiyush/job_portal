import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, CATEGORIES, JOB_TYPES, WORK_MODES, LEVELS } from '../../lib';
import { useAuth } from '../../context/AuthContext';
import { Field, PageLoader, Spinner, TagInput } from '../../components/ui';

const EMPTY = { title: '', category: 'Engineering', type: 'full-time', workMode: 'onsite', experienceLevel: 'fresher', location: '', minLpa: '', maxLpa: '', openings: 1, deadline: '', description: '', skills: [], perks: [] };
const SKILL_IDEAS = ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Figma', 'Communication', 'Excel'];
const PERK_IDEAS = ['Health insurance', 'Flexible hours', 'Remote friendly', 'Learning budget', 'Paid time off'];

export default function PostJob() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (!editing) return;
    api.get(`/jobs/${id}`).then(({ data }) => {
      const j = data.job;
      if (!data.isOwner) { toast.error('You can only edit your own jobs'); return nav('/recruiter'); }
      setF({
        title: j.title, category: j.category, type: j.type, workMode: j.workMode, experienceLevel: j.experienceLevel, location: j.location,
        minLpa: j.salary?.min ? j.salary.min / 100000 : '', maxLpa: j.salary?.max ? j.salary.max / 100000 : '',
        openings: j.openings, deadline: j.deadline ? j.deadline.slice(0, 10) : '', description: j.description, skills: j.skills || [], perks: j.perks || [],
      });
    }).catch((e) => { toast.error(errMsg(e)); nav('/recruiter'); }).finally(() => setLoading(false));
  }, [id, editing, nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.skills.length) return toast.error('Add at least one required skill');
    const body = {
      title: f.title, category: f.category, type: f.type, workMode: f.workMode, experienceLevel: f.experienceLevel, location: f.location,
      openings: Number(f.openings) || 1, deadline: f.deadline, description: f.description, skills: f.skills, perks: f.perks,
      salary: { min: f.minLpa ? Math.round(Number(f.minLpa) * 100000) : '', max: f.maxLpa ? Math.round(Number(f.maxLpa) * 100000) : '' },
    };
    setBusy(true);
    try {
      const { data } = editing ? await api.put(`/jobs/${id}`, body) : await api.post('/jobs', body);
      toast.success(editing ? 'Changes saved' : 'Job published');
      nav(`/jobs/${data.job._id}`);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  const select = (k, opts) => (
    <select id={k} className="input" value={f[k]} onChange={up(k)}>
      {opts.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );

  return (
    <div className="page max-w-3xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{editing ? 'Edit job' : 'Post a job'}</h1>
      <p className="mt-1 text-muted">Posting as <strong className="text-ink">{user.company?.name}</strong>. <Link to="/profile" className="text-brand hover:underline">Edit company details</Link></p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">Basics</h2>
          <Field label="Job title" htmlFor="title"><input id="title" required maxLength={120} className="input" placeholder="e.g. Full Stack Developer" value={f.title} onChange={up('title')} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Field" htmlFor="category">{select('category', CATEGORIES)}</Field>
            <Field label="Location" htmlFor="location"><input id="location" required className="input" placeholder="City, State or Remote" value={f.location} onChange={up('location')} /></Field>
            <Field label="Job type" htmlFor="type">{select('type', JOB_TYPES)}</Field>
            <Field label="Work mode" htmlFor="workMode">{select('workMode', WORK_MODES)}</Field>
            <Field label="Experience level" htmlFor="experienceLevel">{select('experienceLevel', LEVELS)}</Field>
            <Field label="Openings" htmlFor="openings"><input id="openings" type="number" min={1} className="input" value={f.openings} onChange={up('openings')} /></Field>
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">Pay and deadline</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Minimum (LPA)" htmlFor="minLpa" hint="Lakhs per year"><input id="minLpa" type="number" min={0} step="0.1" className="input" placeholder="5" value={f.minLpa} onChange={up('minLpa')} /></Field>
            <Field label="Maximum (LPA)" htmlFor="maxLpa"><input id="maxLpa" type="number" min={0} step="0.1" className="input" placeholder="9" value={f.maxLpa} onChange={up('maxLpa')} /></Field>
            <Field label="Apply by" htmlFor="deadline" hint="Optional"><input id="deadline" type="date" className="input" value={f.deadline} min={new Date().toISOString().slice(0, 10)} onChange={up('deadline')} /></Field>
          </div>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">Details</h2>
          <Field label="Description" htmlFor="description" hint="Describe the role, responsibilities and what you look for. Line breaks are kept.">
            <textarea id="description" required rows={10} className="input" value={f.description} onChange={up('description')} />
          </Field>
          <Field label="Required skills" hint="Candidates are ranked by how many of these they have.">
            <TagInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} suggestions={SKILL_IDEAS} />
          </Field>
          <Field label="Perks and benefits" hint="Optional">
            <TagInput value={f.perks} onChange={(perks) => setF({ ...f, perks })} placeholder="e.g. Health insurance" suggestions={PERK_IDEAS} />
          </Field>
        </section>

        <div className="flex justify-end gap-2">
          <Link to="/recruiter" className="btn btn-ghost">Cancel</Link>
          <button disabled={busy} className="btn btn-primary px-6">{busy && <Spinner />} {editing ? 'Save changes' : 'Publish job'}</button>
        </div>
      </form>
    </div>
  );
}
