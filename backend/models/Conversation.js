import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    // A canonical pair key makes a direct conversation unique even when both
    // participants start it at the same time.
    participantKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      type: String,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: {
      type: Date,
      default: null
    },
    pinnedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    archivedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    mutedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

conversationSchema.pre('validate', function setParticipantKey(next) {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    this.participantKey = this.participants
      .map((participant) => participant.toString())
      .sort()
      .join(':');
  }
  next();
});

conversationSchema.index({ participants: 1, createdAt: -1 });
conversationSchema.index({ participants: 1, isArchived: 1, updatedAt: -1 });
conversationSchema.index({ participants: 1, isPinned: -1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
