import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Job from './models/Job.js';
import User from './models/User.js';

const sampleJobs = [
  {
    company: 'Google',
    title: 'Software Engineering Intern',
    description: 'Join Google for a summer internship program. You will work on real projects, collaborate with experienced engineers, and learn about large-scale system design. This is a fantastic opportunity to grow your skills in a supportive environment.',
    requirements: ['JavaScript', 'React', 'Data Structures', 'Algorithms', 'CS Degree (in progress)'],
    responsibilities: ['Build and maintain web applications', 'Write clean, testable code', 'Participate in code reviews', 'Collaborate with cross-functional teams'],
    benefits: ['Competitive stipend', 'Free meals', 'Mentorship program', 'Housing assistance'],
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    location: 'Mountain View, CA',
    jobType: 'Internship',
    workMode: 'hybrid',
    salaryRange: '$40-50/hr',
    experienceLevel: 'entry',
    industry: 'Technology',
    companySize: '10000+',
    deadline: new Date('2026-12-31'),
    isActive: true
  },
  {
    company: 'Microsoft',
    title: 'Frontend Developer Intern',
    description: 'Microsoft is looking for passionate frontend developer interns to join our Teams division. You will help build the next generation of collaboration tools used by millions worldwide.',
    requirements: ['React', 'TypeScript', 'HTML/CSS', 'Git'],
    responsibilities: ['Develop UI components', 'Optimize performance', 'Write unit tests', 'Participate in agile ceremonies'],
    benefits: ['Paid internship', 'Flexible hours', 'Microsoft certification'],
    skills: ['React', 'TypeScript', 'CSS', 'Git'],
    location: 'Redmond, WA',
    jobType: 'Internship',
    workMode: 'remote',
    salaryRange: '$35-45/hr',
    experienceLevel: 'entry',
    industry: 'Technology',
    companySize: '10000+',
    deadline: new Date('2026-11-15'),
    isActive: true
  },
  {
    company: 'Stripe',
    title: 'Full Stack Developer',
    description: 'Stripe is hiring full stack developers to build payment infrastructure that powers millions of businesses. Work on challenging problems at scale.',
    requirements: ['Node.js', 'React', 'PostgreSQL', 'REST APIs', '2+ years experience'],
    responsibilities: ['Design and build APIs', 'Create dashboard interfaces', 'Ensure security compliance', 'Mentor junior developers'],
    benefits: ['Competitive salary', 'Stock options', 'Remote work', 'Health insurance'],
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    workMode: 'hybrid',
    salaryRange: '$120k-180k',
    experienceLevel: 'mid',
    industry: 'FinTech',
    companySize: '5000+',
    isActive: true
  },
  {
    company: 'Airbnb',
    title: 'React Native Developer',
    description: 'Help build the Airbnb mobile experience. We are looking for a React Native developer to join our mobile team and create beautiful, performant apps.',
    requirements: ['React Native', 'JavaScript', 'iOS/Android', 'REST APIs'],
    responsibilities: ['Build mobile features', 'Improve app performance', 'Code review', 'Collaborate with design team'],
    benefits: ['Travel credit', 'Remote friendly', 'Stock options'],
    skills: ['React Native', 'JavaScript', 'TypeScript', 'Mobile Development'],
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'remote',
    salaryRange: '$130k-190k',
    experienceLevel: 'mid',
    industry: 'Travel & Hospitality',
    companySize: '5000+',
    isActive: true
  },
  {
    company: 'Netflix',
    title: 'Backend Engineer',
    description: 'Netflix is seeking a backend engineer to build and maintain the streaming platform that serves 200M+ users globally.',
    requirements: ['Java', 'Spring Boot', 'AWS', 'Microservices', '5+ years experience'],
    responsibilities: ['Design distributed systems', 'Optimize streaming pipeline', 'Handle scale challenges', 'On-call rotation'],
    benefits: ['Top salary', 'Unlimited PTO', 'Stock options', 'Free Netflix'],
    skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'Docker'],
    location: 'Los Gatos, CA',
    jobType: 'Full-time',
    workMode: 'onsite',
    salaryRange: '$180k-250k',
    experienceLevel: 'senior',
    industry: 'Entertainment',
    companySize: '10000+',
    isActive: true
  },
  {
    company: 'Spotify',
    title: 'Data Science Intern',
    description: 'Join Spotify as a data science intern. Analyze music streaming patterns and help build recommendation systems that delight users.',
    requirements: ['Python', 'Machine Learning', 'Statistics', 'SQL'],
    responsibilities: ['Analyze user data', 'Build ML models', 'Create dashboards', 'Present findings'],
    benefits: ['Paid internship', 'Free Spotify Premium', 'Flexible schedule'],
    skills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis'],
    location: 'New York, NY',
    jobType: 'Internship',
    workMode: 'hybrid',
    salaryRange: '$30-40/hr',
    experienceLevel: 'entry',
    industry: 'Music & Technology',
    companySize: '5000+',
    deadline: new Date('2026-10-01'),
    isActive: true
  },
  {
    company: 'Amazon',
    title: 'Cloud Solutions Architect Intern',
    description: 'AWS is looking for cloud enthusiast interns. Learn about cloud architecture and help customers design scalable solutions.',
    requirements: ['AWS Knowledge', 'Networking Basics', 'Linux', 'Python or Java'],
    responsibilities: ['Design cloud architectures', 'Write technical documentation', 'Assist customer calls', 'Build proof of concepts'],
    benefits: ['Paid internship', 'AWS certification', 'Mentorship'],
    skills: ['AWS', 'Python', 'Linux', 'Networking'],
    location: 'Seattle, WA',
    jobType: 'Internship',
    workMode: 'onsite',
    salaryRange: '$38-48/hr',
    experienceLevel: 'entry',
    industry: 'Cloud Computing',
    companySize: '10000+',
    deadline: new Date('2026-11-30'),
    isActive: true
  },
  {
    company: 'GitHub',
    title: 'DevOps Engineer',
    description: 'GitHub is hiring a DevOps engineer to maintain and improve the CI/CD pipeline that millions of developers rely on daily.',
    requirements: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', '3+ years experience'],
    responsibilities: ['Manage CI/CD pipelines', 'Automate deployments', 'Monitor infrastructure', 'Incident response'],
    benefits: ['Remote first', 'Stock options', 'Learning budget', 'Home office stipend'],
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'remote',
    salaryRange: '$140k-200k',
    experienceLevel: 'mid',
    industry: 'Technology',
    companySize: '1000+',
    isActive: true
  }
];

const seedJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internlink');
    console.log('MongoDB Connected');

    // Find a user to set as recruiter (use the first user found)
    const user = await User.findOne({ role: 'student' });
    if (!user) {
      console.log('No user found. Please register first.');
      process.exit(1);
    }

    // Delete existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Add recruiter to each job
    const jobsWithRecruiter = sampleJobs.map(job => ({
      ...job,
      recruiter: user._id,
      applicants: [],
      savedBy: []
    }));

    // Insert all jobs
    const created = await Job.insertMany(jobsWithRecruiter);
    console.log(`✅ Seeded ${created.length} jobs successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedJobs();