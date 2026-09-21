import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Job from './models/Job.js';
import Application from './models/Application.js';
import Notification from './models/Notification.js';

const L = (n) => n * 100000; // lakh -> rupees

const recruiters = [
  { name: 'Riya Mehta', email: 'recruiter@demo.com', company: { name: 'Nimbus Labs', industry: 'Software', size: '51-200', website: 'https://example.com', description: 'We build cloud tooling for growing engineering teams.' } },
  { name: 'Karan Shah', email: 'hr@bluecart.demo', company: { name: 'BlueCart', industry: 'E-commerce', size: '201-500', website: 'https://example.com', description: 'BlueCart helps neighbourhood stores sell online.' } },
  { name: 'Anita Desai', email: 'hr@finpath.demo', company: { name: 'FinPath', industry: 'Fintech', size: '11-50', website: 'https://example.com', description: 'Simple investing for first-time savers.' } },
];

const job = (r, o) => ({ recruiter: r._id, company: { name: r.company.name }, openings: 2, ...o });

const desc = (role, extra) =>
  `About the role\nWe are looking for a ${role} to join our team. You will own features end to end, work closely with design and product, and ship work that real customers use every day.\n\nWhat you will do\n- Build and maintain reliable, well-tested features\n- Review code and share knowledge with the team\n- Take part in planning and help shape the roadmap\n${extra ? `- ${extra}\n` : ''}\nWhat we look for\n- Solid fundamentals and curiosity to learn\n- Clear communication and a sense of ownership\n- Experience with the skills listed on this page`;

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shortlist');
  await Promise.all([User.deleteMany({}), Job.deleteMany({}), Application.deleteMany({}), Notification.deleteMany({})]);

  const rec = [];
  for (const r of recruiters) rec.push(await User.create({ ...r, password: 'password123', role: 'recruiter' }));

  const seeker = await User.create({
    name: 'Aarav Patel', email: 'seeker@demo.com', password: 'password123', role: 'seeker',
    headline: 'MERN stack developer', location: 'Rajkot, Gujarat', experienceYears: 1,
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'Tailwind CSS'],
    bio: 'Final-year CS graduate who enjoys building full-stack products.', education: 'B.E. Computer Engineering',
    links: { github: 'https://github.com', linkedin: 'https://linkedin.com' },
  });
  await User.create({
    name: 'Nisha Joshi', email: 'nisha@demo.com', password: 'password123', role: 'seeker',
    headline: 'UI/UX designer', location: 'Ahmedabad', experienceYears: 3, skills: ['Figma', 'UI Design', 'Prototyping', 'CSS'],
  });

  const d = new Date();
  const ago = (days) => new Date(d.getTime() - days * 86400000);
  const jobs = await Job.insertMany([
    job(rec[0], { title: 'Full Stack Developer (MERN)', category: 'Engineering', location: 'Rajkot, Gujarat', workMode: 'hybrid', type: 'full-time', experienceLevel: 'junior', salary: { min: L(5), max: L(9) }, skills: ['React', 'Node.js', 'MongoDB', 'Express', 'REST APIs'], perks: ['Health insurance', 'Flexible hours', 'Learning budget'], description: desc('Full Stack Developer', 'Design REST APIs and MongoDB schemas'), featured: true, createdAt: ago(1), views: 142 }),
    job(rec[0], { title: 'Frontend Engineer (React)', category: 'Engineering', location: 'Remote', workMode: 'remote', type: 'full-time', experienceLevel: 'mid', salary: { min: L(10), max: L(18) }, skills: ['React', 'TypeScript', 'Tailwind CSS', 'Testing'], perks: ['Remote first', 'Home office stipend'], description: desc('Frontend Engineer'), featured: true, createdAt: ago(2), views: 210 }),
    job(rec[0], { title: 'Backend Engineer (Node.js)', category: 'Engineering', location: 'Bengaluru, Karnataka', workMode: 'hybrid', type: 'full-time', experienceLevel: 'senior', salary: { min: L(20), max: L(32) }, skills: ['Node.js', 'PostgreSQL', 'AWS', 'Docker', 'System Design'], perks: ['ESOPs', 'Health insurance'], description: desc('Backend Engineer'), createdAt: ago(4), views: 96 }),
    job(rec[0], { title: 'Web Development Intern', category: 'Engineering', location: 'Rajkot, Gujarat', workMode: 'onsite', type: 'internship', experienceLevel: 'fresher', salary: { min: L(1.2), max: L(2.4) }, skills: ['JavaScript', 'React', 'HTML', 'CSS'], perks: ['Mentorship', 'Pre-placement offer'], description: desc('Web Development Intern'), createdAt: ago(1), views: 301 }),
    job(rec[1], { title: 'Product Designer', category: 'Design', location: 'Ahmedabad, Gujarat', workMode: 'hybrid', type: 'full-time', experienceLevel: 'mid', salary: { min: L(8), max: L(14) }, skills: ['Figma', 'UI Design', 'Prototyping', 'User Research'], perks: ['Design tool budget', 'Flexible hours'], description: desc('Product Designer'), featured: true, createdAt: ago(3), views: 118 }),
    job(rec[1], { title: 'Digital Marketing Executive', category: 'Marketing', location: 'Surat, Gujarat', workMode: 'onsite', type: 'full-time', experienceLevel: 'junior', salary: { min: L(3), max: L(5) }, skills: ['SEO', 'Google Ads', 'Content Writing', 'Analytics'], description: desc('Digital Marketing Executive'), createdAt: ago(5), views: 64 }),
    job(rec[1], { title: 'Customer Support Associate', category: 'Customer Support', location: 'Remote', workMode: 'remote', type: 'full-time', experienceLevel: 'fresher', salary: { min: L(2.4), max: L(3.6) }, skills: ['Communication', 'Hindi', 'English', 'CRM'], perks: ['Night shift allowance'], description: desc('Customer Support Associate'), createdAt: ago(2), views: 88 }),
    job(rec[1], { title: 'Data Analyst', category: 'Data & Analytics', location: 'Pune, Maharashtra', workMode: 'hybrid', type: 'full-time', experienceLevel: 'junior', salary: { min: L(6), max: L(10) }, skills: ['SQL', 'Python', 'Power BI', 'Excel'], description: desc('Data Analyst'), createdAt: ago(6), views: 77 }),
    job(rec[1], { title: 'Sales Development Representative', category: 'Sales', location: 'Mumbai, Maharashtra', workMode: 'onsite', type: 'full-time', experienceLevel: 'fresher', salary: { min: L(3.5), max: L(6) }, skills: ['Communication', 'CRM', 'Cold Outreach'], perks: ['Uncapped incentives'], description: desc('Sales Development Representative'), createdAt: ago(7), views: 41 }),
    job(rec[2], { title: 'Mobile App Developer (React Native)', category: 'Engineering', location: 'Remote', workMode: 'remote', type: 'contract', experienceLevel: 'mid', salary: { min: L(12), max: L(20) }, skills: ['React Native', 'JavaScript', 'REST APIs', 'Redux'], description: desc('Mobile App Developer'), createdAt: ago(3), views: 132 }),
    job(rec[2], { title: 'Financial Analyst', category: 'Finance', location: 'Mumbai, Maharashtra', workMode: 'onsite', type: 'full-time', experienceLevel: 'mid', salary: { min: L(9), max: L(15) }, skills: ['Excel', 'Financial Modelling', 'SQL'], description: desc('Financial Analyst'), createdAt: ago(8), views: 52 }),
    job(rec[2], { title: 'HR Generalist', category: 'Human Resources', location: 'Ahmedabad, Gujarat', workMode: 'onsite', type: 'full-time', experienceLevel: 'junior', salary: { min: L(3.6), max: L(5.5) }, skills: ['Recruitment', 'Communication', 'Onboarding'], description: desc('HR Generalist'), createdAt: ago(9), views: 33 }),
    job(rec[2], { title: 'DevOps Engineer', category: 'Engineering', location: 'Hyderabad, Telangana', workMode: 'hybrid', type: 'full-time', experienceLevel: 'senior', salary: { min: L(18), max: L(28) }, skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'], description: desc('DevOps Engineer'), createdAt: ago(5), views: 109 }),
    job(rec[2], { title: 'Freelance Content Writer', category: 'Marketing', location: 'Remote', workMode: 'remote', type: 'freelance', experienceLevel: 'junior', salary: { min: L(2), max: L(4) }, skills: ['Content Writing', 'SEO', 'English'], description: desc('Freelance Content Writer'), createdAt: ago(10), views: 26 }),
    job(rec[0], { title: 'QA Automation Engineer', category: 'Engineering', location: 'Bengaluru, Karnataka', workMode: 'hybrid', type: 'part-time', experienceLevel: 'mid', salary: { min: L(7), max: L(12) }, skills: ['Testing', 'JavaScript', 'Cypress', 'CI/CD'], description: desc('QA Automation Engineer'), createdAt: ago(11), views: 45 }),
  ]);

  // A few applications so dashboards are not empty
  const a1 = await Application.create({ job: jobs[1]._id, applicant: seeker._id, recruiter: rec[0]._id, coverLetter: 'I love building interfaces in React and would enjoy joining your team.', resume: { url: '/uploads/resumes/sample.pdf', originalName: 'Aarav_Patel_Resume.pdf' }, status: 'shortlisted', statusHistory: [{ status: 'applied', note: 'Application submitted' }, { status: 'reviewing' }, { status: 'shortlisted', note: 'Strong portfolio' }] });
  const a2 = await Application.create({ job: jobs[3]._id, applicant: seeker._id, recruiter: rec[0]._id, coverLetter: 'Keen to learn and contribute.', resume: { url: '/uploads/resumes/sample.pdf', originalName: 'Aarav_Patel_Resume.pdf' }, statusHistory: [{ status: 'applied', note: 'Application submitted' }] });
  await Job.updateOne({ _id: jobs[1]._id }, { $inc: { applicantsCount: 1 } });
  await Job.updateOne({ _id: jobs[3]._id }, { $inc: { applicantsCount: 1 } });
  await Notification.create({ user: seeker._id, title: 'Application update', message: 'Your application for Frontend Engineer (React) at Nimbus Labs is now: shortlisted', link: '/dashboard' });
  await Notification.create({ user: rec[0]._id, title: 'New application', message: 'Aarav Patel applied for Web Development Intern', link: `/recruiter/jobs/${jobs[3]._id}/applicants` });
  void a1; void a2;

  await User.updateOne({ _id: seeker._id }, { savedJobs: [jobs[0]._id, jobs[4]._id] });

  console.log('\nSeed complete. Demo logins (password: password123)');
  console.log('  Job seeker : seeker@demo.com');
  console.log('  Recruiter  : recruiter@demo.com\n');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
