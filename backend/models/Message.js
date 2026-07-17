import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      default: ''
    },
    attachment: {
      type: String,
      default: ''
    },
    attachmentType: {
      type: String,
      enum: ['image', 'document', 'none'],
      default: 'none'
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
