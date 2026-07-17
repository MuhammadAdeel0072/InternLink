import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    requirements: [{ type: String }],
    location: {
      type: String,
      required: true
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      default: 'Internship'
    },
    salaryRange: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    },
    remote: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
