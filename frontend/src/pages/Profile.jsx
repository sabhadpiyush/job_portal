import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, FileText, Trash2, Upload, ExternalLink } from 'lucide-react';
import api, { errMsg, fileUrl, profileScore, formatDate } from '../lib';
import { useAuth } from '../context/AuthContext';
import { Avatar, Field, Spinner, TagInput } from '../components/ui';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const SKILLS = ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python', 'SQL', 'HTML', 'CSS', 'Figma', 'Communication'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const isRec = user.role === 'recruiter';
  const [f, setF] = useState({
    name: user.name || '', phone: user.phone || '', location: user.location || '', headline: user.headline || '', bio: user.bio || '',
    skills: user.skills || [], experienceYears: user.experienceYears ?? 0, education: user.education || '',
    links: { linkedin: user.links?.linkedin || '', github: user.links?.github || '', portfolio: user.links?.portfolio || '' },
    company: { name: user.company?.name || '', website: user.company?.website || '', size: user.company?.size || '', industry: user.company?.industry || '', description: user.company?.description || '' },
  });
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const upNested = (g, k) => (e) => setF((s) => ({ ...s, [g]: { ...s[g], [k]: e.target.value } }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = isRec ? { name: f.name, phone: f.phone, location: f.location, company: f.company } : f;
      const { data } = await api.put('/auth/profile', body);
      setUser(data.user);
      toast.success('Profile saved');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const upload = async (path, field, file, ok) => {
    if (!file) return;
    const fd = new FormData();
    fd.append(field, file);
    try { const { data } = await api.post(path, fd); setUser(data.user); toast.success(ok); } catch (err) { toast.error(errMsg(err)); }
  };
  const removeResume = async () => {
    try { const { data } = await api.delete('/auth/resume'); setUser(data.user); toast.success('Resume removed'); } catch (err) { toast.error(errMsg(err)); }
  };

  const { pct, missing } = profileScore(user);
  const avatarInput = useRef(); const logoInput = useRef();

  return (
    <div className="page max-w-3xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{isRec ? 'Company profile' : 'My profile'}</h1>

      {!isRec && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between text-sm"><span className="font-semibold">Profile strength</span><span className="text-muted">{pct}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
          {missing.length > 0 && <p className="mt-2 text-sm text-muted">To do: {missing.join(', ')}.</p>}
        </div>
      )}

      <section className="card mt-6 flex flex-wrap items-center gap-5 p-6">
        <Avatar src={isRec ? user.company?.logo : user.avatar} name={isRec ? user.company?.name : user.name} size={72} round={!isRec} />
        <div>
          <h2 className="text-lg font-semibold">{isRec ? 'Company logo' : 'Profile photo'}</h2>
          <p className="text-sm text-muted">PNG, JPG or WebP, up to 2 MB.</p>
          <input ref={isRec ? logoInput : avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload image"
            onChange={(e) => upload(`/auth/image${isRec ? '?target=logo' : ''}`, 'image', e.target.files[0], 'Photo updated')} />
          <button type="button" onClick={() => (isRec ? logoInput : avatarInput).current.click()} className="btn btn-outline btn-sm mt-3"><Camera size={15} /> Change image</button>
        </div>
      </section>

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">{isRec ? 'Your details' : 'Basics'}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name"><input id="name" required className="input" value={f.name} onChange={up('name')} /></Field>
            <Field label="Phone" htmlFor="phone"><input id="phone" className="input" value={f.phone} onChange={up('phone')} /></Field>
            {!isRec && <Field label="Headline" htmlFor="headline" hint="For example: MERN stack developer"><input id="headline" maxLength={120} className="input" value={f.headline} onChange={up('headline')} /></Field>}
            <Field label="Location" htmlFor="location"><input id="location" className="input" placeholder="City, State" value={f.location} onChange={up('location')} /></Field>
          </div>
          {!isRec && <Field label="About you" htmlFor="bio"><textarea id="bio" rows={4} maxLength={1000} className="input" value={f.bio} onChange={up('bio')} /></Field>}
        </section>

        {isRec ? (
          <section className="card space-y-5 p-6">
            <h2 className="text-lg font-semibold">Company</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" htmlFor="cname"><input id="cname" required className="input" value={f.company.name} onChange={upNested('company', 'name')} /></Field>
              <Field label="Industry" htmlFor="ind"><input id="ind" className="input" placeholder="e.g. Fintech" value={f.company.industry} onChange={upNested('company', 'industry')} /></Field>
              <Field label="Company size" htmlFor="size">
                <select id="size" className="input" value={f.company.size} onChange={upNested('company', 'size')}><option value="">Select</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Website" htmlFor="web"><input id="web" type="url" className="input" placeholder="https://" value={f.company.website} onChange={upNested('company', 'website')} /></Field>
            </div>
            <Field label="About the company" htmlFor="cdesc" hint="Shown on every job you post."><textarea id="cdesc" rows={4} className="input" value={f.company.description} onChange={upNested('company', 'description')} /></Field>
            <p className="hint">Changes to name, logo and website update your jobs the next time you edit and save them.</p>
          </section>
        ) : (
          <>
            <section className="card space-y-5 p-6">
              <h2 className="text-lg font-semibold">Skills and experience</h2>
              <Field label="Skills" hint="These are matched against the skills each job requires."><TagInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} suggestions={SKILLS} /></Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Years of experience" htmlFor="exp"><input id="exp" type="number" min={0} step="0.5" className="input" value={f.experienceYears} onChange={up('experienceYears')} /></Field>
                <Field label="Education" htmlFor="edu"><input id="edu" className="input" placeholder="Degree, college" value={f.education} onChange={up('education')} /></Field>
              </div>
            </section>
            <section className="card space-y-5 p-6">
              <h2 className="text-lg font-semibold">Links</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="GitHub" htmlFor="gh"><input id="gh" type="url" className="input" placeholder="https://github.com/…" value={f.links.github} onChange={upNested('links', 'github')} /></Field>
                <Field label="LinkedIn" htmlFor="li"><input id="li" type="url" className="input" placeholder="https://linkedin.com/in/…" value={f.links.linkedin} onChange={upNested('links', 'linkedin')} /></Field>
                <Field label="Portfolio" htmlFor="pf"><input id="pf" type="url" className="input" placeholder="https://" value={f.links.portfolio} onChange={upNested('links', 'portfolio')} /></Field>
              </div>
            </section>
          </>
        )}

        <div className="flex justify-end"><button disabled={busy} className="btn btn-primary px-6">{busy && <Spinner />} Save changes</button></div>
      </form>

      {!isRec && (
        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold">Resume</h2>
          <p className="text-sm text-muted">PDF or Word, up to 5 MB. It is attached automatically when you apply.</p>
          {user.resume?.url ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
              <FileText size={20} className="text-brand" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{user.resume.originalName}</div><div className="text-xs text-muted">Uploaded {formatDate(user.resume.uploadedAt)}</div></div>
              <a href={fileUrl(user.resume.url)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><ExternalLink size={14} /> View</a>
              <button onClick={removeResume} className="btn btn-ghost btn-sm hover:!text-danger" aria-label="Remove resume"><Trash2 size={15} /></button>
            </div>
          ) : null}
          <label className="btn btn-outline mt-4 cursor-pointer"><Upload size={15} /> {user.resume?.url ? 'Replace resume' : 'Upload resume'}
            <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => upload('/auth/resume', 'resume', e.target.files[0], 'Resume uploaded')} />
          </label>
        </section>
      )}

      <PasswordCard />
    </div>
  );
}

function PasswordCard() {
  const [p, setP] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.put('/auth/password', p); toast.success('Password updated'); setP({ currentPassword: '', newPassword: '' }); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card mt-6 space-y-5 p-6">
      <h2 className="text-lg font-semibold">Change password</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Current password" htmlFor="cp"><input id="cp" type="password" required autoComplete="current-password" className="input" value={p.currentPassword} onChange={(e) => setP({ ...p, currentPassword: e.target.value })} /></Field>
        <Field label="New password" htmlFor="np"><input id="np" type="password" required minLength={6} autoComplete="new-password" className="input" value={p.newPassword} onChange={(e) => setP({ ...p, newPassword: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end"><button disabled={busy} className="btn btn-outline">{busy && <Spinner />} Update password</button></div>
    </form>
  );
}
