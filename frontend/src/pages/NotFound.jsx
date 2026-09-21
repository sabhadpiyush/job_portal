import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-2 text-muted">The link may be broken, or the page may have moved.</p>
      <Link to="/" className="btn btn-primary mt-8">Back to home</Link>
    </div>
  );
}
