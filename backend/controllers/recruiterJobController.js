import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { escapeRegExp } from '../utils/regex.js';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

const getUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  while (await Job.findOne({ slug, _id: excludeId ? { $ne: excludeId } : {} })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

export const getRecruiterJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, jobType, department, location, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sanitizedSearch = search ? escapeRegExp(search) : null;
    const sanitizedLocation = location ? escapeRegExp(location) : null;

    let query = { recruiter: req.user._id, isDeleted: false };

    if (sanitizedSearch) {
      query.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { skills: { $in: [new RegExp(sanitizedSearch, 'i')] } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (jobType && jobType !== 'all') {
      query.jobType = jobType;
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (sanitizedLocation) {
      query.location = { $regex: sanitizedLocation, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most-viewed':
        sortOption = { views: -1 };
        break;
      case 'most-applications':
        sortOption = { applicationsCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Job.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRecruiterJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createRecruiterJob = async (req, res) => {
  try {
    const jobData = { ...req.body, recruiter: req.user._id };
    
    const baseSlug = generateSlug(jobData.title);
    jobData.slug = await getUniqueSlug(baseSlug);

    const company = await Company.findOne({ 'recruiters.userId': req.user._id, 'recruiters.status': 'approved' });
    if (company) {
      jobData.companyId = company._id;
      if (!jobData.company) {
        jobData.company = company.companyName;
      }
    }

    const job = await Job.create(jobData);

    if (company) {
      company.logo && (jobData.logo = company.logo);
    }

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateRecruiterJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updateData = { ...req.body };
    
    if (updateData.title && updateData.title !== job.title) {
      const baseSlug = generateSlug(updateData.title);
      updateData.slug = await getUniqueSlug(baseSlug, job._id);
    }

    Object.keys(updateData).forEach(key => {
      job[key] = updateData[key];
    });

    job.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      changes: 'Job updated'
    });

    await job.save();
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteRecruiterJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.isDeleted = true;
    job.isActive = false;
    job.status = 'archived';
    await job.save();

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const closeRecruiterJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'closed';
    job.isActive = false;
    await job.save();

    res.status(200).json({ success: true, data: job, message: 'Job closed successfully' });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const reopenRecruiterJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'published';
    job.isActive = true;
    await job.save();

    res.status(200).json({ success: true, data: job, message: 'Job reopened successfully' });
  } catch (error) {
    console.error('Reopen job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const duplicateRecruiterJob = async (req, res) => {
  try {
    const originalJob = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!originalJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const jobData = originalJob.toObject();
    delete jobData._id;
    delete jobData.createdAt;
    delete jobData.updatedAt;
    delete jobData.applicants;
    delete jobData.savedBy;
    delete jobData.views;
    delete jobData.applicationsCount;
    delete jobData.savedCount;
    delete jobData.shareCount;
    delete jobData.daysActive;
    delete jobData.editHistory;
    delete jobData.slug;

    jobData.title = `${originalJob.title} (Copy)`;
    jobData.status = 'draft';
    jobData.isActive = false;
    jobData.applicants = [];
    jobData.savedBy = [];
    jobData.views = 0;
    jobData.applicationsCount = 0;
    jobData.savedCount = 0;
    jobData.shareCount = 0;
    jobData.daysActive = 0;

    const baseSlug = generateSlug(jobData.title);
    jobData.slug = await getUniqueSlug(baseSlug);

    const duplicatedJob = await Job.create(jobData);

    res.status(201).json({ success: true, data: duplicatedJob, message: 'Job duplicated successfully' });
  } catch (error) {
    console.error('Duplicate job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const publishRecruiterJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'published';
    job.isActive = true;
    await job.save();

    res.status(200).json({ success: true, data: job, message: 'Job published successfully' });
  } catch (error) {
    console.error('Publish job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getJobAnalytics = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id, isDeleted: false });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = await Application.find({ job: job._id });
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        views: job.views,
        applicationsCount: job.applicationsCount,
        savedCount: job.savedCount,
        shareCount: job.shareCount,
        daysActive: job.daysActive,
        statusCounts,
        applications: applications.length
      }
    });
  } catch (error) {
    console.error('Get job analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const incrementJobViews = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ success: true, views: job.views });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: error.message });
  }
};