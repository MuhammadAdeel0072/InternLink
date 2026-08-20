import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

import User from './models/User.js';
import Profile from './models/Profile.js';
import Company from './models/Company.js';
import Job from './models/Job.js';
import Application from './models/Application.js';
import Interview from './models/Interview.js';
import Offer from './models/Offer.js';
import Hiring from './models/Hiring.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Post from './models/Post.js';
import Notification from './models/Notification.js';
import Connection from './models/Connection.js';
import TalentPool from './models/TalentPool.js';
import TalentCollection from './models/TalentCollection.js';
import JobAlert from './models/JobAlert.js';

const SEED_EMAIL_DOMAIN = '@internlink.test';
const DEMO_PASSWORD = 'Demo@12345';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const collections = [
  'Message',
  'Conversation',
  'Notification',
  'Post',
  'Interview',
  'Offer',
  'Hiring',
  'Application',
  'TalentPool',
  'TalentCollection',
  'JobAlert',
  'Connection',
  'Job',
  'Company',
  'Profile',
  'User'
];

async function clearSeedData() {
  console.log('🧹 Clearing existing seed data...');
  for (const name of collections) {
    const model = mongoose.model(name);
    if (model) {
      await model.deleteMany({});
    }
  }
  console.log('✅ Seed data cleared.\n');
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function createUser({ name, email, password, role = 'student', preferences = {}, extra = {} }) {
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    isVerified: true,
    authProvider: 'local',
    hasAcceptedTerms: true,
    preferences: {
      appearance: { theme: 'system', fontSize: 'medium' },
      accessibility: { reducedMotion: false, highContrast: false, largerText: false, keyboardNavigation: false },
      privacy: { profileVisibility: 'public', allowConnectionRequests: true, allowMessages: true, showEmail: false, showPhone: false, searchEngineIndexing: true, blockedUsers: [] },
      notifications: { emailNotifications: true, pushNotifications: true },
      ...preferences
    },
    ...extra
  });
  return user;
}

