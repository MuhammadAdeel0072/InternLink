import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    benefits: [{ type: String }],
    skills: [{ type: String }],
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      default: 'Internship'
    },
    workMode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite'
    },
    salaryRange: { type: String, default: '' },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'entry'
    },
    industry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    logo: { type: String, default: '' },
    deadline: { type: Date },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;