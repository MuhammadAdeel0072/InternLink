import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

import User from './models/User.js';
import Profile from './models/Profile.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

const seedMessages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internlink');
    console.log('MongoDB Connected');

    // Delete old data
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // Find existing users
    let users = await User.find({});
    const existingEmails = users.map(u => u.email);

    // Create extra users if needed
    const extraUsers = [
      { name: 'Ahmed Raza', email: 'ahmed@test.com', password: 'Test@1234', headline: 'MERN Stack Developer', university: 'FAST University', location: 'Lahore, Pakistan', skills: ['React', 'Node.js', 'MongoDB', 'Express'] },
      { name: 'Sara Khan', email: 'sara@test.com', password: 'Test@1234', headline: 'UI/UX Designer', university: 'NUST', location: 'Islamabad, Pakistan', skills: ['Figma', 'React', 'CSS', 'Tailwind'] },
      { name: 'Ali Hassan', email: 'ali@test.com', password: 'Test@1234', headline: 'Backend Engineer', university: 'LUMS', location: 'Lahore, Pakistan', skills: ['Python', 'Django', 'PostgreSQL', 'AWS'] },
      { name: 'Zainab Fatima', email: 'zainab@test.com', password: 'Test@1234', headline: 'Data Science Student', university: 'GIKI', location: 'Karachi, Pakistan', skills: ['Python', 'TensorFlow', 'SQL', 'ML'] },
      { name: 'Bilal Ahmed', email: 'bilal@test.com', password: 'Test@1234', headline: 'React Native Developer', university: 'COMSATS', location: 'Islamabad, Pakistan', skills: ['React Native', 'TypeScript', 'Firebase'] },
    ];

    for (const u of extraUsers) {
      if (!existingEmails.includes(u.email)) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        const newUser = await User.create({
          name: u.name, email: u.email, password: hashedPassword,
          role: 'student', isVerified: true, authProvider: 'local', hasAcceptedTerms: true,
        });
        await Profile.create({
          user: newUser._id, headline: u.headline, university: u.university,
          location: { city: u.location.split(',')[0]?.trim(), country: 'Pakistan' },
          skills: u.skills.map(s => ({ name: s, proficiency: 'intermediate' })),
        });
        console.log(`Created user: ${u.name} (${u.email})`);
      }
    }

    // Reload all users
    users = await User.find({});
    const currentUser = users[0];
    console.log(`\n📱 Your account: ${currentUser.name}`);

    // Messages for each user
    const allMessages = {
      'Ahmed Raza': [
        { from: 'them', text: `Hi ${currentUser.name}! I saw your InternLink profile. Great projects! 👋` },
        { from: 'me', text: 'Thanks Ahmed! Your MERN stack work looks impressive too.' },
        { from: 'them', text: 'Thanks! I noticed we both work with React and Node.js' },
        { from: 'me', text: 'Yes! What kind of projects are you currently working on?' },
        { from: 'them', text: 'Building a real-time collaboration tool with Socket.IO. Quite challenging!' },
        { from: 'me', text: 'That sounds amazing! I\'d love to see it when it\'s ready' },
        { from: 'them', text: 'For sure! Maybe we can collaborate on something together?' },
        { from: 'me', text: 'Absolutely! Let me know if you have any project ideas 💡' },
        { from: 'them', text: 'Will do! I\'ll share some ideas this weekend' },
      ],
      'Sara Khan': [
        { from: 'them', text: 'Hey! Love your profile design on InternLink 🎨' },
        { from: 'me', text: 'Thank you Sara! Your UI/UX portfolio is fantastic' },
        { from: 'them', text: 'Aww thanks! Been working on some dashboard designs lately' },
        { from: 'me', text: 'Would love to see them! I\'m working on frontend development' },
        { from: 'them', text: 'Perfect match! Designers and developers need to collaborate more' },
        { from: 'me', text: 'Completely agree! The best products come from good design+dev teamwork' },
        { from: 'them', text: 'We should connect on a project. I have some Figma mockups ready' },
        { from: 'me', text: 'Count me in! Send them over whenever you\'re ready' },
      ],
      'Ali Hassan': [
        { from: 'me', text: 'Hi Ali! Your backend architecture knowledge is impressive' },
        { from: 'them', text: `Thanks ${currentUser.name}! I see you\'re into MERN stack too` },
        { from: 'me', text: 'Yes! Though I focus more on frontend. Could learn from your backend expertise' },
        { from: 'them', text: 'Backend is fun once you get the hang of it. Happy to help!' },
        { from: 'me', text: 'That would be great! I\'m struggling with database optimization' },
        { from: 'them', text: 'Common problem! Try indexing and aggregation pipelines in MongoDB' },
        { from: 'me', text: 'Great tip! Do you have any recommended resources?' },
        { from: 'them', text: 'Check out MongoDB University - free courses, very practical' },
        { from: 'me', text: 'Awesome, will check it out. Thanks for the advice! 🙏' },
      ],
      'Zainab Fatima': [
        { from: 'them', text: 'Hello! Interested in the intersection of web dev and data science?' },
        { from: 'me', text: 'Definitely! ML-powered web apps are the future' },
        { from: 'them', text: 'Right?! I\'m building a recommendation engine with TensorFlow' },
        { from: 'me', text: 'Wow! Are you integrating it with a web interface?' },
        { from: 'them', text: 'Yes! Using Flask API and planning a React dashboard' },
        { from: 'me', text: 'That\'s exactly the kind of project I\'d love to collaborate on' },
        { from: 'them', text: 'Let\'s discuss it more! Maybe we can work on the frontend together' },
      ],
      'Bilal Ahmed': [
        { from: 'them', text: 'Hey! I see you\'re into web development. Ever tried mobile?' },
        { from: 'me', text: 'Not yet! But React Native has been on my learning list' },
        { from: 'them', text: 'With your React skills, you\'ll pick it up super fast!' },
        { from: 'me', text: 'Really? How similar is it to React for web?' },
        { from: 'them', text: 'Very similar! Components, hooks, state management - same concepts' },
        { from: 'me', text: 'That\'s encouraging! Any good starter projects you\'d recommend?' },
        { from: 'them', text: 'Start with a simple todo app, then try integrating device features' },
        { from: 'me', text: 'Great advice! I\'ll start this weekend. Thanks for the motivation! 🚀' },
        { from: 'them', text: 'Anytime! Send me your progress. Happy to code review!' },
        { from: 'me', text: 'Will do! Excited to learn mobile development' },
      ],
    };

    // Create conversations
    for (let i = 1; i < users.length; i++) {
      const otherUser = users[i];
      const messages = allMessages[otherUser.name] || allMessages['Ahmed Raza'];
      
      const conversation = await Conversation.create({
        participants: [currentUser._id, otherUser._id],
        lastMessage: messages[messages.length - 1].text.substring(0, 50)
      });

      const messageDocs = messages.map((msg, idx) => ({
        conversation: conversation._id,
        sender: msg.from === 'me' ? currentUser._id : otherUser._id,
        text: msg.text,
        createdAt: new Date(Date.now() - (messages.length - idx) * 1800000)
      }));

      await Message.insertMany(messageDocs);
      console.log(`  💬 Chat with ${otherUser.name}: ${messages.length} messages`);
    }

    console.log(`\n✅ Created ${users.length - 1} conversations!`);
    console.log(`📱 Go to http://localhost:5173/messages`);
    console.log(`\n👥 Users:`);
    users.forEach(u => console.log(`   - ${u.name} (${u.email} / password: Test@1234)`));

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedMessages();