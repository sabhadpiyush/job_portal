import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'], select: false },
    role: { type: String, enum: ['seeker', 'recruiter'], required: true },

    avatar: String,
    phone: String,
    location: String,
    headline: { type: String, maxlength: 120 },
    bio: { type: String, maxlength: 1000 },
    skills: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0, min: 0 },
    education: String,
    resume: { url: String, originalName: String, uploadedAt: Date },
    links: { linkedin: String, github: String, portfolio: String },

    // Recruiter only
    company: {
      name: String,
      website: String,
      logo: String,
      size: String,
      industry: String,
      description: String,
    },

    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
