import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { escapeRegExp } from '../utils/regex.js';

// Helper to push timeline entry
const addTimelineEntry = async (applicationId, status, changedBy, reason = '') => {
  await Application.findByIdAndUpdate(applicationId, {
    $push: {
      timeline: {
        status,
        changedBy,
        reason,
        timestamp: new Date()
      }
    }
  });
};

// Helper to create notification
const createNotification = async (recipientId, senderId, type, content, link = '') => {
  try {
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      content,
      link
    });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// @desc    Get all applicants for recruiter's jobs with search, filters, sorting
// @route   GET /api/applicants
// @access  Private (Recruiter)
export const getApplicants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      jobId = 'all',
      location = '',
      education = '',
      experience = '',
      skills = '',
      appliedDate = '',
      graduationYear = '',
      availability = '',
      sort = 'newest'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recruiterId = req.user._id;

    // Get recruiter's job IDs
    const recruiterJobIds = await Job.find({ recruiter: recruiterId, isDeleted: false }).distinct('_id');

    let matchQuery = {
      job: { $in: recruiterJobIds }
    };

    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    if (jobId && jobId !== 'all') {
      matchQuery.job = jobId;
    }

    if (appliedDate) {
      const date = new Date(appliedDate);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      matchQuery.createdAt = { $gte: date, $lt: nextDate };
    }

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      { $unwind: '$studentData' },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobData'
        }
      },
      { $unwind: '$jobData' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'studentData._id',
          foreignField: 'user',
          as: 'profileData'
        }
      },
      { $unwind: { path: '$profileData', preserveNullAndEmptyArrays: true } }
    ];

    const sanitizedSearch = search ? escapeRegExp(search) : null;
    const sanitizedLocation = location ? escapeRegExp(location) : null;
    const sanitizedEducation = education ? escapeRegExp(education) : null;
    const sanitizedSkills = skills ? escapeRegExp(skills) : null;

    // Search filter
    if (sanitizedSearch) {
      pipeline.push({
        $match: {
          $or: [
            { 'studentData.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'studentData.email': { $regex: sanitizedSearch, $options: 'i' } },
            { 'jobData.title': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.university': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.skills.name': { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
      });
    }

    // Additional filters on profile
    if (sanitizedLocation) {
      pipeline.push({
        $match: {
          $or: [
            { 'profileData.locationString': { $regex: sanitizedLocation, $options: 'i' } },
            { 'profileData.location.country': { $regex: sanitizedLocation, $options: 'i' } },
            { 'profileData.location.city': { $regex: sanitizedLocation, $options: 'i' } }
          ]
        }
      });
    }

    if (sanitizedEducation) {
      pipeline.push({
        $match: {
          'profileData.education.degree': { $regex: sanitizedEducation, $options: 'i' }
        }
      });
    }

    if (sanitizedSkills) {
      pipeline.push({
        $match: {
          'profileData.skills.name': { $regex: sanitizedSkills, $options: 'i' }
        }
      });
    }

    if (graduationYear) {
      pipeline.push({
        $match: {
          'profileData.graduationYear': parseInt(graduationYear)
        }
      });
    }

    if (experience) {
      const minYears = parseInt(experience);
      if (!isNaN(minYears)) {
        pipeline.push({
          $match: {
            'profileData.yearsOfExperience': { $gte: minYears }
          }
        });
      }
    }

    if (availability) {
      pipeline.push({
        $match: {
          'profileData.currentStatus': availability
        }
      });
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest-experience':
        sortOption = { 'profileData.yearsOfExperience': -1 };
        break;
      case 'recently-updated':
        sortOption = { updatedAt: -1 };
        break;
      case 'profile-completion':
        sortOption = { 'profileData.completionPercentage': -1 };
        break;
      case 'alphabetical':
        sortOption = { 'studentData.name': 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortOption });

    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Application.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const applications = await Application.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single applicant details with full profile
// @route   GET /api/applicants/:id
// @access  Private (Recruiter)
export const getApplicantDetails = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email avatar role')
      .populate('job', 'title company location jobType employmentType workplaceType salary currency openings deadline status skills')
      .populate('recruiter', 'name email')
      .populate('companyId', 'companyName logo industry');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization: only the recruiter who owns the job can view
    if (application.recruiter._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    const profile = await Profile.findOne({ user: application.student._id });

    res.status(200).json({
      success: true,
      data: {
        ...application.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error('Get applicant details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status (shortlist, reject, etc.)
// @route   PUT /api/applicants/:id/status
// @access  Private (Recruiter)
export const updateApplicantStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('student')
      .populate('job', 'title recruiter');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    const previousStatus = application.status;
    application.status = status;

    if (status === 'rejected') {
      application.rejectedAt = new Date();
      if (reason) {
        application.rejectionReason = reason;
      }
    }

    // Add timeline entry
    application.timeline.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      reason: reason || ''
    });

    await application.save();

    // Notify student
    const statusMessages = {
      'under-review': 'Your application is now under review',
      'shortlisted': 'Congratulations! You have been shortlisted',
      'interview': 'An interview has been scheduled for your application',
      'offer': 'An offer has been sent for your application',
      'hired': 'Congratulations! You have been hired',
      'rejected': 'Your application has been reviewed'
    };

    if (statusMessages[status]) {
      await createNotification(
        application.student._id,
        req.user._id,
        status === 'rejected' ? 'job-application' : 'job-application',
        statusMessages[status],
        `/profile/${application.student._id}`
      );
    }

    res.status(200).json({
      success: true,
      data: application,
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    console.error('Update applicant status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add note to application
// @route   POST /api/applicants/:id/notes
// @access  Private (Recruiter)
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization via job recruiter
    const job = await Job.findById(application.job);
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add notes to this application' });
    }

    application.notes.push({
      text,
      addedBy: req.user._id,
      createdAt: new Date()
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: application.notes[application.notes.length - 1],
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Schedule interview for applicant
// @route   POST /api/applicants/:id/interview
// @access  Private (Recruiter)
export const scheduleInterview = async (req, res) => {
  try {
    const { type, date, time, timezone, interviewer, duration, meetingLink, notes } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('student')
      .populate('job', 'title recruiter');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to schedule interview for this application' });
    }

    application.interview = {
      type,
      date: new Date(date),
      time,
      timezone: timezone || 'UTC',
      interviewer,
      duration: duration || '30 minutes',
      meetingLink: meetingLink || '',
      notes: notes || ''
    };

    // Update status to interview
    const previousStatus = application.status;
    application.status = 'interview';

    application.timeline.push({
      status: 'interview',
      changedBy: req.user._id,
      timestamp: new Date(),
      reason: 'Interview scheduled'
    });

    await application.save();

    // Notify student
    await createNotification(
      application.student._id,
      req.user._id,
      'job-application',
      `An interview has been scheduled for your application to ${application.job.title}`,
      `/profile/${application.student._id}`
    );

    res.status(200).json({
      success: true,
      data: application,
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start conversation with applicant
// @route   POST /api/applicants/:id/message
// @access  Private (Recruiter)
export const messageApplicant = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student')
      .populate('job', 'title recruiter');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to message this applicant' });
    }

    // Create or get conversation
    const Conversation = (await import('../models/Conversation.js')).default;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, application.student._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, application.student._id],
        lastMessage: 'Conversation started'
      });
    }

    await createNotification(
      application.student._id,
      req.user._id,
      'message',
      `You have a new message from a recruiter regarding ${application.job.title}`,
      `/messages/${conversation._id}`
    );

    res.status(200).json({
      success: true,
      data: conversation,
      message: 'Conversation ready'
    });
  } catch (error) {
    console.error('Message applicant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applicant analytics for recruiter
// @route   GET /api/applicants/analytics
// @access  Private (Recruiter)
export const getApplicantAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const recruiterJobIds = await Job.find({ recruiter: recruiterId, isDeleted: false }).distinct('_id');

    if (recruiterJobIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          applied: 0,
          underReview: 0,
          shortlisted: 0,
          interview: 0,
          offer: 0,
          rejected: 0,
          hired: 0,
          avgReviewTime: 0,
          resumeDownloads: 0,
          messagesSent: 0
        }
      });
    }

    const [
      total,
      applied,
      underReview,
      shortlisted,
      interview,
      offer,
      rejected,
      hired,
      avgReviewTimeResult
    ] = await Promise.all([
      Application.countDocuments({ job: { $in: recruiterJobIds } }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'applied' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'under-review' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'shortlisted' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'interview' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'offer' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'rejected' }),
      Application.countDocuments({ job: { $in: recruiterJobIds }, status: 'hired' }),
      Application.aggregate([
        { $match: { job: { $in: recruiterJobIds } } },
        { $addFields: { lastTimelineEntry: { $arrayElemAt: ['$timeline', -1] } } },
        {
          $group: {
            _id: null,
            avgReviewTime: {
              $avg: {
                $cond: {
                  if: { $gt: ['$lastTimelineEntry', null] },
                  then: { $subtract: ['$lastTimelineEntry.timestamp', '$createdAt'] },
                  else: null
                }
              }
            }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        applied,
        underReview,
        shortlisted,
        interview,
        offer,
        rejected,
        hired,
        avgReviewTime: avgReviewTimeResult.length > 0 && avgReviewTimeResult[0].avgReviewTime
          ? Math.round(avgReviewTimeResult[0].avgReviewTime / (1000 * 60 * 60 * 24))
          : 0,
        resumeDownloads: 0,
        messagesSent: 0
      }
    });
  } catch (error) {
    console.error('Get applicant analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk actions on applicants
// @route   POST /api/applicants/bulk
// @access  Private (Recruiter)
export const bulkApplicantActions = async (req, res) => {
  try {
    const { applicantIds, action, reason } = req.body;

    if (!applicantIds || !applicantIds.length) {
      return res.status(400).json({ message: 'No applicants selected' });
    }

    const applications = await Application.find({ _id: { $in: applicantIds } })
      .populate('job', 'recruiter title')
      .populate('student');

    const unauthorized = applications.filter(app => app.job.recruiter.toString() !== req.user._id.toString());
    if (unauthorized.length > 0) {
      return res.status(403).json({ message: 'Not authorized for some applications' });
    }

    const results = [];

    for (const app of applications) {
      if (action === 'shortlist') {
        app.status = 'shortlisted';
        app.timeline.push({
          status: 'shortlisted',
          changedBy: req.user._id,
          timestamp: new Date(),
          reason: reason || ''
        });
        await createNotification(
          app.student._id,
          req.user._id,
          'job-application',
          'You have been shortlisted for a position',
          `/profile/${app.student._id}`
        );
      } else if (action === 'reject') {
        app.status = 'rejected';
        app.rejectedAt = new Date();
        if (reason) app.rejectionReason = reason;
        app.timeline.push({
          status: 'rejected',
          changedBy: req.user._id,
          timestamp: new Date(),
          reason: reason || ''
        });
        await createNotification(
          app.student._id,
          req.user._id,
          'job-application',
          'Your application has been reviewed',
          `/profile/${app.student._id}`
        );
      }

      await app.save();
      results.push({ _id: app._id, status: app.status });
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `${results.length} applications updated`
    });
  } catch (error) {
    console.error('Bulk actions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export applicants to CSV
// @route   GET /api/applicants/export
// @access  Private (Recruiter)
export const exportApplicants = async (req, res) => {
  try {
    const recruiterId = req.user._id;
    const recruiterJobIds = await Job.find({ recruiter: recruiterId, isDeleted: false }).distinct('_id');

    const applications = await Application.find({ job: { $in: recruiterJobIds } })
      .populate('student', 'name email')
      .populate('job', 'title company');

    const headers = ['Name', 'Email', 'Job Title', 'Company', 'Status', 'Applied Date', 'Updated At'];
    const rows = applications.map(app => [
      app.student?.name || '',
      app.student?.email || '',
      app.job?.title || '',
      app.job?.company || '',
      app.status,
      app.createdAt.toISOString().split('T')[0],
      app.updatedAt.toISOString().split('T')[0]
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export applicants error:', error);
    res.status(500).json({ message: error.message });
  }
};
