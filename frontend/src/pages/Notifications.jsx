import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api, { timeAgo } from '../lib';
import { Empty, PageLoader } from '../components/ui';

export default function Notifications() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => { api.get('/notifications').then((r) => setItems(r.data.notifications)).catch(() => setItems([])); }, []);

  const open = async (n) => {
    if (!n.read) { api.patch(`/notifications/${n._id}/read`).catch(() => {}); setItems((l) => l.map((x) => (x._id === n._id ? { ...x, read: true } : x))); }
    if (n.link) nav(n.link);
  };
  const readAll = async () => { await api.patch('/notifications/read-all').catch(() => {}); setItems((l) => l.map((x) => ({ ...x, read: true }))); };

  if (!items) return <PageLoader />;
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="page max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Notifications</h1>
        {unread > 0 && <button onClick={readAll} className="btn btn-outline btn-sm"><CheckCheck size={15} /> Mark all read</button>}
      </div>
      {items.length === 0 ? (
        <Empty title="You are all caught up">Updates on your applications and new applicants will appear here.</Empty>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {items.map((n) => (
            <li key={n._id}>
              <button onClick={() => open(n)} className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-sunken ${n.read ? '' : 'bg-brand-soft/40'}`}>
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-sunken text-muted' : 'bg-brand text-white dark:text-bg'}`}><Bell size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{n.title}</span>
                  <span className="block text-sm text-muted">{n.message}</span>
                  <span className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
