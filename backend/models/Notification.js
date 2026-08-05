import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      required: true,
      enum: [
        'connection-request',
        'connection-accept',
        'connection-reject',
        'message',
        'message-reaction',
        'mention',
        'like',
        'comment',
        'reply',
        'share',
        'post-mention',
        'job-match',
        'job-saved-update',
        'job-closed',
        'job-reopened',
        'job-expiring',
        'job-published',
        'application-deadline',
        'application-submitted',
        'application-viewed',
        'application-shortlisted',
        'application-rejected',
        'application-accepted',
        'application-withdrawn',
        'application-resume-updated',
        'interview-scheduled',
        'interview-rescheduled',
        'interview-cancelled',
        'interview-reminder',
        'interview-feedback',
        'interview-confirmed',
        'interview-completed',
        'interview-no-show',
        'offer-sent',
        'offer-viewed',
        'offer-accepted',
        'offer-rejected',
        'offer-negotiation',
        'offer-withdrawn',
        'offer-updated',
        'offer-expiring',
        'hiring-created',
        'hiring-onboarding-started',
        'document-uploaded',
        'document-requested',
        'document-verified',
        'document-rejected',
        'welcome-email-sent',
        'manager-assigned',
        'office-assigned',
        'equipment-assigned',
        'employee-joined',
        'onboarding-completed',
        'joining-reminder',
        'onboarding-status-update',
        'join-request-received',
        'recruiter-approved',
        'recruiter-removed',
        'login-new-device',
        'password-changed',
        'email-changed',
        'phone-changed',
        'failed-login',
        'maintenance',
        'feature-update',
        'platform-announcement'
      ]
    },
    category: {
      type: String,
      required: true,
      enum: [
        'system',
        'network',
        'message',
        'job',
        'application',
        'interview',
        'offer',
        'hiring',
        'company',
        'post',
        'security'
      ],
      index: true
    },
    priority: {
      type: String,
      required: true,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    entityType: {
      type: String,
      enum: [
        'job',
        'application',
        'interview',
        'offer',
        'post',
        'comment',
        'message',
        'company',
        'connection',
        'hiring',
        'user'
      ]
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
