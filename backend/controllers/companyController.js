import Company from '../models/Company.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const MAX_COVER_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const isValidUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const searchCompanies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const companies = await Company.find({
      $or: [
        { companyName: searchRegex },
        { industry: searchRegex },
      ],
    })
      .select('companyName slug industry companySize headquarters verificationStatus logo createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      industry,
      website,
      companySize,
      description,
      headquarters,
      socialLinks,
      contactInformation,
      benefits,
    } = req.body;

    if (!companyName || !industry || !companySize) {
      return res.status(400).json({ message: 'Company name, industry, and company size are required' });
    }

    if (website && !isValidUrl(website)) {
      return res.status(400).json({ message: 'Please enter a valid website URL' });
    }

    const user = await User.findById(req.user._id);
    if (user.company) {
      return res.status(400).json({ message: 'You are already associated with a company. Please leave it first before creating a new one.' });
    }

    const slug = generateSlug(companyName);
    const existingCompany = await Company.findOne({ slug });
    if (existingCompany) {
      return res.status(400).json({ message: 'A company with this name already exists' });
    }

    const logoFile = req.files?.logo?.[0];
    const coverFile = req.files?.coverImage?.[0];

    let logoUrl = '';
    let coverUrl = '';

    if (logoFile) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

    if (coverFile) {
      coverUrl = await uploadToCloudinary(coverFile);
    }

    const company = await Company.create({
      companyName,
      slug,
      industry,
      website: website || '',
      companySize,
      description: description || '',
      logo: logoUrl,
      coverImage: coverUrl,
      headquarters: headquarters || {},
      socialLinks: socialLinks || {},
      contactInformation: contactInformation || {},
      benefits: benefits || [],
      createdBy: req.user._id,
      recruiters: [
        {
          userId: req.user._id,
          status: 'approved',
          joinedAt: new Date(),
        },
      ],
    });

    await User.findByIdAndUpdate(req.user._id, { company: company._id });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const joinCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const existingRecruiter = company.recruiters.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (existingRecruiter) {
      if (existingRecruiter.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending request to join this company' });
      }
      if (existingRecruiter.status === 'approved') {
        return res.status(400).json({ message: 'You are already associated with this company' });
      }
      if (existingRecruiter.status === 'rejected') {
        return res.status(400).json({ message: 'Your request to join this company was rejected' });
      }
    }

    const user = await User.findById(req.user._id);
    if (user.company) {
      return res.status(400).json({ message: 'You are already associated with another company. Please leave it first.' });
    }

    company.recruiters.push({
      userId: req.user._id,
      status: 'pending',
      joinedAt: new Date(),
    });

    await company.save();

    res.status(200).json({ success: true, message: 'Join request sent successfully', data: company });
  } catch (error) {
    console.error('Join company error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const cancelJoinRequest = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const recruiterIndex = company.recruiters.findIndex(
      (r) => r.userId.toString() === req.user._id.toString() && r.status === 'pending'
    );

    if (recruiterIndex === -1) {
      return res.status(400).json({ message: 'No pending request found for this company' });
    }

    company.recruiters.splice(recruiterIndex, 1);
    await company.save();

    await User.findByIdAndUpdate(req.user._id, { company: null });

    res.status(200).json({ success: true, message: 'Join request cancelled successfully' });
  } catch (error) {
    console.error('Cancel join request error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyCompanyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('company');
    if (!user.company) {
      return res.status(200).json({
        success: true,
        data: {
          hasCompany: false,
          company: null,
          status: null,
        },
      });
    }

    const company = await Company.findById(user.company);
    if (!company) {
      return res.status(200).json({
        success: true,
        data: {
          hasCompany: false,
          company: null,
          status: null,
        },
      });
    }

    const recruiterRecord = company.recruiters.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        hasCompany: true,
        company: {
          _id: company._id,
          companyName: company.companyName,
          slug: company.slug,
          industry: company.industry,
          companySize: company.companySize,
          headquarters: company.headquarters,
          logo: company.logo,
          verificationStatus: company.verificationStatus,
        },
        status: recruiterRecord ? recruiterRecord.status : 'approved',
      },
    });
  } catch (error) {
    console.error('Get company status error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a logo file' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isRecruiter = company.recruiters.some(
      (r) => r.userId.toString() === req.user._id.toString() && r.status === 'approved'
    );

    if (!isRecruiter && company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this company' });
    }

    const logoUrl = await uploadToCloudinary(req.file);
    company.logo = logoUrl;
    await company.save();

    res.status(200).json({ success: true, data: { logo: logoUrl } });
  } catch (error) {
    console.error('Upload company logo error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadCompanyCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a cover image file' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isRecruiter = company.recruiters.some(
      (r) => r.userId.toString() === req.user._id.toString() && r.status === 'approved'
    );

    if (!isRecruiter && company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this company' });
    }

    const coverUrl = await uploadToCloudinary(req.file);
    company.coverImage = coverUrl;
    await company.save();

    res.status(200).json({ success: true, data: { coverImage: coverUrl } });
  } catch (error) {
    console.error('Upload company cover error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const removeCompanyLogo = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isRecruiter = company.recruiters.some(
      (r) => r.userId.toString() === req.user._id.toString() && r.status === 'approved'
    );

    if (!isRecruiter && company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this company' });
    }

    company.logo = '';
    await company.save();

    res.status(200).json({ success: true, message: 'Logo removed successfully' });
  } catch (error) {
    console.error('Remove company logo error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const removeCompanyCover = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isRecruiter = company.recruiters.some(
      (r) => r.userId.toString() === req.user._id.toString() && r.status === 'approved'
    );

    if (!isRecruiter && company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this company' });
    }

    company.coverImage = '';
    await company.save();

    res.status(200).json({ success: true, message: 'Cover image removed successfully' });
  } catch (error) {
    console.error('Remove company cover error:', error);
    res.status(500).json({ message: error.message });
  }
};
