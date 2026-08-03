import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  technicalSkills: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  problemSolving: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  leadership: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  cultureFit: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  recommendation: {
    type: String,
    enum: ['hire', 'hold', 'reject'],
    required: true
  },
  comments: {
    type: String,
    default: ''
  }
});

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    interviewType: {
      type: String,
      enum: ['online', 'on-site', 'phone'],
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    meetingLink: {
      type: String,
      default: ''
    },
    meetingPlatform: {
      type: String,
      default: ''
    },
    meetingId: {
      type: String,
      default: ''
    },
    passcode: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    interviewer: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    feedback: {
      type: feedbackSchema,
      default: null
    },
    timeline: [
      {
        action: {
          type: String,
          required: true
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        note: {
          type: String,
          default: ''
        }
      }
    ],
    remindersSent: [
      {
        type: {
          type: String,
          enum: ['24h', '1h', '15m'],
          required: true
        },
        sentAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

interviewSchema.index({ candidateId: 1, date: 1 });
interviewSchema.index({ recruiterId: 1, date: 1 });
interviewSchema.index({ jobId: 1, status: 1 });
interviewSchema.index({ companyId: 1, status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
