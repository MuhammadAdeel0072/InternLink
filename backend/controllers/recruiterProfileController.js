import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SKILLS = 30;
const MAX_LANGUAGES = 20;
const MAX_HEADLINE = 120;
const MAX_ABOUT = 1000;
const MAX_PHONE = 20;

const isValidUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\s+/g, ' ').trim();
};

const isPhoneValid = (phone) => {
  if (!phone) return true;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
};

const calculateRecruiterCompletion = (profile) => {
  const checks = [
    { weight: 10, passed: !!(profile.avatar && profile.avatar.length > 0) },
    { weight: 10, passed: !!(profile.cover && profile.cover.length > 0) },
    { weight: 10, passed: !!(profile.headline && profile.headline.trim().length > 0) },
    { weight: 10, passed: !!(profile.summary && profile.summary.trim().length > 0) },
    { weight: 10, passed: !!(profile.jobTitle && profile.jobTitle.trim().length > 0) },
    { weight: 5, passed: !!(profile.department && profile.department.trim().length > 0) },
    { weight: 5, passed: profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null && profile.yearsOfExperience !== '' },
    { weight: 10, passed: !!(profile.skills && profile.skills.length > 0) },
    { weight: 5, passed: !!(profile.languages && profile.languages.length > 0) },
    { weight: 5, passed: !!(profile.phone && profile.phone.trim().length > 0) },
    { weight: 5, passed: !!(profile.location?.country || profile.location?.city || profile.locationString) },
    { weight: 10, passed: !!(profile.linkedin && profile.linkedin.trim().length > 0) },
    { weight: 10, passed: !!(profile.visibility && ['public', 'connections-only', 'recruiters-only', 'private'].includes(profile.visibility)) },
  ];

  const total = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return Math.min(total, 100);
};

