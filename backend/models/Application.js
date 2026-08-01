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
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
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
      enum: ['applied', 'under-review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    rejectedAt: {
      type: Date
    },
    timeline: [
      {
        status: {
          type: String,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        reason: {
          type: String,
          default: ''
        }
      }
    ],
    notes: [
      {
        text: {
          type: String,
          required: true
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    interview: {
      type: {
        type: String,
        enum: ['online', 'on-site', 'phone'],
        default: 'online'
      },
      date: {
        type: Date
      },
      time: {
        type: String
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      interviewer: {
        type: String,
        default: ''
      },
      duration: {
        type: String,
        default: '30 minutes'
      },
      meetingLink: {
        type: String,
        default: ''
      },
      notes: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

// Ensure a student can only apply to a job once
applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ recruiter: 1, status: 1 });
applicationSchema.index({ 'student': 1 });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
