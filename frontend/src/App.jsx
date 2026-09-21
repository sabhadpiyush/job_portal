import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import { Login, Register } from './pages/Auth';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import SeekerDashboard from './pages/seeker/Dashboard';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import PostJob from './pages/recruiter/PostJob';
import Applicants from './pages/recruiter/Applicants';
import { useAuth } from './context/AuthContext';

// Logged-in users have no reason to see the login or sign-up screens
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/dashboard'} replace /> : children;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <Navbar />
      <ScrollTop />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/dashboard" element={<ProtectedRoute role="seeker"><SeekerDashboard /></ProtectedRoute>} />
          <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/new" element={<ProtectedRoute role="recruiter"><PostJob /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute role="recruiter"><PostJob /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/applicants" element={<ProtectedRoute role="recruiter"><Applicants /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
