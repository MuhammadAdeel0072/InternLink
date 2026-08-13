import Hiring from '../models/Hiring.js';
import Offer from '../models/Offer.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { createNotification } from '../services/notificationService.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import { escapeRegExp } from '../utils/regex.js';

const addTimelineEntry = async (hiringId, action, performedBy, note = '') => {
  await Hiring.findByIdAndUpdate(hiringId, {
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

const generateEmployeeId = async (companyId) => {
  const count = await Hiring.countDocuments({ companyId });
  const prefix = companyId ? companyId.toString().slice(-3).toUpperCase() : 'EMP';
  return `EMP-${prefix}-${String(count + 1).padStart(5, '0')}`;
};

const generateEmployeeCode = async (companyId) => {
  const count = await Hiring.countDocuments({ companyId });
  const prefix = companyId ? companyId.toString().slice(-2).toUpperCase() : 'EC';
  return `EC-${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all hired candidates for recruiter
// @route   GET /api/hiring
// @access  Private (Recruiter)
export const getHirings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      department = '',
      joiningDate = '',
      recruiterId = 'all',
      companyId = 'all',
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

    if (department) {
      matchQuery.department = department;
    }

    if (joiningDate) {
      const selectedDate = new Date(joiningDate);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      matchQuery.joiningDate = { $gte: selectedDate, $lt: nextDate };
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
          localField: 'manager',
          foreignField: '_id',
          as: 'managerData'
        }
      },
      { $unwind: { path: '$managerData', preserveNullAndEmptyArrays: true } }
    ];

    const sanitizedSearch = search ? escapeRegExp(search) : null;

    if (sanitizedSearch) {
      pipeline.push({
        $match: {
          $or: [
            { 'candidateData.name': { $regex: sanitizedSearch, $options: 'i' } },
            { 'candidateData.email': { $regex: sanitizedSearch, $options: 'i' } },
            { 'jobData.title': { $regex: sanitizedSearch, $options: 'i' } },
            { department: { $regex: sanitizedSearch, $options: 'i' } },
            { employeeId: { $regex: sanitizedSearch, $options: 'i' } },
            { employeeCode: { $regex: sanitizedSearch, $options: 'i' } },
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
      case 'joining-asc':
        sortOption = { joiningDate: 1 };
        break;
      case 'joining-desc':
        sortOption = { joiningDate: -1 };
        break;
      case 'name-asc':
        sortOption = { 'candidateData.name': 1 };
        break;
      case 'name-desc':
        sortOption = { 'candidateData.name': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortOption });

    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Hiring.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const hirings = await Hiring.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: hirings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get hirings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hiring details
// @route   GET /api/hiring/:id
// @access  Private
export const getHiringDetails = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id)
      .populate('candidateId', 'name email phone avatar')
      .populate('offerId')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email');

    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole === 'recruiter' && hiring.recruiterId._id?.toString() !== userId && hiring.candidateId._id?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this hiring record' });
    }

    if (userRole === 'student' && hiring.candidateId._id?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this hiring record' });
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Get hiring details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create hiring record from accepted offer
// @route   POST /api/hiring
// @access  Private (Recruiter)
export const createHiring = async (req, res) => {
  try {
    const {
      offerId,
      candidateId,
      jobId,
      companyId,
      department,
      manager,
      joiningDate,
      reportingTime,
      officeLocation,
      workType,
      team
    } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only create hiring record from accepted offer' });
    }

    const existingHiring = await Hiring.findOne({ offerId });
    if (existingHiring) {
      return res.status(400).json({ message: 'Hiring record already exists for this offer' });
    }

    const job = await Job.findById(jobId || offer.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const resolvedCompanyId = companyId || job.companyId || offer.companyId || null;
    const resolvedManager = manager || offer.manager || '';
    const resolvedTeam = team || offer.team || '';
    const resolvedJoiningDate = joiningDate || offer.joiningDate;
    const resolvedReportingTime = reportingTime || offer.reportingTime || '09:00 AM';
    const resolvedOfficeLocation = officeLocation || offer.officeLocation || '';
    const resolvedWorkType = workType || 'On-site';
    const resolvedDepartment = department || job.department || '';

    const employeeId = await generateEmployeeId(resolvedCompanyId);
    const employeeCode = await generateEmployeeCode(resolvedCompanyId);

    const requiredDocuments = Hiring.getRequiredDocuments();
    const checklistTasks = Hiring.getChecklistTasks();

    const documents = requiredDocuments.map(docName => ({
      documentName: docName,
      status: 'pending',
      uploadedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      note: ''
    }));

    const checklist = checklistTasks.map(task => ({
      task: task.label,
      key: task.key,
      completed: false,
      completedAt: null,
      performedBy: null
    }));

    const hiring = await Hiring.create({
      candidateId,
      offerId,
      jobId: job._id,
      companyId: resolvedCompanyId,
      recruiterId: req.user._id,
      applicationId: offer.applicationId || null,
      employeeId,
      employeeCode,
      employeeStatus: 'pending',
      department: resolvedDepartment,
      manager: resolvedManager ? (typeof resolvedManager === 'object' ? resolvedManager._id : resolvedManager) : null,
      managerName: typeof resolvedManager === 'string' ? resolvedManager : '',
      team: resolvedTeam,
      workType: resolvedWorkType,
      joiningDate: resolvedJoiningDate ? new Date(resolvedJoiningDate) : null,
      reportingTime: resolvedReportingTime,
      officeLocation: resolvedOfficeLocation,
      documents,
      checklist,
      timeline: [],
      status: 'offer-accepted',
      joiningRemindersSent: []
    });

    await addTimelineEntry(hiring._id, 'Hiring Created', req.user._id, 'Hiring record created from accepted offer');

    const populated = await Hiring.findById(hiring._id)
      .populate('candidateId', 'name email phone avatar')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email');

    await createNotification({
      recipientId: offer.candidateId,
      senderId: req.user._id,
      title: 'Hiring Record Created',
      message: `Your hiring record has been created for ${job.title} at ${offer.companyId?.companyName || 'the company'}.`,
      type: 'hiring-created',
      category: 'hiring',
      entityId: offer._id,
      entityType: 'offer',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create hiring error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update hiring record
// @route   PUT /api/hiring/:id
// @access  Private (Recruiter)
export const updateHiring = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this hiring record' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.candidateId;
    delete updates.offerId;
    delete updates.jobId;
    delete updates.companyId;
    delete updates.recruiterId;
    delete updates.employeeId;
    delete updates.employeeCode;
    delete updates.employeeStatus;
    delete updates.documents;
    delete updates.checklist;
    delete updates.timeline;
    delete updates.createdAt;
    delete updates.updatedAt;

    Object.assign(hiring, updates);
    await hiring.save();

    await addTimelineEntry(hiring._id, 'Hiring Updated', req.user._id, 'Hiring record updated');

    const populated = await Hiring.findById(hiring._id)
      .populate('candidateId', 'name email phone avatar')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Update hiring error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate employee ID
// @route   POST /api/hiring/:id/generate-employee-id
// @access  Private (Recruiter)
export const generateEmployeeIdAction = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (hiring.employeeId) {
      return res.status(400).json({ message: 'Employee ID already generated' });
    }

    hiring.employeeId = await generateEmployeeId(hiring.companyId);
    hiring.employeeCode = await generateEmployeeCode(hiring.companyId);
    hiring.employeeStatus = 'pending';
    await hiring.save();

    await addTimelineEntry(hiring._id, 'Employee ID Generated', req.user._id, `Employee ID: ${hiring.employeeId}`);

    await createNotification({
      recipientId: hiring.candidateId,
      senderId: req.user._id,
      title: 'Employee ID Generated',
      message: `Your Employee ID has been generated: ${hiring.employeeId}`,
      type: 'hiring-created',
      category: 'hiring',
      entityId: hiring._id,
      entityType: 'hiring',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Generate employee ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload document for hiring
// @route   POST /api/hiring/:id/documents
// @access  Private (Student)
export const uploadDocument = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (req.user.role === 'student' && hiring.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { documentName, fileUrl } = req.body;

    const docIndex = hiring.documents.findIndex(
      d => d.documentName === documentName
    );

    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document type not found in required documents' });
    }

    hiring.documents[docIndex].fileUrl = fileUrl || hiring.documents[docIndex].fileUrl;
    hiring.documents[docIndex].status = 'uploaded';
    hiring.documents[docIndex].uploadedAt = new Date();

    await hiring.save();

    await addTimelineEntry(hiring._id, 'Document Uploaded', req.user._id, `${documentName} uploaded`);

    const allUploaded = hiring.documents.every(d => d.status === 'uploaded' || d.status === 'verified');
    if (allUploaded && hiring.status === 'pending-documents') {
      hiring.status = 'documents-verified';
      await hiring.save();
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify document
// @route   PUT /api/hiring/:id/documents/:docIndex/verify
// @access  Private (Recruiter)
export const verifyDocument = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const docIndex = parseInt(req.params.docIndex);
    if (docIndex < 0 || docIndex >= hiring.documents.length) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    const { action, note } = req.body;

    if (action === 'verify') {
      hiring.documents[docIndex].status = 'verified';
      hiring.documents[docIndex].verifiedAt = new Date();
      hiring.documents[docIndex].verifiedBy = req.user._id;
      hiring.documents[docIndex].note = note || '';
    } else if (action === 'reject') {
      hiring.documents[docIndex].status = 'rejected';
      hiring.documents[docIndex].verifiedAt = new Date();
      hiring.documents[docIndex].verifiedBy = req.user._id;
      hiring.documents[docIndex].note = note || 'Document rejected';
    } else if (action === 'request-reupload') {
      hiring.documents[docIndex].status = 'requested';
      hiring.documents[docIndex].note = note || 'Please re-upload this document';
    }

    await hiring.save();

    const actionLabel = action === 'verify' ? 'Document Verified' : action === 'reject' ? 'Document Rejected' : 'Re-upload Requested';
    await addTimelineEntry(hiring._id, actionLabel, req.user._id, `${hiring.documents[docIndex].documentName}: ${note || ''}`);

    if (action === 'reject' || action === 'request-reupload') {
      await createNotification({
        recipientId: hiring.candidateId,
        senderId: req.user._id,
        title: 'Document Action Required',
        message: `Document "${hiring.documents[docIndex].documentName}" requires your attention`,
        type: action === 'reject' ? 'document-rejected' : 'document-requested',
        category: 'hiring',
        entityId: hiring._id,
        entityType: 'hiring',
        io: req.io,
        userSocketMap: req.userSocketMap
      });
    }

    const allVerified = hiring.documents.every(d => d.status === 'verified');
    if (allVerified && hiring.status === 'pending-documents') {
      hiring.status = 'documents-verified';
      await hiring.save();
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update checklist task
// @route   PUT /api/hiring/:id/checklist
// @access  Private (Recruiter)
export const updateChecklist = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { key, completed } = req.body;

    const checklistItem = hiring.checklist.find(item => item.key === key);
    if (!checklistItem) {
      return res.status(404).json({ message: 'Checklist task not found' });
    }

    checklistItem.completed = completed;
    checklistItem.completedAt = completed ? new Date() : null;
    checklistItem.performedBy = completed ? req.user._id : null;

    await hiring.save();

    await addTimelineEntry(
      hiring._id,
      completed ? 'Checklist Completed' : 'Checklist Uncompleted',
      req.user._id,
      `${checklistItem.task}: ${completed ? 'Completed' : 'Marked incomplete'}`
    );

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send welcome email
// @route   POST /api/hiring/:id/send-welcome-email
// @access  Private (Recruiter)
export const sendWelcomeEmailAction = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('companyId', 'companyName')
      .populate('jobId', 'title')
      .populate('manager', 'name email');

    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (hiring.welcomeEmailSent) {
      return res.status(400).json({ message: 'Welcome email already sent' });
    }

    const candidate = hiring.candidateId;
    const company = hiring.companyId;
    const job = hiring.jobId;
    const manager = hiring.manager;

    if (candidate && candidate.email) {
      await sendWelcomeEmail(
        candidate.email,
        candidate.name,
        {
          companyData: { companyName: company?.companyName || '' },
          jobData: { title: job?.title || '' },
          department: hiring.department || '',
          managerData: { name: manager?.name || hiring.managerName || '' },
          joiningDate: hiring.joiningDate,
          reportingTime: hiring.reportingTime || '09:00 AM',
          officeLocation: hiring.officeLocation || ''
        }
      );
    }

    hiring.welcomeEmailSent = true;
    hiring.welcomeEmailSentAt = new Date();
    await hiring.save();

    await addTimelineEntry(hiring._id, 'Welcome Email Sent', req.user._id, 'Welcome email sent to candidate');

    await createNotification({
      recipientId: hiring.candidateId,
      senderId: req.user._id,
      title: 'Welcome Email Sent',
      message: 'A welcome email has been sent to you with onboarding details.',
      type: 'welcome-email-sent',
      category: 'hiring',
      entityId: hiring._id,
      entityType: 'hiring',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({ success: true, message: 'Welcome email sent successfully', data: hiring });
  } catch (error) {
    console.error('Send welcome email error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign manager
// @route   PUT /api/hiring/:id/manager
// @access  Private (Recruiter)
export const assignManager = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { manager, team } = req.body;

    hiring.manager = manager;
    if (team) hiring.team = team;

    const managerUser = await User.findById(manager);
    hiring.managerName = managerUser?.name || '';

    await hiring.save();

    await addTimelineEntry(hiring._id, 'Manager Assigned', req.user._id, `Manager: ${managerUser?.name || manager}`);

    await createNotification({
      recipientId: hiring.candidateId,
      senderId: req.user._id,
      title: 'Manager Assigned',
      message: `Your reporting manager has been assigned: ${managerUser?.name || manager}`,
      type: 'manager-assigned',
      category: 'hiring',
      entityId: hiring._id,
      entityType: 'hiring',
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign office/equipment
// @route   PUT /api/hiring/:id/assignment
// @access  Private (Recruiter)
export const assignOfficeAndEquipment = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { officeAssignment, equipmentAssignment } = req.body;

    if (officeAssignment) {
      hiring.officeAssignment = { ...hiring.officeAssignment, ...officeAssignment };
    }

    if (equipmentAssignment) {
      hiring.equipmentAssignment = { ...hiring.equipmentAssignment, ...equipmentAssignment };
    }

    await hiring.save();

    await addTimelineEntry(hiring._id, 'Office & Equipment Assigned', req.user._id, 'Office and equipment assignment updated');

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Assign office/equipment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update onboarding status
// @route   PUT /api/hiring/:id/status
// @access  Private (Recruiter)
export const updateStatus = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status } = req.body;

    const validStatuses = [
      'offer-accepted',
      'pending-documents',
      'documents-verified',
      'joining-scheduled',
      'joined',
      'onboarding',
      'completed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const previousStatus = hiring.status;
    hiring.status = status;

    if (status === 'joined') {
      hiring.employeeStatus = 'joined';
    } else if (status === 'completed') {
      hiring.employeeStatus = 'confirmed';
    }

    await hiring.save();

    await addTimelineEntry(hiring._id, 'Status Updated', req.user._id, `Status changed from ${previousStatus} to ${status}`);

    if (status === 'joined') {
      await createNotification({
        recipientId: hiring.candidateId,
        senderId: req.user._id,
        title: 'Welcome to the Team',
        message: 'Welcome to the team! Your onboarding is now in progress.',
        type: 'employee-joined',
        category: 'hiring',
        entityId: hiring._id,
        entityType: 'hiring',
        io: req.io,
        userSocketMap: req.userSocketMap
      });
    }

    if (status === 'completed') {
      await createNotification({
        recipientId: hiring.candidateId,
        senderId: req.user._id,
        title: 'Onboarding Completed',
        message: 'Your onboarding has been completed. Welcome aboard!',
        type: 'onboarding-completed',
        category: 'hiring',
        entityId: hiring._id,
        entityType: 'hiring',
        io: req.io,
        userSocketMap: req.userSocketMap
      });
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hiring statistics
// @route   GET /api/hiring/stats
// @access  Private (Recruiter)
export const getHiringStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let matchQuery = {};
    if (userRole === 'recruiter') {
      matchQuery.recruiterId = userId;
    }

    const [
      pendingJoining,
      joiningThisWeek,
      documentsPending,
      onboardingInProgress,
      employeesJoined,
      completedOnboarding
    ] = await Promise.all([
      Hiring.countDocuments({ ...matchQuery, status: 'offer-accepted' }),
      Hiring.countDocuments({
        ...matchQuery,
        status: 'joining-scheduled',
        joiningDate: { $gte: new Date(), $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }),
      Hiring.countDocuments({ ...matchQuery, status: 'pending-documents' }),
      Hiring.countDocuments({ ...matchQuery, status: 'onboarding' }),
      Hiring.countDocuments({ ...matchQuery, status: 'joined' }),
      Hiring.countDocuments({ ...matchQuery, status: 'completed' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingJoining,
        joiningThisWeek,
        documentsPending,
        onboardingInProgress,
        employeesJoined,
        completedOnboarding
      }
    });
  } catch (error) {
    console.error('Get hiring stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hiring timeline
// @route   GET /api/hiring/:id/timeline
// @access  Private
export const getHiringTimeline = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id).select('timeline status');
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole === 'recruiter' && hiring.timeline.length > 0) {
      const firstEntry = hiring.timeline[0];
      const hiringRecord = await Hiring.findById(req.params.id);
      if (hiringRecord.recruiterId.toString() !== userId && hiringRecord.candidateId.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (userRole === 'student' && hiring.candidateId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: hiring.timeline });
  } catch (error) {
    console.error('Get hiring timeline error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get onboarding checklist progress
// @route   GET /api/hiring/:id/checklist
// @access  Private
export const getChecklistProgress = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id).select('checklist status');
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole === 'recruiter') {
      const hiringRecord = await Hiring.findById(req.params.id);
      if (hiringRecord.recruiterId.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (userRole === 'student' && hiring.candidateId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const totalTasks = hiring.checklist.length;
    const completedTasks = hiring.checklist.filter(item => item.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        checklist: hiring.checklist,
        totalTasks,
        completedTasks,
        progress,
        currentStatus: hiring.status
      }
    });
  } catch (error) {
    console.error('Get checklist progress error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student onboarding data
// @route   GET /api/student/onboarding
// @access  Private (Student)
export const getStudentOnboarding = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { status = 'all' } = req.query;

    let matchQuery = { candidateId: studentId };
    if (status !== 'all') {
      matchQuery.status = status;
    }

    const hirings = await Hiring.find(matchQuery)
      .populate('offerId', 'offerNumber status joiningDate')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: hirings });
  } catch (error) {
    console.error('Get student onboarding error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student onboarding by ID
// @route   GET /api/student/onboarding/:id
// @access  Private (Student)
export const getStudentOnboardingById = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id)
      .populate('offerId')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email');

    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Get student onboarding error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request document re-upload (student)
// @route   POST /api/student/onboarding/:id/documents/request
// @access  Private (Student)
export const requestDocumentReupload = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { documentName, note } = req.body;

    const docIndex = hiring.documents.findIndex(d => d.documentName === documentName);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    hiring.documents[docIndex].status = 'requested';
    hiring.documents[docIndex].note = note || 'Re-upload requested by student';
    await hiring.save();

    await addTimelineEntry(hiring._id, 'Document Re-upload Requested', req.user._id, `${documentName}: ${note || ''}`);

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Request re-upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get onboarding reminders for student
// @route   GET /api/student/onboarding/reminders
// @access  Private (Student)
export const getOnboardingReminders = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    const hirings = await Hiring.find({
      candidateId: studentId,
      joiningDate: { $gte: now },
      status: { $in: ['joining-scheduled', 'joined', 'onboarding'] }
    }).populate('jobId', 'title').populate('companyId', 'companyName');

    const reminders = [];

    for (const hiring of hirings) {
      const joiningDate = new Date(hiring.joiningDate);
      const daysUntilJoining = Math.ceil((joiningDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilJoining === 7 && !hiring.joiningRemindersSent.find(r => r.type === '7d')) {
        reminders.push({
          hiringId: hiring._id,
          type: '7d',
          message: `Reminder: You start in 7 days at ${hiring.companyId?.companyName || 'the company'}`,
          joiningDate: hiring.joiningDate,
          companyName: hiring.companyId?.companyName || '',
          jobTitle: hiring.jobId?.title || ''
        });
      } else if (daysUntilJoining === 3 && !hiring.joiningRemindersSent.find(r => r.type === '3d')) {
        reminders.push({
          hiringId: hiring._id,
          type: '3d',
          message: `Reminder: You start in 3 days at ${hiring.companyId?.companyName || 'the company'}`,
          joiningDate: hiring.joiningDate,
          companyName: hiring.companyId?.companyName || '',
          jobTitle: hiring.jobId?.title || ''
        });
      } else if (daysUntilJoining === 1 && !hiring.joiningRemindersSent.find(r => r.type === '1d')) {
        reminders.push({
          hiringId: hiring._id,
          type: '1d',
          message: `Reminder: You start tomorrow at ${hiring.companyId?.companyName || 'the company'}`,
          joiningDate: hiring.joiningDate,
          companyName: hiring.companyId?.companyName || '',
          jobTitle: hiring.jobId?.title || ''
        });
      }
    }

    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    console.error('Get onboarding reminders error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark joining reminder as sent
// @route   POST /api/hiring/:id/reminder-sent
// @access  Private (Recruiter)
export const markReminderSent = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { type } = req.body;

    if (!hiring.joiningRemindersSent.find(r => r.type === type)) {
      hiring.joiningRemindersSent.push({ type, sentAt: new Date() });
      await hiring.save();
    }

    res.status(200).json({ success: true, message: 'Reminder marked as sent' });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hiring by offer ID
// @route   GET /api/hiring/by-offer/:offerId
// @access  Private
export const getHiringByOfferId = async (req, res) => {
  try {
    const hiring = await Hiring.findOne({ offerId: req.params.offerId })
      .populate('candidateId', 'name email phone avatar')
      .populate('jobId', 'title department location')
      .populate('companyId', 'companyName')
      .populate('recruiterId', 'name email')
      .populate('manager', 'name email');

    if (!hiring) {
      return res.status(404).json({ message: 'No hiring record found for this offer' });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole === 'recruiter' && hiring.recruiterId._id?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (userRole === 'student' && hiring.candidateId._id?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: hiring });
  } catch (error) {
    console.error('Get hiring by offer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete hiring record
// @route   DELETE /api/hiring/:id
// @access  Private (Recruiter)
export const deleteHiring = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) {
      return res.status(404).json({ message: 'Hiring record not found' });
    }

    if (hiring.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Hiring.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Hiring record deleted successfully' });
  } catch (error) {
    console.error('Delete hiring error:', error);
    res.status(500).json({ message: error.message });
  }
};