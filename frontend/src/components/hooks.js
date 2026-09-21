import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib';
import { useAuth } from '../context/AuthContext';

// Returns a handler that bookmarks/unbookmarks a job and updates local state through `update(jobId, saved)`
export function useSaveJob(update) {
  const { user } = useAuth();
  const nav = useNavigate();
  return async (job) => {
    if (!user) {
      toast('Log in to save jobs');
      return nav('/login');
    }
    if (user.role !== 'seeker') return;
    try {
      const { data } = await api.post(`/jobs/${job._id}/save`);
      update(job._id, data.saved);
      toast.success(data.saved ? 'Job saved' : 'Removed from saved jobs');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
}

export const useCanSave = () => {
  const { user } = useAuth();
  return !user || user.role === 'seeker';
};
