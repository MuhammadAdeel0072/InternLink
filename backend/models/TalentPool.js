import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Note text is required'],
    maxlength: [2000, 'Note cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    default: Date.now
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const talentPoolSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recruiter is required'],
    index: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Candidate is required'],
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  notes: [noteSchema],
  tags: [{
    type: String,
    trim: true
  }],
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TalentCollection'
  }],
  status: {
    type: String,
    enum: ['open-to-work', 'actively-looking', 'not-looking', 'available-later'],
    default: 'open-to-work'
  },
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  activityTimeline: [{
    action: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

talentPoolSchema.index({ recruiter: 1, candidate: 1 }, { unique: true });
talentPoolSchema.index({ recruiter: 1, archived: 1 });
talentPoolSchema.index({ recruiter: 1, isFavorite: 1 });
talentPoolSchema.index({ recruiter: 1, rating: 1 });
talentPoolSchema.index({ recruiter: 1, tags: 1 });
talentPoolSchema.index({ recruiter: 1, collections: 1 });
talentPoolSchema.index({ recruiter: 1, createdAt: -1 });
talentPoolSchema.index({ recruiter: 1, lastContactedAt: -1 });

export default mongoose.model('TalentPool', talentPoolSchema);