export const getRecruiterProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'name email role isVerified preferences');

    if (!profile) {
      const newProfile = await Profile.create({
        user: req.user._id,
        email: req.user.email,
        skills: [],
        languages: [],
        visibility: 'public',
      });
      const populated = await Profile.findById(newProfile._id)
        .populate('user', 'name email role isVerified preferences');
      return res.status(201).json({
        ...populated.toObject(),
        completionPercentage: calculateRecruiterCompletion(populated),
      });
    }

    const profileObj = profile.toObject();
    res.status(200).json({
      ...profileObj,
      completionPercentage: calculateRecruiterCompletion(profileObj),
    });
  } catch (error) {
    console.error('Get recruiter profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateRecruiterProfile = async (req, res) => {
  try {
    const {
      headline,
      summary,
      phone,
      country,
      city,
      stateProvince,
      jobTitle,
      department,
      yearsOfExperience,
      linkedin,
      visibility,
      firstName,
      lastName,
      skills,
      languages,
    } = req.body;

    const profileFields = {};

    if (firstName !== undefined || lastName !== undefined) {
      const currentName = req.user.name || '';
      const parts = currentName.split(' ');
      const currentFirstName = parts[0] || '';
      const currentLastName = parts.slice(1).join(' ') || '';
      
      const newFirstName = firstName !== undefined ? firstName.trim() : currentFirstName;
      const newLastName = lastName !== undefined ? lastName.trim() : currentLastName;
      
      if (newFirstName || newLastName) {
        req.user.name = `${newFirstName} ${newLastName}`.trim();
        await req.user.save({ validateBeforeSave: false });
      }
    }

    if (headline !== undefined) {
      if (typeof headline === 'string' && headline.length > MAX_HEADLINE) {
        return res.status(400).json({ message: `Professional headline cannot exceed ${MAX_HEADLINE} characters` });
      }
      profileFields.headline = headline;
    }

    if (summary !== undefined) {
      if (typeof summary === 'string' && summary.length > MAX_ABOUT) {
        return res.status(400).json({ message: `About cannot exceed ${MAX_ABOUT} characters` });
      }
      profileFields.summary = summary;
    }

    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone && !isPhoneValid(normalizedPhone)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
      profileFields.phone = normalizedPhone;
    }

    if (country !== undefined || city !== undefined || stateProvince !== undefined) {
      profileFields.location = {};
      if (country !== undefined) profileFields.location.country = country;
      if (city !== undefined) profileFields.location.city = city;
      if (stateProvince !== undefined) profileFields.location.stateProvince = stateProvince;
    }

    if (jobTitle !== undefined) profileFields.jobTitle = jobTitle;
    if (department !== undefined) profileFields.department = department;
    if (yearsOfExperience !== undefined) {
      const num = Number(yearsOfExperience);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ message: 'Years of experience must be a valid number' });
      }
      profileFields.yearsOfExperience = num;
    }
    if (linkedin !== undefined) {
      if (linkedin && !isValidUrl(linkedin)) {
        return res.status(400).json({ message: 'Please enter a valid LinkedIn URL' });
      }
      profileFields.linkedin = linkedin;
    }
    if (visibility !== undefined) {
      const allowedVisibility = ['public', 'connections-only', 'recruiters-only', 'private'];
      if (!allowedVisibility.includes(visibility)) {
        return res.status(400).json({ message: 'Invalid visibility option' });
      }
      profileFields.visibility = visibility;
    }

    if (skills !== undefined) {
      let skillsArray = Array.isArray(skills) ? skills : [];
      const uniqueSkills = [];
      const seen = new Set();
      for (const skill of skillsArray) {
        const name = typeof skill === 'string' ? skill.trim() : skill.name?.trim();
        if (!name) continue;
        if (seen.has(name.toLowerCase())) continue;
        if (uniqueSkills.length >= MAX_SKILLS) break;
        seen.add(name.toLowerCase());
        uniqueSkills.push(typeof skill === 'string' ? { name, proficiency: 'intermediate', pinned: false, order: uniqueSkills.length } : { ...skill, name, order: uniqueSkills.length });
      }
      profileFields.skills = uniqueSkills;
    }

    if (languages !== undefined) {
      let languagesArray = Array.isArray(languages) ? languages : [];
      const uniqueLanguages = [];
      const seenLangs = new Set();
      for (const lang of languagesArray) {
        const name = typeof lang === 'string' ? lang.trim() : lang.name?.trim();
        if (!name) continue;
        if (seenLangs.has(name.toLowerCase())) continue;
        if (uniqueLanguages.length >= MAX_LANGUAGES) break;
        seenLangs.add(name.toLowerCase());
        uniqueLanguages.push(typeof lang === 'string' ? { name, proficiency: 'conversational' } : { name, proficiency: lang.proficiency || 'conversational' });
      }
      profileFields.languages = uniqueLanguages;
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true, runValidators: true }
      ).populate('user', 'name email role isVerified preferences');
      
      const profileObj = profile.toObject();
      return res.status(200).json({
        ...profileObj,
        completionPercentage: calculateRecruiterCompletion(profileObj),
      });
    } else {
      profileFields.user = req.user._id;
      profileFields.email = req.user.email;
      profile = new Profile(profileFields);
      await profile.save();
      const populated = await Profile.findById(profile._id)
        .populate('user', 'name email role isVerified preferences');
      const profileObj = populated.toObject();
      return res.status(201).json({
        ...profileObj,
        completionPercentage: calculateRecruiterCompletion(profileObj),
      });
    }
  } catch (error) {
    console.error('Update recruiter profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadRecruiterAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' });
    }
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'Image size cannot exceed 5MB' });
    }
    const fileUrl = await uploadToCloudinary(req.file);
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { avatar: fileUrl } },
      { new: true }
    ).populate('user', 'name email role isVerified preferences');
    
    // Synchronize the avatar field in the User model
    await User.findByIdAndUpdate(req.user._id, { $set: { avatar: fileUrl } });
    
    const profileObj = profile.toObject();
    res.status(200).json({
      ...profileObj,
      completionPercentage: calculateRecruiterCompletion(profileObj),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadRecruiterCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' });
    }
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'Image size cannot exceed 5MB' });
    }
    const fileUrl = await uploadToCloudinary(req.file);
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { cover: fileUrl } },
      { new: true }
    ).populate('user', 'name email role isVerified preferences');
    const profileObj = profile.toObject();
    res.status(200).json({
      ...profileObj,
      completionPercentage: calculateRecruiterCompletion(profileObj),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeRecruiterAvatar = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { avatar: '' } },
      { new: true }
    ).populate('user', 'name email role isVerified preferences');
    
    // Synchronize the avatar field in the User model
    await User.findByIdAndUpdate(req.user._id, { $set: { avatar: '' } });
    
    const profileObj = profile.toObject();
    res.status(200).json({
      ...profileObj,
      completionPercentage: calculateRecruiterCompletion(profileObj),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeRecruiterCover = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { cover: '' } },
      { new: true }
    ).populate('user', 'name email role isVerified preferences');
    const profileObj = profile.toObject();
    res.status(200).json({
      ...profileObj,
      completionPercentage: calculateRecruiterCompletion(profileObj),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRecruiterPreferences = async (req, res) => {
  try {
    const { allowMessages, allowConnectionRequests, showEmail, showPhone, profileVisibility } = req.body;

    if (profileVisibility !== undefined) {
      const allowedVisibility = ['public', 'connections-only', 'recruiters-only', 'private'];
      if (!allowedVisibility.includes(profileVisibility)) {
        return res.status(400).json({ message: 'Invalid visibility option' });
      }
    }

    const updates = {};
    if (allowMessages !== undefined) updates['preferences.privacy.allowMessages'] = allowMessages;
    if (allowConnectionRequests !== undefined) updates['preferences.privacy.allowConnectionRequests'] = allowConnectionRequests;
    if (showEmail !== undefined) updates['preferences.privacy.showEmail'] = showEmail;
    if (showPhone !== undefined) updates['preferences.privacy.showPhone'] = showPhone;
    if (profileVisibility !== undefined) updates['preferences.privacy.profileVisibility'] = profileVisibility;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Contact preferences updated successfully',
      data: user.preferences,
    });
  } catch (error) {
    console.error('Update recruiter preferences error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRecruiterCompletion = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(200).json({ completionPercentage: 0, checks: [] });
    }

    const profileObj = profile.toObject();
    const percentage = calculateRecruiterCompletion(profileObj);

    const checks = [
      { key: 'avatar', label: 'Profile Photo', weight: 10, passed: !!(profileObj.avatar && profileObj.avatar.length > 0) },
      { key: 'cover', label: 'Cover Image', weight: 10, passed: !!(profileObj.cover && profileObj.cover.length > 0) },
      { key: 'headline', label: 'Professional Headline', weight: 10, passed: !!(profileObj.headline && profileObj.headline.trim().length > 0) },
      { key: 'summary', label: 'About', weight: 10, passed: !!(profileObj.summary && profileObj.summary.trim().length > 0) },
      { key: 'jobTitle', label: 'Job Title', weight: 10, passed: !!(profileObj.jobTitle && profileObj.jobTitle.trim().length > 0) },
      { key: 'department', label: 'Department', weight: 5, passed: !!(profileObj.department && profileObj.department.trim().length > 0) },
      { key: 'yearsOfExperience', label: 'Years of Experience', weight: 5, passed: profileObj.yearsOfExperience !== undefined && profileObj.yearsOfExperience !== null && profileObj.yearsOfExperience !== '' },
      { key: 'skills', label: 'Skills', weight: 10, passed: !!(profileObj.skills && profileObj.skills.length > 0) },
      { key: 'languages', label: 'Languages', weight: 5, passed: !!(profileObj.languages && profileObj.languages.length > 0) },
      { key: 'phone', label: 'Phone Number', weight: 5, passed: !!(profileObj.phone && profileObj.phone.trim().length > 0) },
      { key: 'location', label: 'Location', weight: 5, passed: !!(profileObj.location?.country || profileObj.location?.city || profileObj.locationString) },
      { key: 'linkedin', label: 'LinkedIn Profile', weight: 10, passed: !!(profileObj.linkedin && profileObj.linkedin.trim().length > 0) },
      { key: 'visibility', label: 'Profile Visibility', weight: 10, passed: !!(profileObj.visibility && ['public', 'connections-only', 'recruiters-only', 'private'].includes(profileObj.visibility)) },
    ];

    res.status(200).json({ completionPercentage: percentage, checks });
  } catch (error) {
    console.error('Get recruiter completion error:', error);
    res.status(500).json({ message: error.message });
  }
};
