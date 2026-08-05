import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: { type: String, required: true, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    benefits: [{ type: String }],
    skills: [{ type: String }],
    preferredSkills: [{ type: String }],
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    languages: [{ type: String }],
    certifications: [{ type: String }],
    screeningQuestions: [
      {
        question: { type: String, required: true },
        type: { type: String, enum: ['short-answer', 'paragraph', 'yes-no', 'multiple-choice'], default: 'short-answer' },
        options: [{ type: String }],
        order: { type: Number, default: 0 },
      }
    ],
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary'],
      default: 'Internship'
    },
    workplaceType: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      default: 'On-site'
    },
    department: { type: String, default: '' },
    salary: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    openings: { type: Number, default: 1, min: 1 },
    deadline: { type: Date },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'expired', 'archived'],
      default: 'draft'
    },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    daysActive: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    editHistory: [
      {
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
        changes: { type: String }
      }
    ]
  },
  { timestamps: true }
);

jobSchema.index({ recruiter: 1, status: 1, createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ location: 1, jobType: 1 });
jobSchema.index({ company: 1, isActive: 1 });

const Job = mongoose.model('Job', jobSchema);
export default Job;