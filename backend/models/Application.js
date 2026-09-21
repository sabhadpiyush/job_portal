import mongoose from 'mongoose';

export const STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview', 'hired', 'rejected'];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverLetter: { type: String, maxlength: 3000 },
    resume: { url: String, originalName: String },
    status: { type: String, enum: STATUSES, default: 'applied' },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
    recruiterNotes: String,
  },
  { timestamps: true }
);

// A candidate can apply to a job only once
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
