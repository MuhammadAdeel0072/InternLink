import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'connection-request',
        'connection-accept',
        'message',
        'job-application',
        'like',
        'comment',
        'interview-scheduled',
        'interview-confirmed',
        'interview-rescheduled',
        'interview-cancelled',
        'interview-completed',
        'interview-reschedule-requested',
        'interview-declined',
        'interview-no-show',
        'interview-reminder',
        'interview-feedback',
        'interview-reschedule-approved',
        'interview-reschedule-rejected',
        'offer-sent',
        'offer-viewed',
        'offer-accepted',
        'offer-rejected',
        'offer-negotiation',
        'offer-withdrawn',
        'offer-updated',
        'offer-reminder',
        'offer-expiring'
      ],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
export default Notification;
