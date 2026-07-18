import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
export const getCurrentProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'name email role');

    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await Profile.create({
        user: req.user._id,
        email: req.user.email,
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        portfolioLinks: [],
      });
      profile = await Profile.findById(profile._id)
        .populate('user', 'name email role');
      return res.status(201).json(profile);
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profile/user/:userId
// @access  Public
export const getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate('user', 'name email role');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update basic profile details
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      headline, currentStatus, university, degree, major, graduationYear,
      summary, email, phone, website,
      country, city, postalCode, locationString,
      github, linkedin, visibility
    } = req.body;

    const profileFields = {};

    if (headline !== undefined) profileFields.headline = headline;
    if (currentStatus !== undefined) profileFields.currentStatus = currentStatus;
    if (university !== undefined) profileFields.university = university;
    if (degree !== undefined) profileFields.degree = degree;
    if (major !== undefined) profileFields.major = major;
    if (graduationYear !== undefined) profileFields.graduationYear = graduationYear;

    if (summary !== undefined) {
      if (summary.length > 1000) {
        return res.status(400).json({ message: 'Summary cannot exceed 1000 characters' });
      }
      profileFields.summary = summary;
    }

    if (email !== undefined) profileFields.email = email;
    if (phone !== undefined) profileFields.phone = phone;
    if (website !== undefined) profileFields.website = website;

    if (country !== undefined || city !== undefined || postalCode !== undefined) {
      profileFields.location = {};
      if (country !== undefined) profileFields.location.country = country;
      if (city !== undefined) profileFields.location.city = city;
      if (postalCode !== undefined) profileFields.location.postalCode = postalCode;
    }
    if (locationString !== undefined) profileFields.locationString = locationString;

    if (github !== undefined) profileFields.github = github;
    if (linkedin !== undefined) profileFields.linkedin = linkedin;
    if (visibility !== undefined) profileFields.visibility = visibility;

    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true, runValidators: true }
      ).populate('user', 'name email role');
      return res.status(200).json(profile);
    } else {
      profileFields.user = req.user._id;
      profile = new Profile(profileFields);
      await profile.save();
      const populatedProfile = await Profile.findById(profile._id)
        .populate('user', 'name email role');
      return res.status(201).json(populatedProfile);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile avatar image
// @route   POST /api/profile/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    const fileUrl = await uploadToCloudinary(req.file);
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { avatar: fileUrl } },
      { new: true }
    ).populate('user', 'name email role');
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile cover image
// @route   POST /api/profile/cover
// @access  Private
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    const fileUrl = await uploadToCloudinary(req.file);
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { cover: fileUrl } },
      { new: true }
    ).populate('user', 'name email role');
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload student resume PDF
// @route   POST /api/profile/resume
// @access  Private
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF document' });
    }
    const fileUrl = await uploadToCloudinary(req.file);
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { resume: fileUrl } },
      { new: true }
    ).populate('user', 'name email role');
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add education entry
// @route   POST /api/profile/education
// @access  Private
export const addEducation = async (req, res) => {
  try {
    const { school, degree, fieldOfStudy, startDate, endDate, current, grade, description, achievements } = req.body;
    const newEdu = { school, degree, fieldOfStudy, startDate, endDate, current, grade, description, achievements };
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.education.unshift(newEdu);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update education entry
// @route   PUT /api/profile/education/:eduId
// @access  Private
export const updateEducation = async (req, res) => {
  try {
    const { school, degree, fieldOfStudy, startDate, endDate, current, grade, description, achievements } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const eduItem = profile.education.id(req.params.eduId);
    if (!eduItem) return res.status(404).json({ message: 'Education entry not found' });
    if (school) eduItem.school = school;
    if (degree) eduItem.degree = degree;
    if (fieldOfStudy !== undefined) eduItem.fieldOfStudy = fieldOfStudy;
    if (startDate) eduItem.startDate = startDate;
    if (endDate !== undefined) eduItem.endDate = endDate;
    if (current !== undefined) eduItem.current = current;
    if (grade !== undefined) eduItem.grade = grade;
    if (description !== undefined) eduItem.description = description;
    if (achievements !== undefined) eduItem.achievements = achievements;
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete education entry
// @route   DELETE /api/profile/education/:eduId
// @access  Private
export const deleteEducation = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.education = profile.education.filter(edu => edu._id.toString() !== req.params.eduId);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add experience entry
// @route   POST /api/profile/experience
// @access  Private
export const addExperience = async (req, res) => {
  try {
    const { title, company, location, employmentType, startDate, endDate, current, description } = req.body;
    const newExp = { title, company, location, employmentType, startDate, endDate, current, description };
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.experience.unshift(newExp);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update experience entry
// @route   PUT /api/profile/experience/:expId
// @access  Private
export const updateExperience = async (req, res) => {
  try {
    const { title, company, location, employmentType, startDate, endDate, current, description } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const expItem = profile.experience.id(req.params.expId);
    if (!expItem) return res.status(404).json({ message: 'Experience entry not found' });
    if (title) expItem.title = title;
    if (company) expItem.company = company;
    if (location !== undefined) expItem.location = location;
    if (employmentType !== undefined) expItem.employmentType = employmentType;
    if (startDate) expItem.startDate = startDate;
    if (endDate !== undefined) expItem.endDate = endDate;
    if (current !== undefined) expItem.current = current;
    if (description !== undefined) expItem.description = description;
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete experience entry
// @route   DELETE /api/profile/experience/:expId
// @access  Private
export const deleteExperience = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.experience = profile.experience.filter(exp => exp._id.toString() !== req.params.expId);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add project entry
// @route   POST /api/profile/projects
// @access  Private
export const addProject = async (req, res) => {
  try {
    const { title, description, technologies, githubLink, demoLink, startDate, endDate } = req.body;
    let imageUrl = '';
    if (req.file) imageUrl = await uploadToCloudinary(req.file);
    const newProj = {
      title, description, image: imageUrl,
      technologies: typeof technologies === 'string' ? technologies.split(',').map(s => s.trim()) : technologies,
      githubLink, demoLink, startDate, endDate
    };
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.projects.unshift(newProj);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project entry
// @route   PUT /api/profile/projects/:projId
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const { title, description, technologies, githubLink, demoLink, startDate, endDate } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const projItem = profile.projects.id(req.params.projId);
    if (!projItem) return res.status(404).json({ message: 'Project entry not found' });
    if (req.file) projItem.image = await uploadToCloudinary(req.file);
    if (title) projItem.title = title;
    if (description) projItem.description = description;
    if (technologies) {
      projItem.technologies = typeof technologies === 'string' ? technologies.split(',').map(s => s.trim()) : technologies;
    }
    if (githubLink !== undefined) projItem.githubLink = githubLink;
    if (demoLink !== undefined) projItem.demoLink = demoLink;
    if (startDate) projItem.startDate = startDate;
    if (endDate !== undefined) projItem.endDate = endDate;
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project entry
// @route   DELETE /api/profile/projects/:projId
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.projects = profile.projects.filter(proj => proj._id.toString() !== req.params.projId);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add certification entry
// @route   POST /api/profile/certifications
// @access  Private
export const addCertification = async (req, res) => {
  try {
    const { name, issuingOrganization, issueDate, expirationDate, credentialId, credentialUrl } = req.body;
    const newCert = { name, issuingOrganization, issueDate, expirationDate, credentialId, credentialUrl };
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.certifications.unshift(newCert);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update certification entry
// @route   PUT /api/profile/certifications/:certId
// @access  Private
export const updateCertification = async (req, res) => {
  try {
    const { name, issuingOrganization, issueDate, expirationDate, credentialId, credentialUrl } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const certItem = profile.certifications.id(req.params.certId);
    if (!certItem) return res.status(404).json({ message: 'Certification entry not found' });
    if (name) certItem.name = name;
    if (issuingOrganization) certItem.issuingOrganization = issuingOrganization;
    if (issueDate) certItem.issueDate = issueDate;
    if (expirationDate !== undefined) certItem.expirationDate = expirationDate;
    if (credentialId !== undefined) certItem.credentialId = credentialId;
    if (credentialUrl !== undefined) certItem.credentialUrl = credentialUrl;
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete certification entry
// @route   DELETE /api/profile/certifications/:certId
// @access  Private
export const deleteCertification = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.certifications = profile.certifications.filter(cert => cert._id.toString() !== req.params.certId);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user skills
// @route   PUT /api/profile/skills
// @access  Private
export const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim()).filter(Boolean);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add portfolio link
// @route   POST /api/profile/portfolio-links
// @access  Private
export const addPortfolioLink = async (req, res) => {
  try {
    const { platform, url, label } = req.body;
    if (!platform || !url) return res.status(400).json({ message: 'Platform and URL are required' });
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.portfolioLinks.push({ platform, url, label });
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update portfolio link
// @route   PUT /api/profile/portfolio-links/:linkId
// @access  Private
export const updatePortfolioLink = async (req, res) => {
  try {
    const { platform, url, label } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const link = profile.portfolioLinks.id(req.params.linkId);
    if (!link) return res.status(404).json({ message: 'Portfolio link not found' });
    if (platform) link.platform = platform;
    if (url) link.url = url;
    if (label !== undefined) link.label = label;
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete portfolio link
// @route   DELETE /api/profile/portfolio-links/:linkId
// @access  Private
export const deletePortfolioLink = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.portfolioLinks = profile.portfolioLinks.filter(link => link._id.toString() !== req.params.linkId);
    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// ✅ PHASE 2: Enhanced Skills Management
// =============================================

// Predefined skill suggestions
const PREDEFINED_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
  'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap',
  'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'NLP',
  'Figma', 'Adobe XD', 'UI/UX Design', 'Product Management', 'Agile',
];

// @desc    Get skill suggestions
// @route   GET /api/profile/skills/suggestions
// @access  Public
export const getSkillSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) return res.status(200).json(PREDEFINED_SKILLS.slice(0, 20));
    
    const filtered = PREDEFINED_SKILLS.filter(skill =>
      skill.toLowerCase().includes(search.toLowerCase())
    );
    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update skills with proficiency (replaces old skills array)
// @route   PUT /api/profile/skills
// @access  Private
export const updateSkillsEnhanced = async (req, res) => {
  try {
    const { skills } = req.body; // Array of { name, proficiency, pinned, order }
    
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.skills = skills.map((skill, index) => ({
      name: skill.name || skill,
      proficiency: skill.proficiency || 'intermediate',
      pinned: skill.pinned || false,
      order: skill.order || index
    }));

    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle pin a skill
// @route   PUT /api/profile/skills/:skillId/pin
// @access  Private
export const togglePinSkill = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const skill = profile.skills.id(req.params.skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    skill.pinned = !skill.pinned;
    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder skills
// @route   PUT /api/profile/skills/reorder
// @access  Private
export const reorderSkills = async (req, res) => {
  try {
    const { skillIds } = req.body; // Array of skill IDs in new order
    
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    skillIds.forEach((id, index) => {
      const skill = profile.skills.id(id);
      if (skill) skill.order = index;
    });

    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a single skill
// @route   DELETE /api/profile/skills/:skillId
// @access  Private
export const deleteSkill = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.skills = profile.skills.filter(s => s._id.toString() !== req.params.skillId);
    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// ✅ PHASE 2: Languages CRUD
// =============================================

// @desc    Add language
// @route   POST /api/profile/languages
// @access  Private
export const addLanguage = async (req, res) => {
  try {
    const { name, proficiency } = req.body;
    if (!name) return res.status(400).json({ message: 'Language name is required' });

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.languages.push({ name, proficiency: proficiency || 'conversational' });
    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update language
// @route   PUT /api/profile/languages/:langId
// @access  Private
export const updateLanguage = async (req, res) => {
  try {
    const { name, proficiency } = req.body;
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const lang = profile.languages.id(req.params.langId);
    if (!lang) return res.status(404).json({ message: 'Language not found' });

    if (name) lang.name = name;
    if (proficiency) lang.proficiency = proficiency;
    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete language
// @route   DELETE /api/profile/languages/:langId
// @access  Private
export const deleteLanguage = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.languages = profile.languages.filter(l => l._id.toString() !== req.params.langId);
    await profile.save();
    
    const populated = await Profile.findById(profile._id).populate('user', 'name email role');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};