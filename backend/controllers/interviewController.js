import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { createNotification } from '../services/notificationService.js';
import { sendInterviewScheduledEmail, sendInterviewCancelledEmail, sendInterviewRescheduledEmail } from '../utils/sendEmail.js';
import { escapeRegExp } from '../utils/regex.js';

const addTimelineEntry = async (interviewId, action, performedBy, note = '') => {
  await Interview.findByIdAndUpdate(interviewId, {
    $push: {
      timeline: {
        action,
        performedBy,
        note,
        timestamp: new Date()
      }
    }
  });
};

// @desc    Get all interviews for recruiter/student with search, filters, sorting
// @route   GET /api/interviews
// @access  Private (Recruiter or Student)
export const getInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      interviewType = 'all',
      date = '',
      jobId = 'all',
      recruiterId = 'all',
      companyId = 'all',
      sort = 'newest',
      view = 'list'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};

    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    } else {
      matchQuery.candidateId = userId;
    }

    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    if (interviewType && interviewType !== 'all') {
      matchQuery.interviewType = interviewType;
    }

    if (date) {
      const selectedDate = new Date(date);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      matchQuery.date = { $gte: selectedDate, $lt: nextDate };
    }

    if (jobId && jobId !== 'all') {
      matchQuery.jobId = jobId;
    }

    if (recruiterId && recruiterId !== 'all' && userRole === 'student') {
      matchQuery.recruiterId = recruiterId;
    }

    if (companyId && companyId !== 'all') {
      matchQuery.companyId = companyId;
    }

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'candidateId',
          foreignField: '_id',
          as: 'candidateData'
        }
      },
      { $unwind: '$candidateData' },
      {
        $lookup: {
          from: 'users',
          localField: 'recruiterId',
          foreignField: '_id',
          as: 'recruiterData'
        }
      },
      { $unwind: '$recruiterData' },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'jobData'
        }
      },
      { $unwind: '$jobData' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'candidateData._id',
          foreignField: 'user',
          as: 'candidateProfile'
        }
      },
      { $unwind: { path: '$candidateProfile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'companyData'
        }
      },
      { $unwind: { path: '$companyData', preserveNullAndEmptyArrays: true } }
    ];

    const sanitizedSearch = search ? escapeRegExp(search) : null;

    if (sanitizedSearch) {
      pipeline.push({
        $match: {
          $or: [
            { 'candidateData.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'candidateData.email': { $regex: sanitizedSearch, $options: 'i' } },
            { 'jobData.title': { $regex: sanitizedSearch, $options: 'i' } },
            { 'recruiterData.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'companyData.companyName': { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
      });
    }

    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'date-asc':
        sortOption = { date: 1, time: 1 };
        break;
      case 'date-desc':
        sortOption = { date: -1, time: -1 };
        break;
      case 'recently-updated':
        sortOption = { updatedAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortOption });

    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Interview.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const interviews = await Interview.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single interview details
// @route   GET /api/interviews/:id
// @access  Private (Recruiter or Candidate)
export const getInterviewDetails = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email avatar role')
      .populate('recruiterId', 'name email')
      .populate('jobId', 'title company location jobType employmentType workplaceType salary')
      .populate('companyId', 'companyName logo industry')
      .populate('applicationId', 'status appliedAt');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const isRecruiter = req.user.role === 'recruiter';
    const isCandidate = req.user.role === 'student';

    if (isRecruiter && interview.recruiterId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this interview' });
    }

    if (isCandidate && interview.candidateId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this interview' });
    }

    const candidateProfile = await Profile.findOne({ user: interview.candidateId._id });

    res.status(200).json({
      success: true,
      data: {
        ...interview.toObject(),
        candidateProfile
      }
    });
  } catch (error) {
    console.error('Get interview details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private (Recruiter)
export const createInterview = async (req, res) => {
  try {
    const {
      applicationId,
      interviewType,
      date,
      time,
      duration,
      timezone,
      interviewer,
      department,
      meetingLink,
      meetingPlatform,
      meetingId,
      passcode,
      location,
      notes
    } = req.body;

    const application = await Application.findById(applicationId)
      .populate('job', 'title recruiter')
      .populate('student');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to schedule interview for this application' });
    }

    const interviewDate = new Date(date);
    const now = new Date();
    if (interviewDate < now && interviewDate.toDateString() !== now.toDateString()) {
      return res.status(400).json({ message: 'Interview date cannot be in the past' });
    }

    if (interviewType === 'online' && !meetingLink) {
      return res.status(400).json({ message: 'Meeting link is required for online interviews' });
    }

    if (interviewType === 'on-site' && !location) {
      return res.status(400).json({ message: 'Location is required for on-site interviews' });
    }

    const existingInterview = await Interview.findOne({
      applicationId,
      status: { $in: ['scheduled', 'pending-confirmation', 'confirmed'] }
    });

    if (existingInterview) {
      return res.status(400).json({ message: 'An active interview already exists for this application' });
    }

    const company = await Company.findOne({ 'recruiters.userId': req.user._id, 'recruiters.status': 'approved' });

    const interview = await Interview.create({
      applicationId,
      jobId: application.job._id,
      candidateId: application.student._id,
      recruiterId: req.user._id,
      companyId: company?._id || null,
      interviewType,
      status: 'pending-confirmation',
      date: interviewDate,
      time,
      duration: duration || '30 minutes',
      timezone: timezone || 'UTC',
      meetingLink: meetingLink || '',
      meetingPlatform: meetingPlatform || '',
      meetingId: meetingId || '',
      passcode: passcode || '',
      location: location || '',
      interviewer: interviewer || '',
      department: department || '',
      notes: notes || ''
    });

    interview.timeline.push({
      action: 'scheduled',
      performedBy: req.user._id,
      note: 'Interview scheduled'
    });

    await interview.save();

    await application.save();

    await createNotification({
      recipientId: application.student._id,
      senderId: req.user._id,
      title: 'Interview Scheduled',
      message: `An interview has been scheduled for your application to ${application.job.title}`,
      type: 'interview-scheduled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    await sendInterviewScheduledEmail(
      application.student.email,
      application.student.name,
      application.job.title,
      interview
    ).catch(err => console.error('Email send error:', err));

    res.status(201).json({
      success: true,
      data: interview,
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private (Recruiter)
export const updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }

    const allowedFields = ['interviewType', 'time', 'duration', 'timezone', 'meetingLink', 'meetingPlatform', 'meetingId', 'passcode', 'location', 'interviewer', 'department', 'notes'];
    let hasChanges = false;

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== interview[field]) {
        interview[field] = req.body[field];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      interview.timeline.push({
        action: 'updated',
        performedBy: req.user._id,
        note: 'Interview details updated'
      });
    }

    await interview.save();

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview updated successfully'
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule interview
// @route   POST /api/interviews/:id/reschedule
// @access  Private (Recruiter or Candidate)
export const rescheduleInterview = async (req, res) => {
  try {
    const { date, time, reason } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const isRecruiter = req.user.role === 'recruiter';
    const isCandidate = req.user.role === 'student';

    if (isRecruiter && interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reschedule this interview' });
    }

    if (isCandidate && interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reschedule this interview' });
    }

    const newDate = new Date(date);
    if (newDate < new Date()) {
      return res.status(400).json({ message: 'New interview date cannot be in the past' });
    }

    interview.date = newDate;
    interview.time = time;
    interview.status = 'rescheduled';
    interview.timeline.push({
      action: 'rescheduled',
      performedBy: req.user._id,
      note: reason || 'Interview rescheduled'
    });

    await interview.save();

    const recipientId = isRecruiter ? interview.candidateId : interview.recruiterId;
    const senderName = isRecruiter ? (await User.findById(req.user._id))?.name : 'Candidate';

    await createNotification({
      recipientId: recipientId,
      senderId: req.user._id,
      title: 'Interview Rescheduled',
      message: `Interview has been rescheduled by ${senderName}`,
      type: 'interview-rescheduled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    if (isRecruiter) {
      const job = await Job.findById(interview.jobId).select('title');
      await sendInterviewRescheduledEmail(
        (await User.findById(recipientId))?.email || '',
        (await User.findById(recipientId))?.name || '',
        job?.title || '',
        interview
      ).catch(err => console.error('Email send error:', err));
    }

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview rescheduled successfully'
    });
  } catch (error) {
    console.error('Reschedule interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel interview
// @route   POST /api/interviews/:id/cancel
// @access  Private (Recruiter or Candidate)
export const cancelInterview = async (req, res) => {
  try {
    const { reason } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const isRecruiter = req.user.role === 'recruiter';
    const isCandidate = req.user.role === 'student';

    if (isRecruiter && interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this interview' });
    }

    if (isCandidate && interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this interview' });
    }

    interview.status = 'cancelled';
    interview.timeline.push({
      action: 'cancelled',
      performedBy: req.user._id,
      note: reason || 'Interview cancelled'
    });

    await interview.save();

    const application = await Application.findById(interview.applicationId);
    if (application) {
      application.status = 'applied';
      application.timeline.push({
        status: 'applied',
        changedBy: req.user._id,
        timestamp: new Date(),
        reason: 'Interview cancelled'
      });
      await application.save();
    }

    const recipientId = isRecruiter ? interview.candidateId : interview.recruiterId;
    const senderName = isRecruiter ? (await User.findById(req.user._id))?.name : 'Candidate';

    await createNotification({
      recipientId: recipientId,
      senderId: req.user._id,
      title: 'Interview Cancelled',
      message: `Interview has been cancelled by ${senderName}`,
      type: 'interview-cancelled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    if (isRecruiter) {
      const recipientUser = await User.findById(recipientId);
      if (recipientUser) {
        await sendInterviewCancelledEmail(
          recipientUser.email,
          recipientUser.name,
          interview.jobId?.title || '',
          interview
        ).catch(err => console.error('Email send error:', err));
      }
    }

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm interview (candidate)
// @route   POST /api/interviews/:id/confirm
// @access  Private (Student)
export const confirmInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm this interview' });
    }

    if (!['scheduled', 'pending-confirmation'].includes(interview.status)) {
      return res.status(400).json({ message: 'This interview cannot be confirmed' });
    }

    interview.status = 'confirmed';
    interview.timeline.push({
      action: 'confirmed',
      performedBy: req.user._id,
      note: 'Candidate confirmed attendance'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.recruiterId,
      senderId: req.user._id,
      title: 'Interview Confirmed',
      message: 'Candidate has confirmed the interview',
      type: 'interview-confirmed',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request reschedule (candidate)
// @route   POST /api/interviews/:id/request-reschedule
// @access  Private (Student)
export const requestReschedule = async (req, res) => {
  try {
    const { date, time, reason } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to request reschedule for this interview' });
    }

    if (!['scheduled', 'pending-confirmation', 'confirmed'].includes(interview.status)) {
      return res.status(400).json({ message: 'This interview cannot be rescheduled' });
    }

    interview.status = 'rescheduled';
    interview.date = new Date(date);
    interview.time = time;
    interview.timeline.push({
      action: 'reschedule-requested',
      performedBy: req.user._id,
      note: reason || 'Candidate requested reschedule'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.recruiterId,
      senderId: req.user._id,
      title: 'Interview Reschedule Requested',
      message: 'Candidate has requested to reschedule the interview',
      type: 'interview-rescheduled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Reschedule request sent successfully'
    });
  } catch (error) {
    console.error('Request reschedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark interview as completed
// @route   POST /api/interviews/:id/complete
// @access  Private (Recruiter)
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this interview' });
    }

    interview.status = 'completed';
    interview.timeline.push({
      action: 'completed',
      performedBy: req.user._id,
      note: 'Interview marked as completed'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.candidateId,
      senderId: req.user._id,
      title: 'Interview Completed',
      message: 'Your interview has been marked as completed',
      type: 'interview-completed',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview marked as completed'
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add feedback to interview
// @route   POST /api/interviews/:id/feedback
// @access  Private (Recruiter)
export const addFeedback = async (req, res) => {
  try {
    const { communication, technicalSkills, problemSolving, leadership, cultureFit, overallRating, recommendation, comments } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add feedback to this interview' });
    }

    interview.feedback = {
      communication,
      technicalSkills,
      problemSolving,
      leadership,
      cultureFit,
      overallRating,
      recommendation,
      comments: comments || ''
    };

    interview.timeline.push({
      action: 'feedback-added',
      performedBy: req.user._id,
      note: 'Feedback submitted'
    });

    await interview.save();

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add private note to interview
// @route   POST /api/interviews/:id/notes
// @access  Private (Recruiter)
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add notes to this interview' });
    }

    interview.notes = text;
    interview.timeline.push({
      action: 'note-added',
      performedBy: req.user._id,
      note: 'Note added'
    });

    await interview.save();

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get interview analytics
// @route   GET /api/interviews/analytics
// @access  Private (Recruiter or Student)
export const getInterviewAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};
    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    } else {
      matchQuery.candidateId = userId;
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfNextDay = new Date(now);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    startOfNextDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      scheduled,
      pendingConfirmation,
      confirmed,
      completed,
      cancelled,
      noShow,
      rescheduled,
      todayCount,
      upcomingCount,
      weeklyData,
      monthlyData,
      outcomes
    ] = await Promise.all([
      Interview.countDocuments(matchQuery),
      Interview.countDocuments({ ...matchQuery, status: 'scheduled' }),
      Interview.countDocuments({ ...matchQuery, status: 'pending-confirmation' }),
      Interview.countDocuments({ ...matchQuery, status: 'confirmed' }),
      Interview.countDocuments({ ...matchQuery, status: 'completed' }),
      Interview.countDocuments({ ...matchQuery, status: 'cancelled' }),
      Interview.countDocuments({ ...matchQuery, status: 'no-show' }),
      Interview.countDocuments({ ...matchQuery, status: 'rescheduled' }),
      Interview.countDocuments({ ...matchQuery, date: { $gte: startOfDay, $lt: startOfNextDay } }),
      Interview.countDocuments({ ...matchQuery, date: { $gte: startOfNextDay } }),
      Interview.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startOfWeek } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            scheduled: { $sum: { $cond: [{ $in: ['$status', ['scheduled', 'pending-confirmation', 'confirmed']] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'no-show']] }, 1, 0] } },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Interview.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Interview.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const outcomeMap = {};
    outcomes.forEach(o => { outcomeMap[o._id] = o.count; });

    const totalWithOutcome = outcomeMap.completed + (outcomeMap.cancelled || 0) + (outcomeMap['no-show'] || 0) + (outcomeMap.rescheduled || 0);
    const attended = (outcomeMap.completed || 0) + (outcomeMap.rescheduled || 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        scheduled,
        pendingConfirmation,
        confirmed,
        completed,
        cancelled,
        noShow,
        rescheduled,
        today: todayCount,
        upcoming: upcomingCount,
        weeklyData: weeklyData.map(d => ({
          date: d._id,
          scheduled: d.scheduled,
          completed: d.completed,
          cancelled: d.cancelled,
          total: d.total
        })),
        monthlyData: monthlyData.map(d => ({
          month: d._id,
          count: d.count
        })),
        outcomes: {
          completed: outcomeMap.completed || 0,
          cancelled: outcomeMap.cancelled || 0,
          noShow: outcomeMap['no-show'] || 0,
          rescheduled: outcomeMap.rescheduled || 0
        },
        attendanceRate: totalWithOutcome > 0 ? Math.round((attended / totalWithOutcome) * 100) : 0,
        noShowRate: totalWithOutcome > 0 ? Math.round(((outcomeMap['no-show'] || 0) / totalWithOutcome) * 100) : 0,
        cancelRate: total > 0 ? Math.round(((outcomeMap.cancelled || 0) / total) * 100) : 0,
        rescheduleRate: total > 0 ? Math.round(((outcomeMap.rescheduled || 0) / total) * 100) : 0,
        hireRate: completed > 0 ? Math.round((outcomeMap.completed / completed) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get interview analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export interviews to CSV
// @route   GET /api/interviews/export
// @access  Private (Recruiter)
export const exportInterviews = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const interviews = await Interview.find({ recruiterId })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .populate('companyId', 'companyName');

    const headers = ['Candidate Name', 'Email', 'Job Title', 'Company', 'Interview Type', 'Date', 'Time', 'Duration', 'Status', 'Location'];
    const rows = interviews.map(interview => [
      interview.candidateId?.name || '',
      interview.candidateId?.email || '',
      interview.jobId?.title || '',
      interview.companyId?.companyName || interview.jobId?.company || '',
      interview.interviewType,
      interview.date ? new Date(interview.date).toISOString().split('T')[0] : '',
      interview.time || '',
      interview.duration || '',
      interview.status,
      interview.location || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=interviews.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export interviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming interviews for reminders
// @route   GET /api/interviews/upcoming
// @access  Private (Recruiter or Student)
export const getUpcomingInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};
    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    } else {
      matchQuery.candidateId = userId;
    }

    const now = new Date();
    matchQuery.date = { $gte: now };
    matchQuery.status = { $in: ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'] };

    const interviews = await Interview.find(matchQuery)
      .populate('candidateId', 'name email avatar')
      .populate('jobId', 'title company location')
      .populate('companyId', 'companyName')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Get upcoming interviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send interview reminders
// @route   POST /api/interviews/reminders
// @access  Private (Recruiter)
export const sendInterviewReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reminderType } = req.body;

    const validTypes = ['24h', '1h', '15m'];
    if (!validTypes.includes(reminderType)) {
      return res.status(400).json({ message: 'Invalid reminder type' });
    }

    let reminderHours;
    switch (reminderType) {
      case '24h': reminderHours = 24; break;
      case '1h': reminderHours = 1; break;
      case '15m': reminderHours = 0.25; break;
    }

    const now = new Date();
    const targetTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

    const matchQuery = {
      recruiterId: userId,
      status: { $in: ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'] },
      date: { $lte: targetTime }
    };

    const interviews = await Interview.find(matchQuery)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    const results = [];

    for (const interview of interviews) {
      const alreadySent = interview.remindersSent.some(r => r.type === reminderType);
      if (alreadySent) continue;

      interview.remindersSent.push({ type: reminderType, sentAt: new Date() });
      await interview.save();

      const candidate = interview.candidateId;
      const jobTitle = interview.jobId?.title || 'an interview';

      await createNotification({
        recipientId: candidate._id,
        senderId: req.user._id,
        title: 'Interview Reminder',
        message: `Reminder: Your interview for ${jobTitle} is scheduled on ${new Date(interview.date).toLocaleDateString()} at ${interview.time}`,
        type: 'interview-reminder',
        category: 'interview',
        entityId: interview._id,
        entityType: 'interview',
        io: req.io,
        userSocketMap: req.userSocketMap
      });

      await sendInterviewScheduledEmail(
        candidate.email,
        candidate.name,
        jobTitle,
        interview
      ).catch(err => console.error('Reminder email error:', err));

      results.push(interview._id);
    }

    res.status(200).json({
      success: true,
      data: { sent: results.length, interviews: results },
      message: `${results.length} reminders sent`
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline interview (candidate)
// @route   POST /api/interviews/:id/decline
// @access  Private (Student)
export const declineInterview = async (req, res) => {
  try {
    const { reason } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this interview' });
    }

    if (!['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'].includes(interview.status)) {
      return res.status(400).json({ message: 'This interview cannot be declined' });
    }

    interview.status = 'cancelled';
    interview.timeline.push({
      action: 'declined',
      performedBy: req.user._id,
      note: reason || 'Candidate declined the interview'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.recruiterId,
      senderId: req.user._id,
      title: 'Interview Declined',
      message: `Candidate has declined the interview`,
      type: 'interview-cancelled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview declined successfully'
    });
  } catch (error) {
    console.error('Decline interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark interview as no-show (recruiter)
// @route   POST /api/interviews/:id/no-show
// @access  Private (Recruiter)
export const markNoShow = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this interview as no-show' });
    }

    if (!['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'].includes(interview.status)) {
      return res.status(400).json({ message: 'This interview cannot be marked as no-show' });
    }

    interview.status = 'no-show';
    interview.timeline.push({
      action: 'no-show',
      performedBy: req.user._id,
      note: 'Candidate did not attend the interview'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.candidateId,
      senderId: req.user._id,
      title: 'Interview No-Show',
      message: 'You were marked as a no-show for your interview',
      type: 'interview-no-show',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview marked as no-show'
    });
  } catch (error) {
    console.error('Mark no-show error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve reschedule request (recruiter)
// @route   POST /api/interviews/:id/approve-reschedule
// @access  Private (Recruiter)
export const approveRescheduleRequest = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve this reschedule request' });
    }

    if (interview.status !== 'rescheduled') {
      return res.status(400).json({ message: 'This interview does not have a pending reschedule request' });
    }

    const lastTimeline = interview.timeline[interview.timeline.length - 1];
    if (!lastTimeline || lastTimeline.action !== 'reschedule-requested') {
      return res.status(400).json({ message: 'No reschedule request found for this interview' });
    }

    interview.timeline.push({
      action: 'reschedule-approved',
      performedBy: req.user._id,
      note: 'Reschedule request approved by recruiter'
    });

    // Return the interview to a scheduled state so it is actionable again
    interview.status = 'scheduled';

    await interview.save();

    await createNotification({
      recipientId: interview.candidateId,
      senderId: req.user._id,
      title: 'Reschedule Request Approved',
      message: 'Your reschedule request has been approved',
      type: 'interview-rescheduled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Reschedule request approved successfully'
    });
  } catch (error) {
    console.error('Approve reschedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject reschedule request (recruiter)
// @route   POST /api/interviews/:id/reject-reschedule
// @access  Private (Recruiter)
export const rejectRescheduleRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this reschedule request' });
    }

    if (interview.status !== 'rescheduled') {
      return res.status(400).json({ message: 'This interview does not have a pending reschedule request' });
    }

    interview.timeline.push({
      action: 'reschedule-rejected',
      performedBy: req.user._id,
      note: reason || 'Reschedule request rejected by recruiter'
    });

    await interview.save();

    await createNotification({
      recipientId: interview.candidateId,
      senderId: req.user._id,
      title: 'Reschedule Request Rejected',
      message: 'Your reschedule request has been rejected',
      type: 'interview-rescheduled',
      category: 'interview',
      entityId: interview._id,
      entityType: 'interview',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Reschedule request rejected successfully'
    });
  } catch (error) {
    console.error('Reject reschedule error:', error);
    res.status(500).json({ message: error.message });
  }
};
