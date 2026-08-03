import Interview from '../models/Interview.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import { sendInterviewScheduledEmail } from './sendEmail.js';

const REMINDER_SCHEDULE = [
  { type: '24h', hours: 24 },
  { type: '1h', hours: 1 },
  { type: '15m', hours: 0.25 }
];

let schedulerInterval = null;

const getInterviewDateTime = (interview) => {
  const [hours, minutes] = interview.time.split(':').map(Number);
  const date = new Date(interview.date);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const startReminderScheduler = (io, userSocketMap) => {
  if (schedulerInterval) return;

  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();

      for (const reminder of REMINDER_SCHEDULE) {
        const targetTime = new Date(now.getTime() + reminder.hours * 60 * 60 * 1000);
        const startOfDay = new Date(targetTime);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetTime);
        endOfDay.setHours(23, 59, 59, 999);

        const interviews = await Interview.find({
          status: { $in: ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'] },
          date: { $gte: startOfDay, $lte: endOfDay },
          'remindersSent.type': { $ne: reminder.type }
        }).populate('candidateId', 'name email')
          .populate('jobId', 'title');

        for (const interview of interviews) {
          const interviewDateTime = getInterviewDateTime(interview);
          const timeDiffMs = interviewDateTime.getTime() - now.getTime();
          const timeDiffMinutes = timeDiffMs / (1000 * 60);

          let shouldSend = false;

          if (reminder.type === '24h') {
            shouldSend = timeDiffMinutes > 23 * 60 && timeDiffMinutes <= 24 * 60;
          } else if (reminder.type === '1h') {
            shouldSend = timeDiffMinutes > 50 && timeDiffMinutes <= 60;
          } else if (reminder.type === '15m') {
            shouldSend = timeDiffMinutes > 5 && timeDiffMinutes <= 15;
          }

          if (shouldSend) {
            interview.remindersSent.push({
              type: reminder.type,
              sentAt: new Date()
            });
            await interview.save();

            const candidate = interview.candidateId;
            const jobTitle = interview.jobId?.title || 'an interview';

            await Notification.create({
              recipient: candidate._id,
              sender: interview.recruiterId,
              type: 'interview-reminder',
              content: `Reminder: Your interview for ${jobTitle} is scheduled for ${interview.date.toLocaleDateString()} at ${interview.time}`,
              link: `/interviews/${interview._id}`
            });

            const recipientSocketId = userSocketMap.get(candidate._id.toString());
            if (recipientSocketId && io) {
              io.to(recipientSocketId).emit('receive_notification', {
                type: 'interview-reminder',
                content: `Reminder: Your interview for ${jobTitle} is coming up`,
                link: `/interviews/${interview._id}`,
                isRead: false,
                createdAt: new Date()
              });
            }

            try {
              await sendInterviewScheduledEmail(
                candidate.email,
                candidate.name,
                jobTitle,
                interview
              );
            } catch (emailErr) {
              console.error('Reminder email error:', emailErr);
            }
          }
        }
      }
    } catch (error) {
      console.error('Reminder scheduler error:', error);
    }
  }, 60000);

  console.log('Interview reminder scheduler started');
};

export const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Interview reminder scheduler stopped');
  }
};
