import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resume: {
      type: String,
      required: true
    },
    coverLetter: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['applied', 'under-review', 'interview', 'accepted', 'rejected'],
      default: 'applied'
    }
  },
  {
    timestamps: true
  }
);

// Ensure a student can only apply to a job once
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
