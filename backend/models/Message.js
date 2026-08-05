import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, default: '' },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'resume'],
      default: 'text'
    },
    attachments: [{
      url: { type: String, required: true },
      type: { type: String, required: true },
      name: { type: String, required: true },
      size: { type: Number }
    }],
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId },
      text: { type: String },
      senderName: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId }
    },
    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String, required: true }
    }],
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sent'
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    deliveredAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
