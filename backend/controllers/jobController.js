import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { createNotification } from '../services/notificationService.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { escapeRegExp } from '../utils/regex.js';
import JobAlert from '../models/JobAlert.js';

// @desc    Create a new job posting (Recruiter action)
// @route   POST /api/jobs
// @access  Private (Recruiter only)
export const createJob = async (req, res) => {
  try {
    const { company, title, description, requirements, location, jobType, salaryRange, remote } = req.body;

    const job = await Job.create({
      recruiter: req.user._id,
      company,
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(',').map((r) => r.trim()),
      location,
      jobType,
      salaryRange,
      remote: remote === 'true' || remote === true
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all jobs with search and filter queries
// @route   GET /api/jobs
// @access  Private
export const getAllJobs = async (req, res) => {
  try {
    const { search, location, jobType, remote } = req.query;
    const sanitizedSearch = search ? escapeRegExp(search) : null;
    const sanitizedLocation = location ? escapeRegExp(location) : null;

    const query = { isActive: true };

    if (sanitizedSearch) {
      query.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        { company: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    if (sanitizedLocation) {
      query.location = { $regex: sanitizedLocation, $options: 'i' };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (remote !== undefined) {
      query.remote = remote === 'true';
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job details by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Student only)
export const applyForJob = async (req, res) => {
  try {
    const { coverLetter, useProfileResume, profileResumeUrl } = req.body;
    let resumeUrl = '';

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    const alreadyApplied = await Application.findOne({ job: job._id, student: req.user._id });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this position' });
    }

    // Resolve resume selection
    if (useProfileResume === 'true' || useProfileResume === true) {
      if (!profileResumeUrl) {
        return res.status(400).json({ message: 'No saved resume found on your profile.' });
      }
      resumeUrl = profileResumeUrl;
    } else {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a resume PDF file' });
      }
      resumeUrl = await uploadToCloudinary(req.file);
    }

    const application = await Application.create({
      job: job._id,
      student: req.user._id,
      resume: resumeUrl,
      coverLetter: coverLetter || '',
      status: 'applied'
    });

    // Notify the Recruiter
    await createNotification({
      recipientId: job.recruiter,
      senderId: req.user._id,
      title: 'New Job Application',
      message: `${req.user.name} applied for your job posting: "${job.title}".`,
      type: 'application-submitted',
      category: 'application',
      entityId: application._id,
      entityType: 'application',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(201).json({
      application,
      message: 'Application submitted successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get currently logged in student's application list
// @route   GET /api/jobs/applications/me
// @access  Private
export const getStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate('job')
      .sort({ createdAt: -1 });
      
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Save/Unsave a job
// @route   POST /api/jobs/:id/save
// @access  Private
export const toggleSaveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const isSaved = job.savedBy.includes(req.user._id);
    if (isSaved) {
      job.savedBy = job.savedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      job.savedBy.push(req.user._id);
    }
    await job.save();
    res.status(200).json({ saved: !isSaved, message: isSaved ? 'Job removed from saved' : 'Job saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved jobs
// @route   GET /api/jobs/saved
// @access  Private
export const getSavedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ savedBy: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommended jobs (based on profile skills)
// @route   GET /api/jobs/recommended
// @access  Private
export const getRecommendedJobs = async (req, res) => {
  try {
    const Profile = (await import('../models/Profile.js')).default;
    const profile = await Profile.findOne({ user: req.user._id });
    const skills = profile?.skills?.map(s => typeof s === 'object' ? s.name : s) || [];
    
    const sanitizedSkills = skills.map(s => escapeRegExp(s)).join('|');
    
    const jobs = await Job.find({
      isActive: true,
      $or: [
        { skills: { $in: skills } },
        { title: { $regex: sanitizedSkills, $options: 'i' } }
      ]
    }).limit(6).sort({ createdAt: -1 });
    
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get similar jobs
// @route   GET /api/jobs/:id/similar
// @access  Private
export const getSimilarJobs = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const sanitizedTitlePart = escapeRegExp(job.title.split(' ')[0]);
    const similar = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills || [] } },
        { title: { $regex: sanitizedTitlePart, $options: 'i' } },
        { jobType: job.jobType }
      ]
    }).limit(4).sort({ createdAt: -1 });
    
    res.status(200).json(similar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private
export const withdrawApplication = async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (['accepted', 'rejected'].includes(app.status)) {
      return res.status(400).json({ message: 'Cannot withdraw at this stage' });
    }
    await Application.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Application withdrawn' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status (recruiter only)
// @route   PUT /api/applications/:id/status
// @access  Private
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = status;
    await app.save();
    
    const statusTypeMap = {
      'applied': { type: 'application-submitted', title: 'Application Status Updated' },
      'under-review': { type: 'application-submitted', title: 'Application Status Updated' },
      'shortlisted': { type: 'application-shortlisted', title: 'Application Shortlisted' },
      'rejected': { type: 'application-rejected', title: 'Application Rejected' },
      'accepted': { type: 'application-accepted', title: 'Application Accepted' },
      'hired': { type: 'application-accepted', title: 'Application Accepted' },
      'withdrawn': { type: 'application-withdrawn', title: 'Application Withdrawn' }
    };
    const statusNotif = statusTypeMap[status] || { type: 'application-submitted', title: 'Application Status Updated' };

    await createNotification({
      recipientId: app.student,
      senderId: req.user._id,
      title: statusNotif.title,
      message: `Your application status has been updated to: ${status}`,
      type: statusNotif.type,
      category: 'application',
      entityId: app._id,
      entityType: 'application',
      io: req.io,
      userSocketMap: req.userSocketMap
    });
    
    res.status(200).json(app);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create job alert
// @route   POST /api/job-alerts
// @access  Private
export const createJobAlert = async (req, res) => {
  try {
    const alert = await JobAlert.create({ ...req.body, user: req.user._id });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's job alerts
// @route   GET /api/job-alerts
// @access  Private
export const getJobAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({ user: req.user._id });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete job alert
// @route   DELETE /api/job-alerts/:id
// @access  Private
export const deleteJobAlert = async (req, res) => {
  try {
    await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};