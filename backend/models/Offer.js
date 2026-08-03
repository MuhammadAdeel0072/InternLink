import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
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
      default: null,
      index: true
    },
    offerNumber: {
      type: String,
      unique: true,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'negotiation', 'withdrawn', 'expired'],
      default: 'draft',
      index: true
    },
    salary: {
      baseSalary: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      },
      bonus: {
        type: Number,
        default: 0
      },
      signingBonus: {
        type: Number,
        default: 0
      },
      stockOptions: {
        type: String,
        default: ''
      }
    },
    compensation: {
      baseSalary: {
        type: Number,
        default: 0
      },
      performanceBonus: {
        type: Number,
        default: 0
      },
      annualBonus: {
        type: Number,
        default: 0
      },
      travelAllowance: {
        type: Number,
        default: 0
      },
      medicalAllowance: {
        type: Number,
        default: 0
      },
      housingAllowance: {
        type: Number,
        default: 0
      },
      internetAllowance: {
        type: Number,
        default: 0
      },
      other: {
        type: Number,
        default: 0
      },
      monthlyCompensation: {
        type: Number,
        default: 0
      },
      annualCompensation: {
        type: Number,
        default: 0
      },
      totalPackage: {
        type: Number,
        default: 0
      }
    },
    benefits: [
      {
        type: String,
        trim: true
      }
    ],
    customBenefits: [
      {
        type: String,
        trim: true
      }
    ],
    joiningDate: {
      type: Date,
      required: true
    },
    reportingTime: {
      type: String,
      default: '09:00 AM'
    },
    officeLocation: {
      type: String,
      default: ''
    },
    manager: {
      type: String,
      default: ''
    },
    team: {
      type: String,
      default: ''
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    offerLetter: {
      type: String,
      default: ''
    },
    template: {
      type: String,
      default: 'default'
    },
    negotiationHistory: [
      {
        expectedSalary: Number,
        preferredJoiningDate: Date,
        additionalComments: String,
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        requestedAt: {
          type: Date,
          default: Date.now
        },
        recruiterResponse: String,
        respondedAt: Date,
        newOfferSent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Offer'
        }
      }
    ],
    rejectionReason: {
      type: String,
      default: ''
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
    history: [
      {
        version: {
          type: Number,
          required: true
        },
        changes: {
          type: String,
          default: ''
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        updatedAt: {
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

offerSchema.index({ candidateId: 1, status: 1 });
offerSchema.index({ recruiterId: 1, status: 1 });
offerSchema.index({ companyId: 1, status: 1 });
offerSchema.index({ jobId: 1, status: 1 });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
