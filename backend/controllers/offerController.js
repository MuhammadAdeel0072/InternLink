import Offer from '../models/Offer.js';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { createNotification } from '../services/notificationService.js';
import {
  sendOfferSentEmail,
  sendOfferAcceptedEmail,
  sendOfferRejectedEmail,
  sendOfferWithdrawnEmail,
  sendOfferUpdatedEmail,
  sendOfferNegotiationEmail
} from '../utils/sendEmail.js';
import { escapeRegExp } from '../utils/regex.js';

const addTimelineEntry = async (offerId, action, performedBy, note = '') => {
  await Offer.findByIdAndUpdate(offerId, {
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

const addHistoryEntry = async (offerId, version, changes, updatedBy) => {
  await Offer.findByIdAndUpdate(offerId, {
    $push: {
      history: {
        version,
        changes,
        updatedBy,
        updatedAt: new Date()
      }
    }
  });
};

const generateOfferNumber = async () => {
  const count = await Offer.countDocuments();
  return `OFF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

const computeCompensation = (salary, compensation) => {
  const base = salary.baseSalary || 0;
  const bonus = salary.bonus || 0;
  const performance = compensation.performanceBonus || 0;
  const annual = compensation.annualBonus || 0;
  const travel = compensation.travelAllowance || 0;
  const medical = compensation.medicalAllowance || 0;
  const housing = compensation.housingAllowance || 0;
  const internet = compensation.internetAllowance || 0;
  const other = compensation.other || 0;

  const monthly = base + (bonus / 12);
  const annualTotal = base * 12 + bonus + performance + annual + travel + medical + housing + internet + other;
  return {
    monthlyCompensation: Math.round(monthly),
    annualCompensation: Math.round(annualTotal),
    totalPackage: Math.round(annualTotal)
  };
};

// @desc    Get all offers for recruiter with search, filters, sorting
// @route   GET /api/offers
// @access  Private (Recruiter)
export const getOffers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      jobId = 'all',
      companyId = 'all',
      recruiterId = 'all',
      department = '',
      date = '',
      sort = 'newest'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};

    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    }

    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    if (jobId && jobId !== 'all') {
      matchQuery.jobId = jobId;
    }

    if (companyId && companyId !== 'all') {
      matchQuery.companyId = companyId;
    }

    if (recruiterId && recruiterId !== 'all' && userRole === 'student') {
      matchQuery.recruiterId = recruiterId;
    }

    if (department) {
      matchQuery.department = department;
    }

    if (date) {
      const selectedDate = new Date(date);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      matchQuery.createdAt = { $gte: selectedDate, $lt: nextDate };
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
            { 'companyData.companyName': { $regex: sanitizedSearch, $options: 'i' } },
            { offerNumber: { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
      });
    }

    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'expiry-asc':
        sortOption = { expiryDate: 1 };
        break;
      case 'expiry-desc':
        sortOption = { expiryDate: -1 };
        break;
      case 'salary-asc':
        sortOption = { 'salary.baseSalary': 1 };
        break;
      case 'salary-desc':
        sortOption = { 'salary.baseSalary': -1 };
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
    const totalResult = await Offer.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const offers = await Offer.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single offer details
// @route   GET /api/offers/:id
// @access  Private
export const getOfferDetails = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('applicationId')
      .populate('interviewId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const userRole = req.user.role;
    if (userRole === 'recruiter' && offer.recruiterId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    if (userRole === 'student' && offer.candidateId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    console.error('Get offer details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private (Recruiter)
export const createOffer = async (req, res) => {
  try {
    const {
      applicationId,
      interviewId,
      jobId,
      candidateId,
      companyId,
      salary,
      compensation,
      benefits,
      customBenefits,
      joiningDate,
      reportingTime,
      officeLocation,
      manager,
      team,
      expiryDate,
      template
    } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'hired') {
      return res.status(400).json({ message: 'Candidate has already been hired' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const offerNumber = await generateOfferNumber();

    const comp = computeCompensation(salary, compensation);

    const offer = await Offer.create({
      applicationId,
      interviewId: interviewId || null,
      jobId,
      candidateId,
      recruiterId: req.user._id,
      companyId: companyId || job.companyId || null,
      offerNumber,
      salary,
      compensation: { ...compensation, ...comp },
      benefits: benefits || [],
      customBenefits: customBenefits || [],
      joiningDate,
      reportingTime: reportingTime || '09:00 AM',
      officeLocation: officeLocation || '',
      manager: manager || '',
      team: team || '',
      expiryDate,
      issueDate: new Date(),
      template: template || 'default',
      status: 'draft',
      offerLetter: ''
    });

    await addTimelineEntry(offer._id, 'Offer Created', req.user._id, 'Offer draft created');
    await addHistoryEntry(offer._id, 1, 'Initial offer created', req.user._id);

    const populated = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private (Recruiter)
export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this offer' });
    }

    if (['accepted', 'rejected', 'withdrawn', 'expired'].includes(offer.status)) {
      return res.status(400).json({ message: 'Cannot update offer in current status' });
    }

    const previousStatus = offer.status;
    const updates = { ...req.body };

    if (updates.salary || updates.compensation) {
      const newSalary = updates.salary || offer.salary;
      const newComp = updates.compensation || offer.compensation;
      const comp = computeCompensation(newSalary, newComp);
      updates.compensation = { ...newComp, ...comp };
    }

    if (updates.benefits) updates.benefits = updates.benefits;
    if (updates.customBenefits) updates.customBenefits = updates.customBenefits;

    Object.assign(offer, updates);

    await offer.save();

    const changes = [];
    if (updates.salary) changes.push('Salary updated');
    if (updates.joiningDate) changes.push('Joining date updated');
    if (updates.expiryDate) changes.push('Expiry date updated');
    if (updates.benefits) changes.push('Benefits updated');
    if (updates.compensation) changes.push('Compensation updated');

    const newVersion = (offer.history?.length || 0) + 1;
    await addHistoryEntry(offer._id, newVersion, changes.join(', ') || 'Offer updated', req.user._id);

    const populated = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send offer to candidate
// @route   POST /api/offers/:id/send
// @access  Private (Recruiter)
export const sendOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send this offer' });
    }

    if (offer.status !== 'draft' && offer.status !== 'negotiation') {
      return res.status(400).json({ message: 'Offer can only be sent from draft or negotiation status' });
    }

    if (new Date(offer.expiryDate) <= new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }

    offer.status = 'sent';
    await offer.save();

    await addTimelineEntry(offer._id, 'Offer Sent', req.user._id, 'Offer sent to candidate');

    const candidate = await User.findById(offer.candidateId);
    if (candidate && candidate.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('recruiterId');
      await sendOfferSentEmail(candidate.email, candidate.name, populated);
    }

    await createNotification({
      recipientId: offer.candidateId,
      senderId: req.user._id,
      title: 'New Offer Received',
      message: `You have received a new offer for ${offer.jobId?.title || 'a position'}`,
      type: 'offer-sent',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    const finalOffer = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: finalOffer });
  } catch (error) {
    console.error('Send offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Candidate views offer
// @route   POST /api/offers/:id/view
// @access  Private (Student)
export const viewOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    if (offer.status === 'sent') {
      offer.status = 'viewed';
      await offer.save();
      await addTimelineEntry(offer._id, 'Offer Viewed', req.user._id, 'Candidate viewed the offer');
    }

    const populated = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('View offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept offer
// @route   POST /api/offers/:id/accept
// @access  Private (Student)
export const acceptOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this offer' });
    }

    if (!['sent', 'viewed', 'negotiation'].includes(offer.status)) {
      return res.status(400).json({ message: 'Offer cannot be accepted in current status' });
    }

    offer.status = 'accepted';
    await offer.save();

    await addTimelineEntry(offer._id, 'Offer Accepted', req.user._id, 'Candidate accepted the offer');

    await Application.findByIdAndUpdate(offer.applicationId, {
      status: 'hired',
      $push: {
        timeline: {
          status: 'hired',
          changedBy: req.user._id,
          timestamp: new Date(),
          reason: 'Offer accepted'
        }
      }
    });

    await createNotification({
      recipientId: offer.recruiterId,
      senderId: req.user._id,
      title: 'Offer Accepted',
      message: `${req.user.name} has accepted the offer for ${offer.jobId?.title || 'the position'}`,
      type: 'offer-accepted',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    const recruiter = await User.findById(offer.recruiterId);
    if (recruiter && recruiter.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('candidateId');
      await sendOfferAcceptedEmail(recruiter.email, recruiter.name, populated);
    }

    const finalOffer = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: finalOffer });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject offer
// @route   POST /api/offers/:id/reject
// @access  Private (Student)
export const rejectOffer = async (req, res) => {
  try {
    const { reason } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this offer' });
    }

    if (!['sent', 'viewed', 'negotiation'].includes(offer.status)) {
      return res.status(400).json({ message: 'Offer cannot be rejected in current status' });
    }

    offer.status = 'rejected';
    offer.rejectionReason = reason || '';
    await offer.save();

    await addTimelineEntry(offer._id, 'Offer Rejected', req.user._id, reason || 'Candidate rejected the offer');

    await createNotification({
      recipientId: offer.recruiterId,
      senderId: req.user._id,
      title: 'Offer Rejected',
      message: `${req.user.name} has rejected the offer for ${offer.jobId?.title || 'the position'}`,
      type: 'offer-rejected',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    const recruiter = await User.findById(offer.recruiterId);
    if (recruiter && recruiter.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('candidateId');
      await sendOfferRejectedEmail(recruiter.email, recruiter.name, populated, reason);
    }

    const finalOffer = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: finalOffer });
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Negotiate offer
// @route   POST /api/offers/:id/negotiate
// @access  Private (Student)
export const negotiateOffer = async (req, res) => {
  try {
    const { expectedSalary, preferredJoiningDate, additionalComments } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to negotiate this offer' });
    }

    if (!['sent', 'viewed'].includes(offer.status)) {
      return res.status(400).json({ message: 'Offer cannot be negotiated in current status' });
    }

    offer.negotiationHistory.push({
      expectedSalary,
      preferredJoiningDate: preferredJoiningDate ? new Date(preferredJoiningDate) : null,
      additionalComments: additionalComments || '',
      requestedBy: req.user._id
    });
    offer.status = 'negotiation';
    await offer.save();

    await addTimelineEntry(offer._id, 'Negotiation Requested', req.user._id, 'Candidate requested negotiation');

    await createNotification({
      recipientId: offer.recruiterId,
      senderId: req.user._id,
      title: 'Offer Negotiation Requested',
      message: `${req.user.name} has requested negotiation for the offer for ${offer.jobId?.title || 'the position'}`,
      type: 'offer-negotiation',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    const recruiter = await User.findById(offer.recruiterId);
    if (recruiter && recruiter.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('candidateId');
      await sendOfferNegotiationEmail(recruiter.email, recruiter.name, populated, {
        expectedSalary,
        preferredJoiningDate,
        additionalComments
      });
    }

    const finalOffer = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: finalOffer });
  } catch (error) {
    console.error('Negotiate offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw offer
// @route   POST /api/offers/:id/withdraw
// @access  Private (Recruiter)
export const withdrawOffer = async (req, res) => {
  try {
    const { reason } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this offer' });
    }

    if (!['sent', 'viewed', 'negotiation'].includes(offer.status)) {
      return res.status(400).json({ message: 'Offer cannot be withdrawn in current status' });
    }

    offer.status = 'withdrawn';
    await offer.save();

    await addTimelineEntry(offer._id, 'Offer Withdrawn', req.user._id, reason || 'Offer withdrawn by recruiter');

    await createNotification({
      recipientId: offer.candidateId,
      senderId: req.user._id,
      title: 'Offer Withdrawn',
      message: `Your offer for ${offer.jobId?.title || 'the position'} has been withdrawn`,
      type: 'offer-withdrawn',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    const candidate = await User.findById(offer.candidateId);
    if (candidate && candidate.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('candidateId');
      await sendOfferWithdrawnEmail(candidate.email, candidate.name, populated, reason);
    }

    const finalOffer = await Offer.findById(offer._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(200).json({ success: true, data: finalOffer });
  } catch (error) {
    console.error('Withdraw offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Duplicate offer
// @route   POST /api/offers/:id/duplicate
// @access  Private (Recruiter)
export const duplicateOffer = async (req, res) => {
  try {
    const original = await Offer.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (original.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to duplicate this offer' });
    }

    const offerNumber = await generateOfferNumber();

    const duplicated = await Offer.create({
      applicationId: original.applicationId,
      interviewId: original.interviewId,
      jobId: original.jobId,
      candidateId: original.candidateId,
      recruiterId: req.user._id,
      companyId: original.companyId,
      offerNumber,
      status: 'draft',
      salary: { ...original.salary },
      compensation: { ...original.compensation },
      benefits: [...original.benefits],
      customBenefits: [...original.customBenefits],
      joiningDate: original.joiningDate,
      reportingTime: original.reportingTime,
      officeLocation: original.officeLocation,
      manager: original.manager,
      team: original.team,
      issueDate: new Date(),
      expiryDate: original.expiryDate,
      template: original.template,
      offerLetter: ''
    });

    await addTimelineEntry(duplicated._id, 'Offer Duplicated', req.user._id, 'Offer duplicated from previous version');
    await addHistoryEntry(duplicated._id, 1, 'Offer duplicated', req.user._id);

    const populated = await Offer.findById(duplicated._id)
      .populate('applicationId')
      .populate('jobId')
      .populate('candidateId')
      .populate('recruiterId')
      .populate('companyId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Duplicate offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private (Recruiter)
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this offer' });
    }

    if (['accepted', 'withdrawn'].includes(offer.status)) {
      return res.status(400).json({ message: 'Cannot delete offer in current status' });
    }

    await Offer.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get offer analytics
// @route   GET /api/offers/analytics
// @access  Private (Recruiter)
export const getOfferAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};
    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOffers,
      pendingOffers,
      acceptedOffers,
      rejectedOffers,
      expiredOffers,
      withdrawnOffers,
      viewedOffers,
      negotiationOffers,
      weeklyOffers,
      monthlyOffers,
      avgAcceptanceTime
    ] = await Promise.all([
      Offer.countDocuments(matchQuery),
      Offer.countDocuments({ ...matchQuery, status: 'sent' }),
      Offer.countDocuments({ ...matchQuery, status: 'accepted' }),
      Offer.countDocuments({ ...matchQuery, status: 'rejected' }),
      Offer.countDocuments({ ...matchQuery, status: 'expired' }),
      Offer.countDocuments({ ...matchQuery, status: 'withdrawn' }),
      Offer.countDocuments({ ...matchQuery, status: 'viewed' }),
      Offer.countDocuments({ ...matchQuery, status: 'negotiation' }),
      Offer.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $week: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Offer.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Offer.aggregate([
        {
          $match: {
            ...matchQuery,
            status: 'accepted'
          }
        },
        {
          $group: {
            _id: null,
            avgDays: {
              $avg: {
                $divide: [
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      ])
    ]);

    const acceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOffers,
        pendingOffers,
        acceptedOffers,
        rejectedOffers,
        expiredOffers,
        withdrawnOffers,
        viewedOffers,
        negotiationOffers,
        acceptanceRate,
        weeklyOffers,
        monthlyOffers,
        avgAcceptanceTime: avgAcceptanceTime.length > 0 ? avgAcceptanceTime[0].avgDays.toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Get offer analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export offers to CSV
// @route   GET /api/offers/export
// @access  Private (Recruiter)
export const exportOffers = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};
    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    }

    const offers = await Offer.find(matchQuery)
      .populate('jobId', 'title')
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name')
      .populate('companyId', 'companyName');

    const headers = [
      'Offer Number',
      'Candidate Name',
      'Candidate Email',
      'Job Title',
      'Company',
      'Status',
      'Base Salary',
      'Currency',
      'Joining Date',
      'Expiry Date',
      'Issue Date',
      'Recruiter',
      'Created At'
    ];

    const rows = offers.map(offer => [
      offer.offerNumber,
      offer.candidateId?.name || '',
      offer.candidateId?.email || '',
      offer.jobId?.title || '',
      offer.companyId?.companyName || '',
      offer.status,
      offer.salary?.baseSalary || '',
      offer.salary?.currency || '',
      offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString() : '',
      offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : '',
      offer.issueDate ? new Date(offer.issueDate).toLocaleDateString() : '',
      offer.recruiterId?.name || '',
      offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=offers.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export offers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get offer templates
// @route   GET /api/offers/templates
// @access  Private (Recruiter)
export const getOfferTemplates = async (req, res) => {
  try {
    const templates = [
      { id: 'default', name: 'Default Offer Letter', description: 'Standard employment offer letter' },
      { id: 'software-engineer', name: 'Software Engineer', description: 'Offer letter for software engineering roles' },
      { id: 'ui-ux-designer', name: 'UI/UX Designer', description: 'Offer letter for design roles' },
      { id: 'backend-engineer', name: 'Backend Engineer', description: 'Offer letter for backend engineering roles' },
      { id: 'intern', name: 'Intern', description: 'Offer letter for internship positions' },
      { id: 'graduate-program', name: 'Graduate Program', description: 'Offer letter for graduate programs' },
      { id: 'senior-developer', name: 'Senior Developer', description: 'Offer letter for senior developer roles' }
    ];

    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send offer reminder
// @route   POST /api/offers/:id/remind
// @access  Private (Recruiter)
export const sendOfferReminder = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['sent', 'viewed', 'negotiation'].includes(offer.status)) {
      return res.status(400).json({ message: 'Cannot send reminder for this offer status' });
    }

    const candidate = await User.findById(offer.candidateId);
    if (candidate && candidate.email) {
      const populated = await Offer.findById(offer._id)
        .populate('jobId')
        .populate('companyId')
        .populate('candidateId');
      await sendOfferUpdatedEmail(candidate.email, candidate.name, populated, 'Offer Reminder');
    }

    await addTimelineEntry(offer._id, 'Reminder Sent', req.user._id, 'Reminder sent to candidate');

    await createNotification({
      recipientId: offer.candidateId,
      senderId: req.user._id,
      title: 'Offer Reminder',
      message: `Reminder: Your offer for ${offer.jobId?.title || 'the position'} is pending response`,
      type: 'offer-updated',
      category: 'offer',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's offers
// @route   GET /api/student/offers
// @access  Private (Student)
export const getStudentOffers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      sort = 'newest'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const studentId = req.user._id;

    let matchQuery = { candidateId: studentId };

    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    let pipeline = [
      { $match: matchQuery },
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
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'companyData'
        }
      },
      { $unwind: { path: '$companyData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'recruiterId',
          foreignField: '_id',
          as: 'recruiterData'
        }
      },
      { $unwind: '$recruiterData' }
    ];

    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'expiry-asc':
        sortOption = { expiryDate: 1 };
        break;
      case 'expiry-desc':
        sortOption = { expiryDate: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortOption });

    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Offer.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const offers = await Offer.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get student offers error:', error);
    res.status(500).json({ message: error.message });
  }
};
