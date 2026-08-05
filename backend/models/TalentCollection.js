import mongoose from 'mongoose';

const talentCollectionSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recruiter is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [100, 'Collection name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  candidateCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

talentCollectionSchema.index({ recruiter: 1, name: 1 }, { unique: true });
talentCollectionSchema.index({ recruiter: 1, createdAt: -1 });

export default mongoose.model('TalentCollection', talentCollectionSchema);
