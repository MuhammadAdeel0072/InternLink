import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'verified', 'rejected', 'requested'],
      default: 'pending',
      index: true
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: true, timestamps: true }
);

const checklistSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { _id: true, timestamps: true }
);

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true
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
  },
  { _id: true }
);

const hiringSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
      index: true
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      index: true
    },
    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      index: true
    },
    employeeStatus: {
      type: String,
      enum: ['pending', 'joined', 'probation', 'confirmed'],
      default: 'pending',
      index: true
    },
    department: {
      type: String,
      default: ''
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    managerName: {
      type: String,
      default: ''
    },
    team: {
      type: String,
      default: ''
    },
    workType: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'On-site'
    },
    joiningDate: {
      type: Date,
      default: null
    },
    reportingTime: {
      type: String,
      default: '09:00 AM'
    },
    officeLocation: {
      type: String,
      default: ''
    },
    officeAssignment: {
      branch: { type: String, default: '' },
      floor: { type: String, default: '' },
      office: { type: String, default: '' },
      workstation: { type: String, default: '' }
    },
    equipmentAssignment: {
      laptop: { type: Boolean, default: false },
      companyEmail: { type: String, default: '' },
      employeeBadge: { type: Boolean, default: false }
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false
    },
    welcomeEmailSentAt: {
      type: Date,
      default: null
    },
    documents: [documentSchema],
    checklist: [checklistSchema],
    timeline: [timelineSchema],
    status: {
      type: String,
      enum: [
        'offer-accepted',
        'pending-documents',
        'documents-verified',
        'joining-scheduled',
        'joined',
        'onboarding',
        'completed'
      ],
      default: 'offer-accepted',
      index: true
    },
    joiningRemindersSent: [
      {
        type: {
          type: String,
          enum: ['7d', '3d', '1d'],
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

hiringSchema.index({ candidateId: 1, status: 1 });
hiringSchema.index({ recruiterId: 1, status: 1 });
hiringSchema.index({ companyId: 1, status: 1 });
hiringSchema.index({ joiningDate: 1 });
hiringSchema.index({ status: 1, createdAt: -1 });

const REQUIRED_DOCUMENTS = [
  'CNIC / Passport',
  'Educational Certificates',
  'Experience Certificates',
  'Signed Offer Letter',
  'Signed Employment Contract',
  'Tax Documents',
  'Bank Account Details',
  'Profile Photo'
];

hiringSchema.statics.getRequiredDocuments = function () {
  return REQUIRED_DOCUMENTS;
};

const CHECKLIST_TASKS = [
  { key: 'offer_accepted', label: 'Offer Accepted' },
  { key: 'employee_id_generated', label: 'Employee ID Generated' },
  { key: 'documents_uploaded', label: 'Documents Uploaded' },
  { key: 'documents_verified', label: 'Documents Verified' },
  { key: 'welcome_email_sent', label: 'Welcome Email Sent' },
  { key: 'manager_assigned', label: 'Manager Assigned' },
  { key: 'laptop_assigned', label: 'Laptop Assigned' },
  { key: 'first_day_scheduled', label: 'First Day Scheduled' },
  { key: 'employee_joined', label: 'Employee Joined' },
  { key: 'onboarding_completed', label: 'Onboarding Completed' }
];

hiringSchema.statics.getChecklistTasks = function () {
  return CHECKLIST_TASKS;
};

const Hiring = mongoose.model('Hiring', hiringSchema);
export default Hiring;
