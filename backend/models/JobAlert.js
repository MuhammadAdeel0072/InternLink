import mongoose from 'mongoose';

const jobAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    keywords: [{ type: String }],
    jobType: { type: String },
    location: { type: String },
    workMode: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);
export default JobAlert;