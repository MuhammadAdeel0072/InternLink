import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Ensure there is only one connection request/record between any two users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;
