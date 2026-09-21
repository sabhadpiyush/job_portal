import { Link } from 'react-router-dom';
import { Logo } from './ui';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="page flex flex-col justify-between gap-8 py-10 sm:flex-row">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5"><Logo size={26} /><span className="font-display text-lg font-bold">Shortlist</span></div>
          <p className="mt-3 text-sm text-muted">Find work that fits your skills, or hire people who are ready to start.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
          <Link className="text-muted hover:text-brand" to="/jobs">Browse jobs</Link>
          <Link className="text-muted hover:text-brand" to="/register">Create an account</Link>
          <Link className="text-muted hover:text-brand" to="/jobs?type=internship">Internships</Link>
          <Link className="text-muted hover:text-brand" to="/jobs?workMode=remote">Remote jobs</Link>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} Shortlist. Built with MongoDB, Express, React and Node.</div>
    </footer>
  );
}