async function createProfile(user, profileData = {}) {
  return Profile.create({
    user: user._id,
    avatar: '',
    cover: '',
    headline: '',
    currentStatus: '',
    university: '',
    degree: '',
    major: '',
    graduationYear: null,
    jobTitle: '',
    department: '',
    yearsOfExperience: null,
    summary: '',
    email: '',
    phone: '',
    website: '',
    location: { country: '', city: '', postalCode: '' },
    locationString: '',
    portfolioLinks: [],
    resume: '',
    github: '',
    linkedin: '',
    skills: [],
    legacySkills: [],
    languages: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    visibility: 'public',
    ...profileData
  });
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  const users = {};

  const studentPayloads = [
    { name: 'Alex Johnson', email: 'student1@internlink.test', headline: 'Full Stack Developer', university: 'Stanford University', degree: 'BS Computer Science', major: 'Software Engineering', graduationYear: 2025, currentStatus: 'looking-internship', location: { city: 'Palo Alto', country: 'United States' }, locationString: 'Palo Alto, CA', skills: [{ name: 'React', proficiency: 'advanced' }, { name: 'Node.js', proficiency: 'intermediate' }, { name: 'TypeScript', proficiency: 'intermediate' }, { name: 'MongoDB', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Spanish', proficiency: 'basic' }], summary: 'Passionate full-stack developer looking for internship opportunities to build impactful web applications.', phone: '+1-555-0101', preferences: { appearance: { theme: 'dark', fontSize: 'medium' } } },
    { name: 'Maya Patel', email: 'student2@internlink.test', headline: 'Data Science Student', university: 'Carnegie Mellon University', degree: 'BS Data Science', major: 'Machine Learning', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'Pittsburgh', country: 'United States' }, locationString: 'Pittsburgh, PA', skills: [{ name: 'Python', proficiency: 'expert' }, { name: 'SQL', proficiency: 'advanced' }, { name: 'TensorFlow', proficiency: 'intermediate' }, { name: 'Pandas', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Hindi', proficiency: 'native' }], summary: 'Data science enthusiast with strong foundations in ML and analytics. Seeking internships to solve real-world problems.', phone: '+1-555-0102', preferences: { appearance: { theme: 'ocean', fontSize: 'medium' } } },
    { name: 'James Wilson', email: 'student3@internlink.test', headline: 'React Developer', university: 'UC Berkeley', degree: 'BS Computer Science', major: 'Web Development', graduationYear: 2025, currentStatus: 'graduate', location: { city: 'Berkeley', country: 'United States' }, locationString: 'Berkeley, CA', skills: [{ name: 'React', proficiency: 'advanced' }, { name: 'JavaScript', proficiency: 'expert' }, { name: 'CSS', proficiency: 'advanced' }, { name: 'HTML', proficiency: 'expert' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Frontend-focused developer specializing in React and modern CSS. Built multiple production-ready web apps.', phone: '+1-555-0103' },
    { name: 'Sarah Chen', email: 'student4@internlink.test', headline: 'Backend Engineer', university: 'MIT', degree: 'BS Computer Science', major: 'Systems', graduationYear: 2025, currentStatus: 'looking-job', location: { city: 'Cambridge', country: 'United States' }, locationString: 'Cambridge, MA', skills: [{ name: 'Java', proficiency: 'advanced' }, { name: 'Spring Boot', proficiency: 'intermediate' }, { name: 'MySQL', proficiency: 'advanced' }, { name: 'Docker', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Mandarin', proficiency: 'conversational' }], summary: 'Backend engineer with experience in distributed systems and API design.', phone: '+1-555-0104' },
    { name: 'Michael Brown', email: 'student5@internlink.test', headline: 'UI/UX Designer', university: 'Rhode Island School of Design', degree: 'BFA Design', major: 'Interaction Design', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'Providence', country: 'United States' }, locationString: 'Providence, RI', skills: [{ name: 'Figma', proficiency: 'expert' }, { name: 'UI/UX', proficiency: 'advanced' }, { name: 'User Research', proficiency: 'intermediate' }, { name: 'Prototyping', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Design-minded creator focused on accessible and intuitive user experiences.', phone: '+1-555-0105' },
    { name: 'Emily Davis', email: 'student6@internlink.test', headline: 'MERN Stack Developer', university: 'Georgia Tech', degree: 'BS Computer Science', major: 'Computing Media', graduationYear: 2025, currentStatus: 'graduate', location: { city: 'Atlanta', country: 'United States' }, locationString: 'Atlanta, GA', skills: [{ name: 'MongoDB', proficiency: 'advanced' }, { name: 'Express', proficiency: 'intermediate' }, { name: 'React', proficiency: 'advanced' }, { name: 'Node.js', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Full-stack developer passionate about the MERN ecosystem and real-time applications.', phone: '+1-555-0106' },
    { name: 'David Lee', email: 'student7@internlink.test', headline: 'Python Developer', university: 'University of Washington', degree: 'BS Informatics', major: 'Data Engineering', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'Seattle', country: 'United States' }, locationString: 'Seattle, WA', skills: [{ name: 'Python', proficiency: 'expert' }, { name: 'Django', proficiency: 'intermediate' }, { name: 'PostgreSQL', proficiency: 'intermediate' }, { name: 'REST APIs', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Korean', proficiency: 'basic' }], summary: 'Python developer interested in backend services and data pipelines.', phone: '+1-555-0107' },
    { name: 'Lisa Wang', email: 'student8@internlink.test', headline: 'Software Engineer', university: 'Caltech', degree: 'BS Computer Science', major: 'Algorithms', graduationYear: 2025, currentStatus: 'employed', location: { city: 'Pasadena', country: 'United States' }, locationString: 'Pasadena, CA', skills: [{ name: 'C++', proficiency: 'advanced' }, { name: 'Python', proficiency: 'intermediate' }, { name: 'Algorithms', proficiency: 'expert' }, { name: 'Git', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Mandarin', proficiency: 'native' }], summary: 'Software engineer with strong algorithmic thinking and low-level programming experience.', phone: '+1-555-0108' },
    { name: 'Ryan Garcia', email: 'student9@internlink.test', headline: 'DevOps Engineer', university: 'Texas A&M University', degree: 'BS Computer Engineering', major: 'Cloud Computing', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'College Station', country: 'United States' }, locationString: 'College Station, TX', skills: [{ name: 'Docker', proficiency: 'intermediate' }, { name: 'Kubernetes', proficiency: 'beginner' }, { name: 'AWS', proficiency: 'intermediate' }, { name: 'CI/CD', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Spanish', proficiency: 'conversational' }], summary: 'Cloud and DevOps enthusiast building scalable infrastructure.', phone: '+1-555-0109' },
    { name: 'Jessica Taylor', email: 'student10@internlink.test', headline: 'Frontend Developer', university: 'University of Michigan', degree: 'BS Information', major: 'Frontend Development', graduationYear: 2025, currentStatus: 'graduate', location: { city: 'Ann Arbor', country: 'United States' }, locationString: 'Ann Arbor, MI', skills: [{ name: 'JavaScript', proficiency: 'expert' }, { name: 'TypeScript', proficiency: 'advanced' }, { name: 'Tailwind CSS', proficiency: 'intermediate' }, { name: 'Next.js', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Frontend developer who loves crafting responsive and accessible user interfaces.', phone: '+1-555-0110' },
    { name: 'Kevin Martinez', email: 'student11@internlink.test', headline: 'Full Stack Developer', university: 'UCLA', degree: 'BS Computer Science', major: 'Software Engineering', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'Los Angeles', country: 'United States' }, locationString: 'Los Angeles, CA', skills: [{ name: 'React', proficiency: 'advanced' }, { name: 'Node.js', proficiency: 'intermediate' }, { name: 'GraphQL', proficiency: 'beginner' }, { name: 'PostgreSQL', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Spanish', proficiency: 'native' }], summary: 'Full-stack developer with a passion for clean code and scalable architecture.', phone: '+1-555-0111' },
    { name: 'Amanda Anderson', email: 'student12@internlink.test', headline: 'Data Analyst', university: 'Columbia University', degree: 'BS Statistics', major: 'Data Analytics', graduationYear: 2025, currentStatus: 'looking-job', location: { city: 'New York', country: 'United States' }, locationString: 'New York, NY', skills: [{ name: 'SQL', proficiency: 'expert' }, { name: 'Python', proficiency: 'advanced' }, { name: 'Tableau', proficiency: 'intermediate' }, { name: 'Excel', proficiency: 'expert' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Data analyst skilled in turning raw data into actionable business insights.', phone: '+1-555-0112' },
    { name: 'Chris Thomas', email: 'student13@internlink.test', headline: 'Java Developer', university: 'Purdue University', degree: 'BS Computer Science', major: 'Enterprise Systems', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'West Lafayette', country: 'United States' }, locationString: 'West Lafayette, IN', skills: [{ name: 'Java', proficiency: 'advanced' }, { name: 'Spring', proficiency: 'intermediate' }, { name: 'Microservices', proficiency: 'beginner' }, { name: 'Kafka', proficiency: 'beginner' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Java developer focused on building robust enterprise applications.', phone: '+1-555-0113' },
    { name: 'Rachel White', email: 'student14@internlink.test', headline: 'Mobile Developer', university: 'University of Southern California', degree: 'BS Computer Science', major: 'Mobile Computing', graduationYear: 2025, currentStatus: 'graduate', location: { city: 'Los Angeles', country: 'United States' }, locationString: 'Los Angeles, CA', skills: [{ name: 'React Native', proficiency: 'advanced' }, { name: 'Flutter', proficiency: 'intermediate' }, { name: 'iOS', proficiency: 'beginner' }, { name: 'Android', proficiency: 'beginner' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Mobile developer creating cross-platform experiences with React Native and Flutter.', phone: '+1-555-0114' },
    { name: 'Daniel Harris', email: 'student15@internlink.test', headline: 'Cloud Engineer', university: 'University of Texas at Austin', degree: 'BS Computer Science', major: 'Cloud Systems', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'Austin', country: 'United States' }, locationString: 'Austin, TX', skills: [{ name: 'AWS', proficiency: 'intermediate' }, { name: 'Terraform', proficiency: 'beginner' }, { name: 'Linux', proficiency: 'advanced' }, { name: 'Python', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Cloud engineering student passionate about infrastructure as code and automation.', phone: '+1-555-0115' },
    { name: 'Nicole Clark', email: 'student16@internlink.test', headline: 'AI/ML Engineer', university: 'Stanford University', degree: 'MS Computer Science', major: 'Artificial Intelligence', graduationYear: 2025, currentStatus: 'graduate', location: { city: 'Stanford', country: 'United States' }, locationString: 'Stanford, CA', skills: [{ name: 'Python', proficiency: 'expert' }, { name: 'PyTorch', proficiency: 'intermediate' }, { name: 'NLP', proficiency: 'intermediate' }, { name: 'Computer Vision', proficiency: 'beginner' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'French', proficiency: 'basic' }], summary: 'AI/ML engineer focused on natural language processing and computer vision applications.', phone: '+1-555-0116' },
    { name: 'Jason Lewis', email: 'student17@internlink.test', headline: 'Cybersecurity Student', university: 'University of Maryland', degree: 'BS Cybersecurity', major: 'Information Assurance', graduationYear: 2026, currentStatus: 'looking-internship', location: { city: 'College Park', country: 'United States' }, locationString: 'College Park, MD', skills: [{ name: 'Network Security', proficiency: 'intermediate' }, { name: 'Penetration Testing', proficiency: 'beginner' }, { name: 'Python', proficiency: 'intermediate' }, { name: 'SIEM', proficiency: 'beginner' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Cybersecurity student eager to learn and contribute to secure software development practices.', phone: '+1-555-0117' },
    { name: 'Laura Robinson', email: 'student18@internlink.test', headline: 'Product Manager', university: 'Northwestern University', degree: 'BS Industrial Engineering', major: 'Product Management', graduationYear: 2025, currentStatus: 'looking-job', location: { city: 'Evanston', country: 'United States' }, locationString: 'Evanston, IL', skills: [{ name: 'Product Strategy', proficiency: 'intermediate' }, { name: 'Agile', proficiency: 'intermediate' }, { name: 'Data Analysis', proficiency: 'beginner' }, { name: 'User Research', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Product manager with technical background, bridging engineering and business requirements.', phone: '+1-555-0118' }
  ];

  for (const payload of studentPayloads) {
    const { email, preferences, ...profileData } = payload;
    const user = await createUser({ name: payload.name, email, password: DEMO_PASSWORD, role: 'student', preferences });
    await createProfile(user, profileData);
    users[email] = user;
    console.log(`  Created student: ${payload.name} (${email})`);
  }

  const recruiterPayloads = [
    { name: 'Sarah Miller', email: 'recruiter1@internlink.test', headline: 'Technical Recruiter', jobTitle: 'Technical Recruiter', department: 'Talent Acquisition', yearsOfExperience: 6, location: { city: 'San Francisco', country: 'United States' }, locationString: 'San Francisco, CA', skills: [{ name: 'Technical Recruiting', proficiency: 'expert' }, { name: 'Sourcing', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Experienced technical recruiter specializing in software engineering roles.', phone: '+1-555-1001' },
    { name: 'David Kim', email: 'recruiter2@internlink.test', headline: 'HR Manager', jobTitle: 'HR Manager', department: 'Human Resources', yearsOfExperience: 10, location: { city: 'New York', country: 'United States' }, locationString: 'New York, NY', skills: [{ name: 'HR Management', proficiency: 'expert' }, { name: 'Talent Strategy', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Korean', proficiency: 'basic' }], summary: 'HR leader focused on building high-performing teams and inclusive workplaces.', phone: '+1-555-1002' },
    { name: 'Emily Roberts', email: 'recruiter3@internlink.test', headline: 'Talent Acquisition Specialist', jobTitle: 'Talent Acquisition Specialist', department: 'People', yearsOfExperience: 4, location: { city: 'Chicago', country: 'United States' }, locationString: 'Chicago, IL', skills: [{ name: 'Talent Acquisition', proficiency: 'advanced' }, { name: 'Employer Branding', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Talent acquisition specialist passionate about connecting great people with great opportunities.', phone: '+1-555-1003' },
    { name: 'Michael Chang', email: 'recruiter4@internlink.test', headline: 'Senior Recruiter', jobTitle: 'Senior Recruiter', department: 'Recruiting', yearsOfExperience: 8, location: { city: 'Seattle', country: 'United States' }, locationString: 'Seattle, WA', skills: [{ name: 'Full-Cycle Recruiting', proficiency: 'expert' }, { name: 'Negotiation', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }, { name: 'Mandarin', proficiency: 'conversational' }], summary: 'Senior recruiter with a track record of filling hard-to-find technical roles.', phone: '+1-555-1004' },
    { name: 'Jessica Adams', email: 'recruiter5@internlink.test', headline: 'Engineering Recruiter', jobTitle: 'Engineering Recruiter', department: 'Engineering', yearsOfExperience: 5, location: { city: 'Austin', country: 'United States' }, locationString: 'Austin, TX', skills: [{ name: 'Engineering Recruiting', proficiency: 'advanced' }, { name: 'Sourcing', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Engineering recruiter who understands code and culture fit.', phone: '+1-555-1005' },
    { name: 'Ryan Thompson', email: 'recruiter6@internlink.test', headline: 'HR Manager', jobTitle: 'HR Manager', department: 'Human Resources', yearsOfExperience: 12, location: { city: 'San Francisco', country: 'United States' }, locationString: 'San Francisco, CA', skills: [{ name: 'HR Strategy', proficiency: 'expert' }, { name: 'Compliance', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'HR manager ensuring compliant, scalable hiring processes.', phone: '+1-555-1006' },
    { name: 'Amanda Foster', email: 'recruiter7@internlink.test', headline: 'Talent Specialist', jobTitle: 'Talent Specialist', department: 'Talent', yearsOfExperience: 3, location: { city: 'New York', country: 'United States' }, locationString: 'New York, NY', skills: [{ name: 'Sourcing', proficiency: 'intermediate' }, { name: 'Employer Branding', proficiency: 'intermediate' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Talent specialist focused on early-career recruiting and university partnerships.', phone: '+1-555-1007' },
    { name: 'Chris Evans', email: 'recruiter8@internlink.test', headline: 'Recruiting Lead', jobTitle: 'Recruiting Lead', department: 'Recruiting', yearsOfExperience: 9, location: { city: 'Chicago', country: 'United States' }, locationString: 'Chicago, IL', skills: [{ name: 'Recruiting Leadership', proficiency: 'expert' }, { name: 'Data-Driven Hiring', proficiency: 'advanced' }], languages: [{ name: 'English', proficiency: 'native' }], summary: 'Recruiting lead driving hiring excellence through data and mentorship.', phone: '+1-555-1008' }
  ];

  for (const payload of recruiterPayloads) {
    const { email, ...profileData } = payload;
    const user = await createUser({ name: payload.name, email, password: DEMO_PASSWORD, role: 'recruiter' });
    await createProfile(user, profileData);
    users[email] = user;
    console.log(`  Created recruiter: ${payload.name} (${email})`);
  }

  console.log(`✅ Created ${Object.keys(users).length} users.\n`);
  return users;
}

async function seedCompanies(users) {
  console.log('🏢 Seeding companies...');
  const companies = {};

  const companyPayloads = [
    { companyName: 'TechNova Solutions', industry: 'Software', website: 'https://technova.example.com', companySize: '51-200', description: 'TechNova builds next-generation SaaS products for modern enterprises. We focus on developer tools and cloud infrastructure.', headquarters: { country: 'United States', state: 'CA', city: 'San Francisco' }, socialLinks: { linkedin: 'https://linkedin.com/company/technova', twitter: 'https://twitter.com/technova' }, contactInformation: { phone: '+1-555-2001', supportEmail: 'support@technova.example.com', hrEmail: 'hr@technova.example.com' }, benefits: ['Health Insurance', 'Remote Work', 'Learning Budget', 'Stock Options'], verificationStatus: 'verified', createdBy: users['recruiter1@internlink.test']._id, recruiters: [{ userId: users['recruiter1@internlink.test']._id, status: 'approved' }, { userId: users['recruiter6@internlink.test']._id, status: 'approved' }] },
    { companyName: 'GreenLeaf FinTech', industry: 'FinTech', website: 'https://greenleaf.example.com', companySize: '201-500', description: 'GreenLeaf provides digital banking and payment solutions for underserved markets worldwide.', headquarters: { country: 'United States', state: 'NY', city: 'New York' }, socialLinks: { linkedin: 'https://linkedin.com/company/greenleaf' }, contactInformation: { phone: '+1-555-2002', supportEmail: 'support@greenleaf.example.com', hrEmail: 'hr@greenleaf.example.com' }, benefits: ['Competitive Salary', 'Health Insurance', '401k Match', 'Flexible PTO'], verificationStatus: 'verified', createdBy: users['recruiter3@internlink.test']._id, recruiters: [{ userId: users['recruiter3@internlink.test']._id, status: 'approved' }, { userId: users['recruiter8@internlink.test']._id, status: 'approved' }] },
    { companyName: 'CloudPeak AI', industry: 'AI', website: 'https://cloudpeak.example.com', companySize: '11-50', description: 'CloudPeak builds AI-powered analytics and automation tools for enterprise operations.', headquarters: { country: 'United States', state: 'TX', city: 'Austin' }, socialLinks: { linkedin: 'https://linkedin.com/company/cloudpeak' }, contactInformation: { phone: '+1-555-2003', supportEmail: 'support@cloudpeak.example.com', hrEmail: 'hr@cloudpeak.example.com' }, benefits: ['Remote First', 'Health Insurance', 'Equity', 'Conference Budget'], verificationStatus: 'verified', createdBy: users['recruiter2@internlink.test']._id, recruiters: [{ userId: users['recruiter2@internlink.test']._id, status: 'approved' }, { userId: users['recruiter5@internlink.test']._id, status: 'approved' }, { userId: users['recruiter7@internlink.test']._id, status: 'approved' }] },
    { companyName: 'BrightPath E-commerce', industry: 'E-commerce', website: 'https://brightpath.example.com', companySize: '501-1000', description: 'BrightPath is a fast-growing e-commerce platform connecting independent artists with global buyers.', headquarters: { country: 'United States', state: 'WA', city: 'Seattle' }, socialLinks: { linkedin: 'https://linkedin.com/company/brightpath' }, contactInformation: { phone: '+1-555-2004', supportEmail: 'support@brightpath.example.com', hrEmail: 'hr@brightpath.example.com' }, benefits: ['Health Insurance', 'Remote Work', 'Employee Discounts', 'Wellness Stipend'], verificationStatus: 'verified', createdBy: users['recruiter4@internlink.test']._id, recruiters: [{ userId: users['recruiter4@internlink.test']._id, status: 'approved' }] },
    { companyName: 'DataBridge IT Services', industry: 'IT Services', website: 'https://databridge.example.com', companySize: '1001-5000', description: 'DataBridge delivers IT consulting and managed services to Fortune 500 clients across the globe.', headquarters: { country: 'United States', state: 'IL', city: 'Chicago' }, socialLinks: { linkedin: 'https://linkedin.com/company/databridge' }, contactInformation: { phone: '+1-555-2005', supportEmail: 'support@databridge.example.com', hrEmail: 'hr@databridge.example.com' }, benefits: ['Health Insurance', 'Retirement Plan', 'Training Budget', 'Remote Work'], verificationStatus: 'verified', createdBy: users['recruiter8@internlink.test']._id, recruiters: [{ userId: users['recruiter8@internlink.test']._id, status: 'approved' }] }
  ];

  for (const payload of companyPayloads) {
    const company = await Company.create(payload);
    companies[payload.companyName] = company;
    console.log(`  Created company: ${payload.companyName}`);
  }

  console.log(`✅ Created ${Object.keys(companies).length} companies.\n`);
  return companies;
}

async function seedJobs(users, companies) {
  console.log('💼 Seeding jobs...');
  const jobs = [];

  const companyMap = {
    'TechNova Solutions': { company: 'TechNova Solutions', companyId: companies['TechNova Solutions']._id, recruiter: users['recruiter1@internlink.test']._id },
    'GreenLeaf FinTech': { company: 'GreenLeaf FinTech', companyId: companies['GreenLeaf FinTech']._id, recruiter: users['recruiter3@internlink.test']._id },
    'CloudPeak AI': { company: 'CloudPeak AI', companyId: companies['CloudPeak AI']._id, recruiter: users['recruiter2@internlink.test']._id },
    'BrightPath E-commerce': { company: 'BrightPath E-commerce', companyId: companies['BrightPath E-commerce']._id, recruiter: users['recruiter4@internlink.test']._id },
    'DataBridge IT Services': { company: 'DataBridge IT Services', companyId: companies['DataBridge IT Services']._id, recruiter: users['recruiter8@internlink.test']._id }
  };

  const jobPayloads = [
    { title: 'Frontend Developer Intern', description: 'Work with our frontend team to build responsive web interfaces using React and TypeScript.', requirements: ['React', 'TypeScript', 'HTML/CSS', 'Git'], responsibilities: ['Build UI components', 'Write unit tests', 'Participate in code reviews'], benefits: ['Mentorship', 'Competitive stipend'], skills: ['React', 'TypeScript', 'CSS'], preferredSkills: ['Tailwind CSS', 'Next.js'], education: 'BS Computer Science or related field', experience: 'No prior experience required', languages: ['English'], location: 'San Francisco, CA', jobType: 'Internship', workplaceType: 'Hybrid', department: 'Engineering', salary: '$40-50/hr', currency: 'USD', openings: 3, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['TechNova Solutions'] },
    { title: 'Backend Developer Intern', description: 'Design and maintain REST APIs and database schemas for our SaaS platform.', requirements: ['Node.js', 'Express', 'MongoDB', 'REST APIs'], responsibilities: ['Design APIs', 'Optimize queries', 'Write documentation'], benefits: ['Remote work', 'Learning budget'], skills: ['Node.js', 'Express', 'MongoDB'], preferredSkills: ['GraphQL', 'Redis'], education: 'BS Computer Science', experience: '1+ project with backend focus', languages: ['English'], location: 'Remote', jobType: 'Internship', workplaceType: 'Remote', department: 'Engineering', salary: '$38-48/hr', currency: 'USD', openings: 2, deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['TechNova Solutions'] },
    { title: 'MERN Stack Developer', description: 'Build end-to-end features using MongoDB, Express, React, and Node.js.', requirements: ['MongoDB', 'Express', 'React', 'Node.js'], responsibilities: ['Full-stack feature delivery', 'Code reviews', 'Deployments'], benefits: ['Stock options', 'Health insurance'], skills: ['MongoDB', 'Express', 'React', 'Node.js'], preferredSkills: ['TypeScript', 'AWS'], education: 'BS Computer Science', experience: '1+ year', languages: ['English'], location: 'San Francisco, CA', jobType: 'Full-time', workplaceType: 'Hybrid', department: 'Engineering', salary: '$90k-120k', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['TechNova Solutions'] },
    { title: 'Software Engineer Intern', description: 'Join our core engineering team to ship features used by millions of users.', requirements: ['Data Structures', 'Algorithms', 'Python or Java'], responsibilities: ['Implement features', 'Write tests', 'Debug production issues'], benefits: ['Housing stipend', 'Mentorship'], skills: ['Python', 'Java', 'Algorithms'], preferredSkills: ['Go', 'Kubernetes'], education: 'BS/MS Computer Science', experience: 'Internship level', languages: ['English'], location: 'New York, NY', jobType: 'Internship', workplaceType: 'On-site', department: 'Engineering', salary: '$45-55/hr', currency: 'USD', openings: 4, deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['GreenLeaf FinTech'] },
    { title: 'Data Analyst Intern', description: 'Analyze transaction data and build dashboards for business stakeholders.', requirements: ['SQL', 'Python', 'Excel', 'Tableau'], responsibilities: ['Build dashboards', 'Write SQL queries', 'Present insights'], benefits: ['Return offer potential', 'Training'], skills: ['SQL', 'Python', 'Tableau'], preferredSkills: ['Power BI', 'Looker'], education: 'BS Statistics or related', experience: '0-1 years', languages: ['English'], location: 'New York, NY', jobType: 'Internship', workplaceType: 'Hybrid', department: 'Analytics', salary: '$35-45/hr', currency: 'USD', openings: 2, deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['GreenLeaf FinTech'] },
    { title: 'Full Stack Developer', description: 'Own features across the stack for our payment processing platform.', requirements: ['Node.js', 'React', 'PostgreSQL', 'AWS'], responsibilities: ['Own features', 'Improve performance', 'Mentor interns'], benefits: ['Competitive salary', 'Remote flexibility', 'Health insurance'], skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'], preferredSkills: ['Kubernetes', 'Terraform'], education: 'BS Computer Science', experience: '2+ years', languages: ['English'], location: 'Remote', jobType: 'Full-time', workplaceType: 'Remote', department: 'Engineering', salary: '$120k-160k', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['GreenLeaf FinTech'] },
    { title: 'Machine Learning Engineer Intern', description: 'Work on recommendation systems and NLP models for our AI platform.', requirements: ['Python', 'PyTorch', 'NLP', 'SQL'], responsibilities: ['Train models', 'Evaluate metrics', 'Deploy models'], benefits: ['Conference tickets', 'GPU credits'], skills: ['Python', 'PyTorch', 'NLP'], preferredSkills: ['Computer Vision', 'MLOps'], education: 'MS Computer Science preferred', experience: 'Research or project experience', languages: ['English'], location: 'Austin, TX', jobType: 'Internship', workplaceType: 'On-site', department: 'AI/ML', salary: '$42-52/hr', currency: 'USD', openings: 2, deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['CloudPeak AI'] },
    { title: 'DevOps Engineer', description: 'Build CI/CD pipelines and manage cloud infrastructure on AWS.', requirements: ['Docker', 'Kubernetes', 'AWS', 'Terraform'], responsibilities: ['Manage CI/CD', 'Improve reliability', 'Automate deployments'], benefits: ['Remote first', 'Learning budget'], skills: ['Docker', 'Kubernetes', 'AWS'], preferredSkills: ['Go', 'Prometheus'], education: 'BS Computer Science or related', experience: '1+ year', languages: ['English'], location: 'Remote', jobType: 'Full-time', workplaceType: 'Remote', department: 'Infrastructure', salary: '$110k-150k', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['CloudPeak AI'] },
    { title: 'AI Research Intern', description: 'Explore novel architectures for large language models and multimodal systems.', requirements: ['Python', 'Deep Learning', 'Research Experience'], responsibilities: ['Read papers', 'Run experiments', 'Write reports'], benefits: ['Paper publication support', 'Flexible hours'], skills: ['Python', 'PyTorch', 'Deep Learning'], preferredSkills: ['Transformers', 'CUDA'], education: 'MS/PhD in progress', experience: 'Research background', languages: ['English'], location: 'Austin, TX', jobType: 'Internship', workplaceType: 'Hybrid', department: 'Research', salary: '$40-50/hr', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['CloudPeak AI'] },
    { title: 'Frontend Engineer', description: 'Deliver polished storefront experiences for millions of shoppers.', requirements: ['React', 'TypeScript', 'Performance'], responsibilities: ['Build UI', 'Optimize performance', 'A/B testing'], benefits: ['Employee discounts', 'Health insurance'], skills: ['React', 'TypeScript', 'CSS'], preferredSkills: ['Next.js', 'GraphQL'], education: 'BS Computer Science', experience: '2+ years', languages: ['English'], location: 'Seattle, WA', jobType: 'Full-time', workplaceType: 'Hybrid', department: 'Engineering', salary: '$100k-140k', currency: 'USD', openings: 2, deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['BrightPath E-commerce'] },
    { title: 'Product Designer Intern', description: 'Collaborate with product and engineering to design intuitive shopping experiences.', requirements: ['Figma', 'User Research', 'Prototyping'], responsibilities: ['Create wireframes', 'Run user tests', 'Design systems'], benefits: ['Portfolio support', 'Mentorship'], skills: ['Figma', 'UI/UX', 'Prototyping'], preferredSkills: ['Design Systems', 'Motion Design'], education: 'Design or HCI related', experience: 'Internship level', languages: ['English'], location: 'Seattle, WA', jobType: 'Internship', workplaceType: 'Remote', department: 'Design', salary: '$30-40/hr', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['BrightPath E-commerce'] },
    { title: 'Software Engineer Intern', description: 'Build integrations and internal tools for enterprise clients.', requirements: ['Java', 'Spring Boot', 'SQL'], responsibilities: ['Build integrations', 'Write tests', 'Document APIs'], benefits: ['Return offer', 'Training'], skills: ['Java', 'Spring Boot', 'SQL'], preferredSkills: ['Azure', 'Microservices'], education: 'BS Computer Science', experience: 'Internship level', languages: ['English'], location: 'Chicago, IL', jobType: 'Internship', workplaceType: 'On-site', department: 'Engineering', salary: '$36-46/hr', currency: 'USD', openings: 3, deadline: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['DataBridge IT Services'] },
    { title: 'Cloud Consultant (Intern)', description: 'Assist with cloud migration assessments and architecture documentation.', requirements: ['AWS', 'Linux', 'Networking'], responsibilities: ['Assess workloads', 'Write runbooks', 'Support migrations'], benefits: ['Certification reimbursement', 'Remote work'], skills: ['AWS', 'Linux', 'Networking'], preferredSkills: ['Azure', 'Terraform'], education: 'BS Computer Science or related', experience: 'Internship level', languages: ['English'], location: 'Chicago, IL', jobType: 'Internship', workplaceType: 'Hybrid', department: 'Consulting', salary: '$34-44/hr', currency: 'USD', openings: 2, deadline: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000), isActive: true, status: 'published', ...companyMap['DataBridge IT Services'] },
    { title: 'QA Engineer Intern', description: 'Automate regression tests and improve release quality for client deliverables.', requirements: ['Selenium', 'JavaScript', 'Testing'], responsibilities: ['Write automation', 'Report bugs', 'Improve coverage'], benefits: ['Flexible schedule', 'Mentorship'], skills: ['Selenium', 'JavaScript', 'Testing'], preferredSkills: ['Cypress', 'Playwright'], education: 'BS Computer Science', experience: 'Internship level', languages: ['English'], location: 'Remote', jobType: 'Internship', workplaceType: 'Remote', department: 'Quality', salary: '$32-42/hr', currency: 'USD', openings: 1, deadline: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000), isActive: true, status: 'draft', ...companyMap['DataBridge IT Services'] }
  ];

  for (const payload of jobPayloads) {
    const job = await Job.create(payload);
    jobs.push(job);
    console.log(`  Created job: ${payload.title} at ${payload.company}`);
  }

  console.log(`✅ Created ${jobs.length} jobs.\n`);
  return jobs;
}

async function seedApplications(users, jobs) {
  console.log('📝 Seeding applications...');
  const applications = [];
  const studentEmails = Object.keys(users).filter(e => e.startsWith('student'));
  const studentUsers = studentEmails.map(e => users[e]);

  const statuses = ['applied', 'under-review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];
  const weights = [15, 6, 5, 4, 3, 2, 5];

  function pickStatus() {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < statuses.length; i++) {
      random -= weights[i];
      if (random <= 0) return statuses[i];
    }
    return 'applied';
  }

  const usedPairs = new Set();

  for (const student of studentUsers) {
    const appliedJobs = [];
    const shuffledJobs = [...jobs].sort(() => Math.random() - 0.5);
    const numApplications = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < numApplications && i < shuffledJobs.length; i++) {
      const job = shuffledJobs[i];
      const pairKey = `${student._id}-${job._id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const status = pickStatus();
      const timeline = [{ status, changedBy: job.recruiter, timestamp: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)), reason: status === 'rejected' ? 'Position filled' : '' }];
      if (status !== 'applied') {
        timeline.unshift({ status: 'applied', changedBy: student._id, timestamp: new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)), reason: '' });
      }

      let interviewData = {};
      if (['interview', 'offer', 'hired'].includes(status)) {
        interviewData = {
          type: ['online', 'on-site', 'phone'][Math.floor(Math.random() * 3)],
          date: new Date(Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
          time: '10:00 AM',
          timezone: 'UTC',
          interviewer: job.recruiter.toString() === users['recruiter1@internlink.test']._id.toString() ? 'Sarah Miller' : 'Hiring Manager',
          duration: '45 minutes',
          meetingLink: 'https://meet.example.com/abc123',
          notes: 'Candidate seems promising.'
        };
      }

      const application = await Application.create({
        job: job._id,
        student: student._id,
        recruiter: job.recruiter,
        companyId: job.companyId,
        resume: 'https://example.com/resumes/resume.pdf',
        coverLetter: 'I am excited to apply for this position...',
        status,
        rejectionReason: status === 'rejected' ? 'Position filled' : '',
        rejectedAt: status === 'rejected' ? new Date() : null,
        timeline,
        notes: status !== 'applied' ? [{ text: 'Strong candidate.', addedBy: job.recruiter, createdAt: new Date() }] : [],
        interview: interviewData
      });
      applications.push(application);

      if (job.applicants) {
        job.applicants.push(student._id);
        await job.save();
      }
    }
  }

  console.log(`✅ Created ${applications.length} applications.\n`);
  return applications;
}

async function seedInterviews(applications, users) {
  console.log('🎤 Seeding interviews...');
  const interviews = [];
  const interviewApplications = applications.filter(a => ['interview', 'offer', 'hired'].includes(a.status));

  for (const app of interviewApplications.slice(0, 10)) {
    const past = app.status === 'hired' || app.status === 'offer';
    const date = past ? new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)) : new Date(Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    let status = 'scheduled';
    if (past && app.status === 'hired') status = 'completed';
    else if (past && app.status === 'offer') status = ['completed', 'confirmed'][Math.floor(Math.random() * 2)];
    else if (app.status === 'interview') status = ['scheduled', 'confirmed'][Math.floor(Math.random() * 2)];

    const interview = await Interview.create({
      applicationId: app._id,
      jobId: app.job,
      candidateId: app.student,
      recruiterId: app.recruiter,
      companyId: app.companyId,
      interviewType: app.interview?.type || 'online',
      status,
      date,
      time: '10:00 AM',
      duration: '45 minutes',
      timezone: 'UTC',
      meetingLink: 'https://meet.example.com/xyz789',
      meetingPlatform: 'Google Meet',
      meetingId: 'xyz-789',
      passcode: '123456',
      location: app.interview?.type === 'on-site' ? 'Office Conference Room A' : '',
      interviewer: app.interview?.interviewer || 'Hiring Manager',
      department: 'Engineering',
      notes: 'Standard technical and behavioral round.',
      feedback: status === 'completed' ? {
        communication: 4,
        technicalSkills: 4,
        problemSolving: 5,
        leadership: 3,
        cultureFit: 4,
        overallRating: 4,
        recommendation: 'hire',
        comments: 'Strong problem-solving skills.'
      } : null,
      timeline: status === 'completed' ? [{ action: 'Interview completed', performedBy: app.recruiter, timestamp: new Date(), note: 'Positive feedback.' }] : [],
      remindersSent: status === 'completed' ? [{ type: '24h', sentAt: new Date(date.getTime() - 24 * 60 * 60 * 1000) }] : []
    });
    interviews.push(interview);
  }

  console.log(`✅ Created ${interviews.length} interviews.\n`);
  return interviews;
}

async function seedOffers(applications, interviews, jobs, users, companies) {
  console.log('🏆 Seeding offers...');
  const offers = [];
  const offerApplications = applications.filter(a => ['offer', 'hired'].includes(a.status));

  for (const app of offerApplications.slice(0, 5)) {
    const interview = interviews.find(i => i.applicationId.toString() === app._id.toString());
    const job = jobs.find(j => j._id.toString() === app.job.toString());
    const baseSalary = job?.salary?.match(/\d+k|\d+/)?.[0] ? parseInt(job.salary.replace(/[^0-9]/g, '')) || 80000 : 80000;

    const status = app.status === 'hired' ? 'accepted' : ['sent', 'viewed'][Math.floor(Math.random() * 2)];

    const offer = await Offer.create({
      applicationId: app._id,
      interviewId: interview?._id || null,
      jobId: app.job,
      candidateId: app.student,
      recruiterId: app.recruiter,
      companyId: app.companyId,
      offerNumber: `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status,
      salary: { baseSalary: baseSalary || 80000, currency: 'USD', bonus: baseSalary ? Math.floor(baseSalary * 0.1) : 8000, signingBonus: 5000, stockOptions: 'RSUs eligible after 1 year' },
      compensation: { baseSalary: baseSalary || 80000, performanceBonus: baseSalary ? Math.floor(baseSalary * 0.08) : 6400, annualBonus: baseSalary ? Math.floor(baseSalary * 0.05) : 4000, travelAllowance: 2000, medicalAllowance: 3000, housingAllowance: 0, internetAllowance: 1000, other: 0, monthlyCompensation: (baseSalary || 80000) / 12, annualCompensation: baseSalary || 80000, totalPackage: (baseSalary || 80000) + 5000 },
      benefits: ['Health Insurance', '401k Match', 'Remote Work', 'Learning Budget'],
      customBenefits: ['Gym Membership', 'Commuter Benefits'],
      joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reportingTime: '09:00 AM',
      officeLocation: job ? `${job.location}` : 'Remote',
      manager: 'Manager Name',
      team: 'Engineering',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      offerLetter: '',
      template: 'default',
      negotiationHistory: [],
      rejectionReason: status === 'rejected' ? 'Accepted another offer' : '',
      timeline: [{ action: 'Offer created', performedBy: app.recruiter, timestamp: new Date(), note: 'Offer sent to candidate.' }],
      history: [{ version: 1, changes: 'Initial offer', updatedBy: app.recruiter, updatedAt: new Date() }]
    });
    offers.push(offer);
  }

  console.log(`✅ Created ${offers.length} offers.\n`);
  return offers;
}

async function seedHirings(offers, applications, users, companies) {
  console.log('🤝 Seeding hirings...');
  const hirings = [];
  const acceptedOffers = offers.filter(o => o.status === 'accepted');

  for (const offer of acceptedOffers.slice(0, 3)) {
    const app = applications.find(a => a._id.toString() === offer.applicationId.toString());
    const hiring = await Hiring.create({
      candidateId: offer.candidateId,
      offerId: offer._id,
      jobId: offer.jobId,
      companyId: offer.companyId,
      recruiterId: offer.recruiterId,
      applicationId: app?._id || null,
      employeeId: `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeCode: `EC-${Math.floor(Math.random() * 10000)}`,
      employeeStatus: 'pending',
      department: 'Engineering',
      managerName: 'Manager Name',
      team: 'Engineering',
      workType: 'Remote',
      joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reportingTime: '09:00 AM',
      officeLocation: 'Remote',
      officeAssignment: { branch: 'Remote', floor: '', office: '', workstation: '' },
      equipmentAssignment: { laptop: true, companyEmail: '', employeeBadge: false },
      welcomeEmailSent: false,
      welcomeEmailSentAt: null,
      documents: [],
      checklist: Hiring.getChecklistTasks().map(item => ({ task: item.label, key: item.key, completed: false, completedAt: null, performedBy: null })),
      timeline: [{ action: 'Hiring initiated', performedBy: offer.recruiterId, timestamp: new Date(), note: 'Offer accepted.' }],
      status: 'offer-accepted',
      joiningRemindersSent: []
    });
    hirings.push(hiring);
  }

  console.log(`✅ Created ${hirings.length} hirings.\n`);
  return hirings;
}

async function seedConversationsAndMessages(users) {
  console.log('💬 Seeding conversations and messages...');
  const conversations = [];
  const allMessages = [];
  const userEntries = Object.entries(users);
  const studentUsers = userEntries.filter(([email]) => email.startsWith('student')).map(([, u]) => u);
  const recruiterUsers = userEntries.filter(([email]) => email.startsWith('recruiter')).map(([, u]) => u);

  const conversationPairs = [
    [studentUsers[0], recruiterUsers[0]],
    [studentUsers[0], recruiterUsers[1]],
    [studentUsers[1], recruiterUsers[0]],
    [studentUsers[1], studentUsers[2]],
    [studentUsers[2], recruiterUsers[1]],
    [recruiterUsers[0], recruiterUsers[1]],
    [studentUsers[3], recruiterUsers[2]],
    [studentUsers[4], recruiterUsers[3]]
  ];

  const messageTemplates = [
    ['Hi, I wanted to ask about the frontend internship.', 'Sure. Please share your availability for an interview.'],
    ['Thanks for reaching out! I am very interested.', 'Great, I will send over the details shortly.'],
    ['Can we reschedule the interview to next week?', 'Let me check the calendar and get back to you.'],
    ['I have submitted my application. Please review.', 'We have received it and will update you soon.'],
    ['Is the position still open?', 'Yes, we are still accepting applications.'],
    ['Do you offer relocation assistance?', 'Yes, we provide relocation support for successful candidates.'],
    ['Could you share more about the team culture?', 'Our team is collaborative and we value work-life balance.'],
    ['I noticed the role is remote. Is that fully remote?', 'Yes, it is fully remote with occasional team meetups.']
  ];

  for (const [userA, userB] of conversationPairs) {
    const conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      lastMessage: '',
      lastMessageAt: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)),
      isArchived: false,
      isPinned: Math.random() > 0.7,
      isMuted: false
    });

    const numMessages = 5 + Math.floor(Math.random() * 6);
    const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    const msgs = [];
    let lastText = '';

    for (let i = 0; i < numMessages; i++) {
      const isA = i % 2 === 0;
      const sender = isA ? userA : userB;
      const text = template[i % template.length];
      lastText = text;
      msgs.push({
        conversation: conversation._id,
        sender: sender._id,
        receiverId: isA ? userB._id : userA._id,
        message: text,
        messageType: 'text',
        clientMessageId: `seed-${conversation._id.toString()}-${i}`,
        status: i < numMessages - 2 ? 'read' : 'sent',
        deliveredAt: new Date(Date.now() - (numMessages - i) * 60000),
        readAt: i < numMessages - 2 ? new Date(Date.now() - (numMessages - i - 1) * 60000) : null
      });
    }

    await Message.insertMany(msgs);
    conversation.lastMessage = lastText;
    await conversation.save();
    conversations.push(conversation);
    allMessages.push(...msgs);
  }

  console.log(`✅ Created ${conversations.length} conversations and ${allMessages.length} messages.\n`);
  return { conversations, allMessages };
}

async function seedPosts(users) {
  console.log('📰 Seeding posts...');
  const posts = [];
  const postAuthors = [users['student1@internlink.test'], users['student2@internlink.test'], users['recruiter1@internlink.test'], users['student5@internlink.test']];

  const postPayloads = [
    { author: postAuthors[0], content: 'Excited to share that I just completed a new React project! 🚀', image: '', backgroundColor: '', likes: [postAuthors[1]._id, postAuthors[2]._id], comments: [{ user: postAuthors[1]._id, text: 'Congrats! Would love to see it.', replies: [{ user: postAuthors[0]._id, text: 'Thanks! I will DM you the link.' }] }, { user: postAuthors[2]._id, text: 'Great work, Alex!', replies: [] }] },
    { author: postAuthors[1], content: 'Data science tip: always visualize your data before modeling.', image: '', backgroundColor: '', likes: [postAuthors[0]._id], comments: [{ user: postAuthors[0]._id, text: 'Absolutely! Visualization reveals so much.', replies: [{ user: postAuthors[1]._id, text: 'Exactly. Matplotlib and Seaborn are my go-tos.' }] }], comments: [] },
    { author: postAuthors[2], content: 'We are hiring! Check out our new frontend internship opening.', image: '', backgroundColor: '', likes: [postAuthors[0]._id, postAuthors[1]._id, postAuthors[3]._id], comments: [{ user: postAuthors[0]._id, text: 'Applied! Hope to hear back soon.', replies: [{ user: postAuthors[2]._id, text: 'We will review applications this week.' }] }, { user: postAuthors[3]._id, text: 'Looks like a great opportunity.', replies: [] }], comments: [] },
    { author: postAuthors[3], content: 'Design systems are the backbone of scalable products.', image: '', backgroundColor: '', likes: [postAuthors[2]._id], comments: [], comments: [] },
    { author: postAuthors[0], content: 'Anyone attending the upcoming tech meetup?', image: '', backgroundColor: '', likes: [postAuthors[1]._id], comments: [{ user: postAuthors[1]._id, text: 'I will be there!', replies: [{ user: postAuthors[0]._id, text: 'Awesome, let us meet up there.' }] }], comments: [] }
  ];

  for (const payload of postPayloads) {
    const post = await Post.create(payload);
    posts.push(post);
    const authorName = postAuthors.find(a => a._id.toString() === payload.author._id.toString())?.name || 'Unknown';
    console.log(`  Created post by ${authorName}`);
  }

  console.log(`✅ Created ${posts.length} posts.\n`);
  return posts;
}

async function seedNotifications(users, applications, interviews, offers, jobs, posts) {
  console.log('🔔 Seeding notifications...');
  const notifications = [];
  const notificationTypes = [
    { type: 'application-submitted', category: 'application', title: 'Application Submitted', message: 'Your application has been submitted successfully.' },
    { type: 'application-shortlisted', category: 'application', title: 'Application Shortlisted', message: 'You have been shortlisted for the next round.' },
    { type: 'interview-scheduled', category: 'interview', title: 'Interview Scheduled', message: 'Your interview has been scheduled.' },
    { type: 'offer-sent', category: 'offer', title: 'Offer Received', message: 'Congratulations! You have received an offer.' },
    { type: 'message', category: 'message', title: 'New Message', message: 'You have a new message.' },
    { type: 'connection-request', category: 'network', title: 'Connection Request', message: 'You have a new connection request.' },
    { type: 'like', category: 'post', title: 'Post Liked', message: 'Someone liked your post.' },
    { type: 'comment', category: 'post', title: 'New Comment', message: 'Someone commented on your post.' },
    { type: 'job-match', category: 'job', title: 'New Job Match', message: 'A new job matches your profile.' },
    { type: 'hiring-created', category: 'hiring', title: 'Hiring Process Started', message: 'Your hiring process has been initiated.' }
  ];

  for (let i = 0; i < 30; i++) {
    const sender = Object.values(users)[Math.floor(Math.random() * Object.values(users).length)];
    const recipientKeys = Object.keys(users).filter(k => k !== sender.email);
    const recipientEmail = recipientKeys[Math.floor(Math.random() * recipientKeys.length)];
    const recipient = users[recipientEmail];
    const template = notificationTypes[i % notificationTypes.length];

    const notification = await Notification.create({
      recipient: recipient._id,
      sender: sender._id,
      title: template.title,
      message: template.message,
      type: template.type,
      category: template.category,
      priority: i % 5 === 0 ? 'high' : 'medium',
      entityId: applications[0]?._id || null,
      entityType: template.category === 'application' ? 'application' : template.category === 'interview' ? 'interview' : template.category === 'offer' ? 'offer' : template.category === 'post' ? 'post' : 'user',
      isRead: Math.random() > 0.5,
      readAt: Math.random() > 0.5 ? new Date() : null,
      isDeleted: false,
      metadata: new Map([['source', 'seed']])
    });
    notifications.push(notification);
  }

  console.log(`✅ Created ${notifications.length} notifications.\n`);
  return notifications;
}

async function seedConnections(users) {
  console.log('🔗 Seeding connections...');
  const connections = [];
  const allUserIds = Object.values(users).map(u => u._id);

  const connectionPayloads = [
    { requester: users['student1@internlink.test']._id, recipient: users['recruiter1@internlink.test']._id, status: 'accepted', note: 'Met at university career fair.' },
    { requester: users['student2@internlink.test']._id, recipient: users['recruiter1@internlink.test']._id, status: 'pending', note: 'Interested in data science roles.' },
    { requester: users['recruiter1@internlink.test']._id, recipient: users['student3@internlink.test']._id, status: 'accepted', note: 'Top candidate for frontend role.' },
    { requester: users['student1@internlink.test']._id, recipient: users['student2@internlink.test']._id, status: 'accepted', note: 'Classmates and project partners.' },
    { requester: users['recruiter2@internlink.test']._id, recipient: users['student4@internlink.test']._id, status: 'pending', note: 'Reached out for backend role.' },
    { requester: users['student5@internlink.test']._id, recipient: users['recruiter3@internlink.test']._id, status: 'pending', note: 'Design internship inquiry.' },
    { requester: users['recruiter4@internlink.test']._id, recipient: users['student6@internlink.test']._id, status: 'accepted', note: 'Strong MERN stack profile.' }
  ];

  for (const payload of connectionPayloads) {
    const connection = await Connection.create(payload);
    connections.push(connection);
  }

  console.log(`✅ Created ${connections.length} connections.\n`);
  return connections;
}

async function seedTalentPool(users) {
  console.log('🌟 Seeding talent pool...');
  const talentEntries = [];
  const recruiterEmails = Object.keys(users).filter(e => e.startsWith('recruiter'));
  const studentEmails = Object.keys(users).filter(e => e.startsWith('student'));

  for (let i = 0; i < 10; i++) {
    const recruiterEmail = recruiterEmails[i % recruiterEmails.length];
    const studentEmail = studentEmails[i % studentEmails.length];
    const entry = await TalentPool.create({
      recruiter: users[recruiterEmail]._id,
      candidate: users[studentEmail]._id,
      isFavorite: i % 3 === 0,
      rating: i % 5,
      notes: i % 2 === 0 ? [{ text: 'Strong candidate for upcoming roles.', date: new Date(), recruiter: users[recruiterEmail]._id }] : [],
      tags: i % 2 === 0 ? ['frontend', 'intern'] : ['backend'],
      collections: [],
      status: ['open-to-work', 'actively-looking', 'not-looking', 'available-later'][i % 4],
      archived: false,
      lastContactedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      activityTimeline: [{ action: 'Added to talent pool', date: new Date(), recruiter: users[recruiterEmail]._id, details: 'Initial outreach.' }]
    });
    talentEntries.push(entry);
  }

  console.log(`✅ Created ${talentEntries.length} talent pool entries.\n`);
  return talentEntries;
}

async function seedTalentCollections(users) {
  console.log('📂 Seeding talent collections...');
  const collections = [];
  const recruiterEmails = Object.keys(users).filter(e => e.startsWith('recruiter'));

  for (let i = 0; i < 3; i++) {
    const collection = await TalentCollection.create({
      recruiter: users[recruiterEmails[i]]._id,
      name: `Collection ${i + 1}`,
      description: 'A curated list of top candidates.',
      candidates: [],
      candidateCount: 0
    });
    collections.push(collection);
  }

  console.log(`✅ Created ${collections.length} talent collections.\n`);
  return collections;
}

async function seedJobAlerts(users, jobs) {
  console.log('🔔 Seeding job alerts...');
  const alerts = [];
  const studentEmails = Object.keys(users).filter(e => e.startsWith('student'));

  for (let i = 0; i < 5; i++) {
    const alert = await JobAlert.create({
      user: users[studentEmails[i % studentEmails.length]]._id,
      keywords: ['internship', 'software'],
      jobType: 'Internship',
      location: 'Remote',
      workMode: 'Remote',
      isActive: true
    });
    alerts.push(alert);
  }

  console.log(`✅ Created ${alerts.length} job alerts.\n`);
  return alerts;
}

async function verifyData(users, companies, jobs, applications, interviews, offers, hirings, conversations, messages, posts, notifications, connections, talentEntries, collections, alerts) {
  console.log('🔍 Verifying data relationships...');

  const [
    userCount,
    profileCount,
    companyCount,
    jobCount,
    appCount,
    interviewCount,
    offerCount,
    hiringCount,
    conversationCount,
    messageCount,
    postCount,
    notificationCount,
    connectionCount,
    talentPoolCount,
    talentCollectionCount,
    jobAlertCount
  ] = await Promise.all([
    User.countDocuments({}),
    Profile.countDocuments({}),
    Company.countDocuments({}),
    Job.countDocuments({}),
    Application.countDocuments({}),
    Interview.countDocuments({}),
    Offer.countDocuments({}),
    Hiring.countDocuments({}),
    Conversation.countDocuments({}),
    Message.countDocuments({}),
    Post.countDocuments({}),
    Notification.countDocuments({}),
    Connection.countDocuments({}),
    TalentPool.countDocuments({}),
    TalentCollection.countDocuments({}),
    JobAlert.countDocuments({})
  ]);

  console.log(`  Users: ${userCount}`);
  console.log(`  Profiles: ${profileCount}`);
  console.log(`  Companies: ${companyCount}`);
  console.log(`  Jobs: ${jobCount}`);
  console.log(`  Applications: ${appCount}`);
  console.log(`  Interviews: ${interviewCount}`);
  console.log(`  Offers: ${offerCount}`);
  console.log(`  Hirings: ${hiringCount}`);
  console.log(`  Conversations: ${conversationCount}`);
  console.log(`  Messages: ${messageCount}`);
  console.log(`  Posts: ${postCount}`);
  console.log(`  Notifications: ${notificationCount}`);
  console.log(`  Connections: ${connectionCount}`);
  console.log(`  Talent Pool: ${talentPoolCount}`);
  console.log(`  Talent Collections: ${talentCollectionCount}`);
  console.log(`  Job Alerts: ${jobAlertCount}`);

  const orphanedApplications = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'users',
        localField: 'recruiter',
        foreignField: '_id',
        as: 'recruiter'
      }
    },
    { $unwind: '$recruiter' }
  ]);

  const orphanedInterviews = await Interview.aggregate([
    {
      $lookup: {
        from: 'applications',
        localField: 'applicationId',
        foreignField: '_id',
        as: 'application'
      }
    },
    { $unwind: '$application' },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'users',
        localField: 'candidateId',
        foreignField: '_id',
        as: 'candidate'
      }
    },
    { $unwind: '$candidate' },
    {
      $lookup: {
        from: 'users',
        localField: 'recruiterId',
        foreignField: '_id',
        as: 'recruiter'
      }
    },
    { $unwind: '$recruiter' }
  ]);

  const orphanedOffers = await Offer.aggregate([
    {
      $lookup: {
        from: 'applications',
        localField: 'applicationId',
        foreignField: '_id',
        as: 'application'
      }
    },
    { $unwind: '$application' },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job'
      }
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'users',
        localField: 'candidateId',
        foreignField: '_id',
        as: 'candidate'
      }
    },
    { $unwind: '$candidate' },
    {
      $lookup: {
        from: 'users',
        localField: 'recruiterId',
        foreignField: '_id',
        as: 'recruiter'
      }
    },
    { $unwind: '$recruiter' }
  ]);

  console.log(`  Validated ${orphanedApplications.length} applications.`);
  console.log(`  Validated ${orphanedInterviews.length} interviews.`);
  console.log(`  Validated ${orphanedOffers.length} offers.`);
  console.log('✅ Relationship validation complete.\n');
}

async function main() {
  console.log('========================================');
  console.log('InternLink Development Seed');
  console.log('========================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internlink');
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}\n`);

    await clearSeedData();

    const users = await seedUsers();
    const companies = await seedCompanies(users);
    const jobs = await seedJobs(users, companies);
    const applications = await seedApplications(users, jobs);
    const interviews = await seedInterviews(applications, users);
    const offers = await seedOffers(applications, interviews, jobs, users, companies);
    const hirings = await seedHirings(offers, applications, users, companies);
    const { conversations, allMessages } = await seedConversationsAndMessages(users);
    const posts = await seedPosts(users);
    const notifications = await seedNotifications(users, applications, interviews, offers, jobs, posts);
    const connections = await seedConnections(users);
    const talentEntries = await seedTalentPool(users);
    const talentCollections = await seedTalentCollections(users);
    const jobAlerts = await seedJobAlerts(users, jobs);

    await verifyData(users, companies, jobs, applications, interviews, offers, hirings, conversations, allMessages, posts, notifications, connections, talentEntries, talentCollections, jobAlerts);

    console.log('========================================');
    console.log('Seed completed successfully.');
    console.log('========================================');
    console.log('\n🔑 Demo Accounts:');
    console.log('  Student 1: student1@internlink.test / ' + DEMO_PASSWORD);
    console.log('  Student 2: student2@internlink.test / ' + DEMO_PASSWORD);
    console.log('  Recruiter 1: recruiter1@internlink.test / ' + DEMO_PASSWORD);
    console.log('  Recruiter 2: recruiter2@internlink.test / ' + DEMO_PASSWORD);
    console.log('\n⚠️  This is DEVELOPMENT/TEST DATA only.');
    console.log('   Do NOT use these credentials in production.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
