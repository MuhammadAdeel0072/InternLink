import TalentPool from '../models/TalentPool.js';
import TalentCollection from '../models/TalentCollection.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { createNotification } from '../services/notificationService.js';
import { escapeRegExp } from '../utils/regex.js';

const addTimelineEntry = async (talentPoolId, action, recruiterId, details = '') => {
  await TalentPool.findByIdAndUpdate(talentPoolId, {
    $push: {
      activityTimeline: {
        action,
        date: new Date(),
        recruiter: recruiterId,
        details
      }
    }
  });
};

const sendNotification = async (req, recipientId, senderId, type, title, message, entityId = null, entityType = null, category = 'job') => {
  try {
    await createNotification({
      recipientId,
      senderId,
      title,
      message,
      type,
      category,
      entityId,
      entityType,
      io: req.io,
      userSocketMap: req.userSocketMap
    });
  } catch (error) {
    console.error('Talent pool notification error:', error);
  }
};

// @desc    Get recruiter's talent pool with search, filters, sorting
// @route   GET /api/talent-pool
// @access  Private (Recruiter)
export const getTalentPool = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      skills = '',
      location = '',
      experience = '',
      education = '',
      availability = '',
      rating = '',
      tags = '',
      collectionId = '',
      isFavorite = '',
      archived = 'false',
      status = '',
      sort = 'newest'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recruiterId = req.user._id;

    let matchQuery = { recruiter: recruiterId };

    if (archived === 'true') {
      matchQuery.archived = true;
    } else {
      matchQuery.archived = false;
    }

    if (isFavorite === 'true') {
      matchQuery.isFavorite = true;
    }

    if (rating) {
      const minRating = parseInt(rating);
      if (!isNaN(minRating)) {
        matchQuery.rating = { $gte: minRating };
      }
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        matchQuery.tags = { $in: tagArray };
      }
    }

    if (collectionId) {
      matchQuery.collections = collectionId;
    }

    if (status) {
      matchQuery.status = status;
    }

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidateData'
        }
      },
      { $unwind: '$candidateData' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'candidateData._id',
          foreignField: 'user',
          as: 'profileData'
        }
      },
      { $unwind: { path: '$profileData', preserveNullAndEmptyArrays: true } }
    ];

    const sanitizedSearch = search ? escapeRegExp(search) : null;
    const sanitizedLocation = location ? escapeRegExp(location) : null;
    const sanitizedSkills = skills ? escapeRegExp(skills) : null;
    const sanitizedEducation = education ? escapeRegExp(education) : null;

    if (sanitizedSearch) {
      pipeline.push({
        $match: {
          $or: [
            { 'candidateData.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'candidateData.email': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.headline': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.university': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.skills.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'profileData.currentStatus': { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
      });
    }

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

    if (sanitizedSkills) {
      pipeline.push({
        $match: {
          'profileData.skills.name': { $regex: sanitizedSkills, $options: 'i' }
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

    if (availability) {
      pipeline.push({
        $match: {
          'profileData.currentStatus': availability
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

    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'name':
        sortOption = { 'candidateData.name': 1 };
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
    const totalResult = await TalentPool.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const talentPoolEntries = await TalentPool.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: talentPoolEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get talent pool error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single talent pool entry with full candidate profile
// @route   GET /api/talent-pool/:id
// @access  Private (Recruiter)
export const getTalentPoolEntry = async (req, res) => {
  try {
    const entry = await TalentPool.findById(req.params.id)
      .populate('candidate', 'name email avatar role')
      .populate('recruiter', 'name email')
      .populate('collections', 'name description')
      .populate('notes.recruiter', 'name');

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this entry' });
    }

    const profile = await Profile.findOne({ user: entry.candidate._id });

    res.status(200).json({
      success: true,
      data: {
        ...entry.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error('Get talent pool entry error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add candidate to talent pool
// @route   POST /api/talent-pool
// @access  Private (Recruiter)
export const addToTalentPool = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const recruiterId = req.user._id;

    if (!candidateId) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }

    if (candidateId === recruiterId.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself to talent pool' });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'student') {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const existingEntry = await TalentPool.findOne({ recruiter: recruiterId, candidate: candidateId });
    if (existingEntry) {
      return res.status(409).json({ message: 'Candidate already exists in your talent pool' });
    }

    const entry = await TalentPool.create({
      recruiter: recruiterId,
      candidate: candidateId,
      activityTimeline: [{
        action: 'candidate-saved',
        recruiter: recruiterId,
        details: 'Candidate added to talent pool'
      }]
    });

    await entry.populate('candidate', 'name email avatar role');
    await entry.populate('collections', 'name description');

    await sendNotification(
      req,
      candidateId,
      recruiterId,
      'job-match',
      'Profile Saved to Talent Pool',
      `${req.user.name} saved your profile to their talent pool.`,
      entry._id,
      'user',
      'job'
    );

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Candidate added to talent pool successfully'
    });
  } catch (error) {
    console.error('Add to talent pool error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update talent pool entry
// @route   PUT /api/talent-pool/:id
// @access  Private (Recruiter)
export const updateTalentPoolEntry = async (req, res) => {
  try {
    const entry = await TalentPool.findById(req.params.id)
      .populate('candidate', 'name email avatar role');

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    const { isFavorite, rating, tags, status, collections, archived } = req.body;

    if (isFavorite !== undefined) entry.isFavorite = isFavorite;
    if (rating !== undefined) entry.rating = Math.max(0, Math.min(5, rating));
    if (status !== undefined) entry.status = status;
    if (archived !== undefined) entry.archived = archived;

    if (tags !== undefined) {
      entry.tags = Array.isArray(tags) ? tags : [tags];
    }

    if (collections !== undefined) {
      entry.collections = Array.isArray(collections) ? collections : [collections];
      entry.collections = [...new Set(entry.collections.map(c => c.toString()))];
    }

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');
    await entry.populate('collections', 'name description');

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Talent pool entry updated successfully'
    });
  } catch (error) {
    console.error('Update talent pool entry error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove candidate from talent pool
// @route   DELETE /api/talent-pool/:id
// @access  Private (Recruiter)
export const removeFromTalentPool = async (req, res) => {
  try {
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove this entry' });
    }

    await TalentPool.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Candidate removed from talent pool successfully'
    });
  } catch (error) {
    console.error('Remove from talent pool error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle favorite status
// @route   PUT /api/talent-pool/:id/favorite
// @access  Private (Recruiter)
export const toggleFavorite = async (req, res) => {
  try {
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    entry.isFavorite = !entry.isFavorite;
    entry.activityTimeline.push({
      action: entry.isFavorite ? 'added-to-favorites' : 'removed-from-favorites',
      date: new Date(),
      recruiter: req.user._id,
      details: entry.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: entry.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive/unarchive candidate
// @route   PUT /api/talent-pool/:id/archive
// @access  Private (Recruiter)
export const toggleArchive = async (req, res) => {
  try {
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    entry.archived = !entry.archived;
    entry.activityTimeline.push({
      action: entry.archived ? 'candidate-archived' : 'candidate-restored',
      date: new Date(),
      recruiter: req.user._id,
      details: entry.archived ? 'Candidate archived' : 'Candidate restored'
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: entry.archived ? 'Candidate archived' : 'Candidate restored'
    });
  } catch (error) {
    console.error('Toggle archive error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate candidate
// @route   PUT /api/talent-pool/:id/rate
// @access  Private (Recruiter)
export const rateCandidate = async (req, res) => {
  try {
    const { rating } = req.body;
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this candidate' });
    }

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    entry.rating = rating;
    entry.activityTimeline.push({
      action: 'candidate-rated',
      date: new Date(),
      recruiter: req.user._id,
      details: `Rated ${rating} stars`
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: `Candidate rated ${rating} stars`
    });
  } catch (error) {
    console.error('Rate candidate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add note to candidate
// @route   PUT /api/talent-pool/:id/note
// @access  Private (Recruiter)
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add notes to this candidate' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    entry.notes.push({
      text: text.trim(),
      date: new Date(),
      recruiter: req.user._id
    });

    entry.activityTimeline.push({
      action: 'note-added',
      date: new Date(),
      recruiter: req.user._id,
      details: 'Note added'
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete note from candidate
// @route   DELETE /api/talent-pool/:id/note/:noteIndex
// @access  Private (Recruiter)
export const deleteNote = async (req, res) => {
  try {
    const { id, noteIndex } = req.params;
    const entry = await TalentPool.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete notes for this candidate' });
    }

    const index = parseInt(noteIndex, 10);
    if (isNaN(index) || index < 0 || index >= entry.notes.length) {
      return res.status(400).json({ message: 'Invalid note index' });
    }

    entry.notes.splice(index, 1);

    entry.activityTimeline.push({
      action: 'note-deleted',
      date: new Date(),
      recruiter: req.user._id,
      details: 'Note deleted'
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add tag to candidate
// @route   PUT /api/talent-pool/:id/tag
// @access  Private (Recruiter)
export const addTag = async (req, res) => {
  try {
    const { tags } = req.body;
    const entry = await TalentPool.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Talent pool entry not found' });
    }

    if (entry.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to tag this candidate' });
    }

    const newTags = Array.isArray(tags) ? tags : [tags];
    const existingTags = entry.tags || [];

    const mergedTags = [...new Set([...existingTags, ...newTags])];
    entry.tags = mergedTags;

    entry.activityTimeline.push({
      action: 'tag-added',
      date: new Date(),
      recruiter: req.user._id,
      details: `Tags added: ${newTags.join(', ')}`
    });

    await entry.save();
    await entry.populate('candidate', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Tags added successfully'
    });
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Invite candidate to apply for a job
// @route   POST /api/talent-pool/invite
// @access  Private (Recruiter)
export const inviteCandidate = async (req, res) => {
  try {
    const { candidateId, jobId, message: invitationMessage } = req.body;
    const recruiterId = req.user._id;

    if (!candidateId || !jobId) {
      return res.status(400).json({ message: 'Candidate ID and Job ID are required' });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'student') {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiter.toString() !== recruiterId.toString()) {
      return res.status(403).json({ message: 'Not authorized to invite for this job' });
    }

    if (job.status !== 'published' || !job.isActive) {
      return res.status(400).json({ message: 'Cannot invite for an inactive or unpublished job' });
    }

    const talentEntry = await TalentPool.findOne({ recruiter: recruiterId, candidate: candidateId });

    if (talentEntry) {
      talentEntry.lastContactedAt = new Date();
      talentEntry.activityTimeline.push({
        action: 'invitation-sent',
        date: new Date(),
        recruiter: recruiterId,
        details: `Invitation sent for job: ${job.title}`
      });
      await talentEntry.save();
    }

    await sendNotification(
      req,
      candidateId,
      recruiterId,
      'job-match',
      'Job Invitation',
      invitationMessage || `You have been invited to apply for ${job.title}`,
      job._id,
      'job',
      'job'
    );

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Invite candidate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recruiter's collections
// @route   GET /api/talent-pool/collections
// @access  Private (Recruiter)
export const getCollections = async (req, res) => {
  try {
    const recruiterId = req.user._id;
    const collections = await TalentCollection.find({ recruiter: recruiterId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create collection
// @route   POST /api/talent-pool/collections
// @access  Private (Recruiter)
export const createCollection = async (req, res) => {
  try {
    const { name, description } = req.body;
    const recruiterId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Collection name is required' });
    }

    const existingCollection = await TalentCollection.findOne({
      recruiter: recruiterId,
      name: { $regex: `^${escapeRegExp(name.trim())}$`, $options: 'i' }
    });

    if (existingCollection) {
      return res.status(409).json({ message: 'A collection with this name already exists' });
    }

    const collection = await TalentCollection.create({
      recruiter: recruiterId,
      name: name.trim(),
      description: description || ''
    });

    res.status(201).json({
      success: true,
      data: collection,
      message: 'Collection created successfully'
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update collection
// @route   PUT /api/talent-pool/collections/:id
// @access  Private (Recruiter)
export const updateCollection = async (req, res) => {
  try {
    const { name, description } = req.body;
    const collection = await TalentCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this collection' });
    }

    if (name && name.trim()) {
      const existingCollection = await TalentCollection.findOne({
        recruiter: req.user._id,
        name: { $regex: `^${escapeRegExp(name.trim())}$`, $options: 'i' },
        _id: { $ne: collection._id }
      });

      if (existingCollection) {
        return res.status(409).json({ message: 'A collection with this name already exists' });
      }

      collection.name = name.trim();
    }

    if (description !== undefined) {
      collection.description = description;
    }

    await collection.save();

    res.status(200).json({
      success: true,
      data: collection,
      message: 'Collection updated successfully'
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete collection
// @route   DELETE /api/talent-pool/collections/:id
// @access  Private (Recruiter)
export const deleteCollection = async (req, res) => {
  try {
    const collection = await TalentCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this collection' });
    }

    await TalentPool.updateMany(
      { recruiter: req.user._id, collections: collection._id },
      { $pull: { collections: collection._id } }
    );

    await TalentCollection.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export talent pool candidates
// @route   POST /api/talent-pool/export
// @access  Private (Recruiter)
export const exportTalentPool = async (req, res) => {
  try {
    const { candidateIds, format = 'csv' } = req.body;
    const recruiterId = req.user._id;

    let matchQuery = { recruiter: recruiterId, archived: false };

    if (candidateIds && candidateIds.length > 0) {
      const validIds = candidateIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        matchQuery._id = { $in: validIds };
      }
    }

    const entries = await TalentPool.find(matchQuery)
      .populate('candidate', 'name email avatar')
      .populate('collections', 'name');

    if (entries.length === 0) {
      return res.status(404).json({ message: 'No candidates to export' });
    }

    const profiles = await Promise.all(
      entries.map(entry => Profile.findOne({ user: entry.candidate._id }))
    );

    const headers = ['Name', 'Email', 'Headline', 'Current Company', 'Current Position', 'Location', 'Rating', 'Tags', 'Notes', 'Collections', 'Added Date'];
    const rows = entries.map((entry, index) => {
      const profile = profiles[index];
      const notesText = entry.notes && entry.notes.length > 0
        ? entry.notes.map(n => n.text).join(' | ')
        : '';
      return [
        entry.candidate?.name || '',
        entry.candidate?.email || '',
        profile?.headline || '',
        profile?.experience?.[0]?.company || '',
        profile?.experience?.[0]?.title || '',
        profile?.locationString || '',
        entry.rating || '',
        (entry.tags || []).join(';'),
        notesText,
        (entry.collections || []).map(c => c.name).join(';'),
        entry.createdAt.toISOString().split('T')[0]
      ];
    });

    if (format === 'csv') {
      const csvContent = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=talent-pool.csv');
      res.send(csvContent);
    } else if (format === 'excel') {
      const excelXml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Worksheet ss:Name="Talent Pool">
    <Table>
      <Row>${headers.map(h => `<Cell><Data ss:Type="String">${h || ''}</Data></Cell>`).join('')}</Row>
      ${rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${cell || ''}</Data></Cell>`).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`;

      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename=talent-pool.xls');
      res.send(excelXml);
    } else if (format === 'json') {
      const data = entries.map((entry, index) => {
        const profile = profiles[index];
        return {
          name: entry.candidate?.name,
          email: entry.candidate?.email,
          headline: profile?.headline,
          currentCompany: profile?.experience?.[0]?.company,
          currentPosition: profile?.experience?.[0]?.title,
          location: profile?.locationString,
          rating: entry.rating,
          tags: entry.tags,
          notes: entry.notes?.map(n => n.text),
          collections: entry.collections?.map(c => c.name),
          addedDate: entry.createdAt
        };
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=talent-pool.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      res.status(400).json({ message: 'Unsupported export format. Use csv, excel, or json' });
    }
  } catch (error) {
    console.error('Export talent pool error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get talent pool statistics
// @route   GET /api/talent-pool/stats
// @access  Private (Recruiter)
export const getTalentPoolStats = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const [
      totalCandidates,
      newThisMonth,
      contacted,
      availableForWork,
      favoriteCandidates,
      collectionCount
    ] = await Promise.all([
      TalentPool.countDocuments({ recruiter: recruiterId, archived: false }),
      TalentPool.countDocuments({
        recruiter: recruiterId,
        archived: false,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      TalentPool.countDocuments({
        recruiter: recruiterId,
        archived: false,
        'notes.0': { $exists: true }
      }),
      (async () => {
        const pipeline = [
          { $match: { recruiter: recruiterId, archived: false } },
          {
            $lookup: {
              from: 'profiles',
              localField: 'candidate',
              foreignField: 'user',
              as: 'profileData'
            }
          },
          { $unwind: { path: '$profileData', preserveNullAndEmptyArrays: true } },
          {
            $match: {
              'profileData.currentStatus': { $in: ['open-to-work', 'actively-looking'] }
            }
          },
          { $count: 'total' }
        ];
        const result = await TalentPool.aggregate(pipeline);
        return result.length > 0 ? result[0].total : 0;
      })(),
      TalentPool.countDocuments({ recruiter: recruiterId, archived: false, isFavorite: true }),
      TalentCollection.countDocuments({ recruiter: recruiterId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        newThisMonth,
        contacted,
        availableForWork,
        savedCandidates: totalCandidates,
        favoriteCandidates,
        collectionCount
      }
    });
  } catch (error) {
    console.error('Get talent pool stats error:', error);
    res.status(500).json({ message: error.message });
  }
};
