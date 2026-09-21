import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Job title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'] },
    company: { name: String, logo: String, website: String },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    workMode: { type: String, enum: ['onsite', 'hybrid', 'remote'], default: 'onsite' },
    type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'], default: 'full-time' },
    category: { type: String, required: [true, 'Category is required'] },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'fresher' },
    // Annual salary in INR
    salary: { min: Number, max: Number },
    skills: [{ type: String, trim: true }],
    perks: [{ type: String, trim: true }],
    openings: { type: Number, default: 1, min: 1 },
    deadline: Date,
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobSchema.index({ createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });

export default mongoose.model('Job', jobSchema);
