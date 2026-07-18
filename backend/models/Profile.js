import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  grade: { type: String },
  description: { type: String },
  achievements: { type: String }
});

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'],
    default: 'Internship'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  technologies: [{ type: String }],
  githubLink: { type: String },
  demoLink: { type: String },
  startDate: { type: Date },
  endDate: { type: Date }
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuingOrganization: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expirationDate: { type: Date },
  credentialId: { type: String },
  credentialUrl: { type: String }
});

// ✅ NEW: Skill with proficiency
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  pinned: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
});

// ✅ NEW: Language schema
const languageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['basic', 'conversational', 'professional', 'native'],
    default: 'conversational'
  }
});

// Portfolio Links Schema
const portfolioLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['github', 'linkedin', 'behance', 'dribbble', 'portfolio', 'kaggle', 'medium', 'devto', 'other'],
    required: true
  },
  url: { type: String, required: true },
  label: { type: String }
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Profile images
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },

    // Basic Information
    headline: { type: String, default: '' },
    currentStatus: {
      type: String,
      enum: ['student', 'graduate', 'looking-internship', 'looking-job', 'employed', ''],
      default: ''
    },
    university: { type: String, default: '' },
    degree: { type: String, default: '' },
    major: { type: String, default: '' },
    graduationYear: { type: Number },

    // Professional Summary
    summary: {
      type: String,
      default: '',
      maxlength: [1000, 'Summary cannot exceed 1000 characters']
    },

    // Contact Information
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },

    // Location
    location: {
      country: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' }
    },
    locationString: { type: String, default: '' },

    // Portfolio Links
    portfolioLinks: [portfolioLinkSchema],

    // Resume
    resume: { type: String, default: '' },

    // Legacy social links
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },

    // ✅ UPDATED: Skills with proficiency
    skills: [skillSchema],
    // Keep old simple skills for backward compatibility
    legacySkills: [{ type: String }],

    // ✅ NEW: Languages
    languages: [languageSchema],

    // Sections
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],

    // Visibility
    visibility: {
      type: String,
      enum: ['public', 'connections-only', 'recruiters-only', 'private'],
      default: 'public'
    }
  },
  {
    timestamps: true
  }
);

// Virtual for profile completion percentage
profileSchema.virtual('completionPercentage').get(function() {
  const checks = [
    { weight: 10, passed: !!(this.headline && this.headline.length > 0) },
    { weight: 5, passed: !!(this.currentStatus && this.currentStatus.length > 0) },
    { weight: 5, passed: !!(this.university && this.university.length > 0) },
    { weight: 5, passed: !!(this.major && this.major.length > 0) },
    { weight: 10, passed: !!(this.avatar && this.avatar.length > 0) },
    { weight: 10, passed: !!(this.summary && this.summary.length > 0) },
    { weight: 5, passed: !!(this.email || this.phone || this.website) },
    { weight: 5, passed: !!(this.location?.country || this.locationString) },
    { weight: 5, passed: !!(this.portfolioLinks?.length > 0 || this.github || this.linkedin) },
    { weight: 10, passed: !!(this.resume && this.resume.length > 0) },
    { weight: 10, passed: !!(this.skills && this.skills.length > 0) },
    { weight: 5, passed: !!(this.languages && this.languages.length > 0) },
    { weight: 10, passed: !!(this.education && this.education.length > 0) },
    { weight: 5, passed: !!(this.experience && this.experience.length > 0) },
    { weight: 5, passed: !!(this.projects && this.projects.length > 0) },
  ];
  
  const total = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return Math.min(total, 100);
});

// Ensure virtuals are included in JSON output
profileSchema.set('toJSON', { virtuals: true });
profileSchema.set('toObject', { virtuals: true });

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;