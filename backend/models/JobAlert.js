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

// Supports fetching job alerts for a user sorted by creation date
jobAlertSchema.index({ user: 1, createdAt: -1 });
// Supports filtering active alerts for a user
jobAlertSchema.index({ user: 1, isActive: 1 });

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);
export default JobAlert;
