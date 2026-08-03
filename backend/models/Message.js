import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    attachment: { type: String, default: '' },
    attachmentType: { type: String, enum: ['image', 'document', 'none'], default: 'none' },
    replyTo: {
      messageId: String,
      text: String,
      senderName: String
    },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    deliveredAt: Date,
    readAt: Date
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
messageSchema.index({ conversation: 1, createdAt: -1 });
export default Message;