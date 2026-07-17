import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

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

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
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
    await Notification.create({
      recipient: job.recruiter,
      sender: req.user._id,
      type: 'job-application',
      content: `${req.user.name} applied for your job posting: "${job.title}".`,
      link: '/jobs'
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
