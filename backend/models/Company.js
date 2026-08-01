import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    companySize: {
      type: String,
      required: [true, 'Company size is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    headquarters: {
      country: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      github: {
        type: String,
        trim: true,
      },
      youtube: {
        type: String,
        trim: true,
      },
    },
    contactInformation: {
      phone: {
        type: String,
        trim: true,
      },
      supportEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      hrEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiters: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

companySchema.index({ companyName: 1, industry: 1 });
companySchema.index({ slug: 1 });

companySchema.methods.isRecruiterAssociated = function (userId) {
  return this.recruiters.some(
    (r) => r.userId.toString() === userId.toString() && r.status === 'approved'
  );
};

companySchema.methods.getRecruiterStatus = function (userId) {
  const recruiter = this.recruiters.find(
    (r) => r.userId.toString() === userId.toString()
  );
  return recruiter ? recruiter.status : null;
};

const Company = mongoose.model('Company', companySchema);
export default Company;
