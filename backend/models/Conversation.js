import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    lastMessage: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);
conversationSchema.index({ participants: 1, createdAt: -1 });
export default Conversation;