import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import Company from '../models/Company.js';

export const getRecruiterDashboardStats = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const [
      activeJobsCount,
      draftJobsCount,
      totalApplicantsCount,
      interviewsCount,
      conversationsCount,
      unreadNotificationsCount,
    ] = await Promise.all([
      Job.countDocuments({ recruiter: recruiterId, isActive: true }),
      Job.countDocuments({ recruiter: recruiterId, isActive: false }),
      Application.countDocuments({}),
      Application.countDocuments({ status: 'interview' }),
      Conversation.countDocuments({ participants: recruiterId }),
      Notification.countDocuments({ recipient: recruiterId, isRead: false }),
    ]);

    const recruiterJobIds = await Job.find({ recruiter: recruiterId }).distinct('_id');
    const applicantsForRecruiter = recruiterJobIds.length > 0
      ? await Application.countDocuments({ job: { $in: recruiterJobIds } })
      : 0;

    const interviewsForRecruiter = recruiterJobIds.length > 0
      ? await Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'interview' })
      : 0;

    const company = await Company.findOne({ 'recruiters.userId': recruiterId, 'recruiters.status': 'approved' });

    res.status(200).json({
      success: true,
      data: {
        activeJobs: activeJobsCount,
        draftJobs: draftJobsCount,
        applicants: applicantsForRecruiter,
        interviews: interviewsForRecruiter,
        messages: conversationsCount,
        notifications: unreadNotificationsCount,
        hasCompany: !!company,
        companyName: company?.companyName || '',
      },
    });
  } catch (error) {
    console.error('Get recruiter dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
};
