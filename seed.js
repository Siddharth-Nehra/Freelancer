const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const ContactRequest = require('./models/ContactRequest');
const Connection = require('./models/Connection');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancehub';

// Demo Freelancers
const demoFreelancers = [
    {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        password: 'password123',
        phone: '+1-555-0101',
        type: 'freelancer',
        profile: {
            title: 'Senior Full-Stack Developer',
            rate: 75,
            skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
            bio: 'Experienced full-stack developer with 8+ years building scalable web applications. Specialized in React and Node.js ecosystems.',
            portfolio: 'https://sarahjohnson.dev',
            availability: 'Available',
            experience: 8
        }
    },
    {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        password: 'password123',
        phone: '+1-555-0102',
        type: 'freelancer',
        profile: {
            title: 'UI/UX Designer & Frontend Developer',
            rate: 65,
            skills: ['Figma', 'React', 'CSS', 'JavaScript', 'Adobe XD'],
            bio: 'Creative designer and developer passionate about creating beautiful, user-friendly interfaces. 6 years of experience in design and frontend development.',
            portfolio: 'https://michaelchen.design',
            availability: 'Available',
            experience: 6
        }
    },
    {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        password: 'password123',
        phone: '+1-555-0103',
        type: 'freelancer',
        profile: {
            title: 'Python Developer & Data Analyst',
            rate: 70,
            skills: ['Python', 'Data Analysis', 'Machine Learning', 'Pandas', 'SQL'],
            bio: 'Data scientist and Python developer with expertise in data analysis, machine learning, and building data-driven applications.',
            portfolio: 'https://emilyrodriguez.tech',
            availability: 'Limited',
            experience: 7
        }
    },
    {
        name: 'David Kim',
        email: 'david.kim@email.com',
        password: 'password123',
        phone: '+1-555-0104',
        type: 'freelancer',
        profile: {
            title: 'Mobile App Developer',
            rate: 80,
            skills: ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin'],
            bio: 'Mobile app developer specializing in cross-platform development. Built 20+ apps for iOS and Android platforms.',
            portfolio: 'https://davidkim.dev',
            availability: 'Available',
            experience: 9
        }
    },
    {
        name: 'Jessica Martinez',
        email: 'jessica.martinez@email.com',
        password: 'password123',
        phone: '+1-555-0105',
        type: 'freelancer',
        profile: {
            title: 'Content Writer & Marketing Specialist',
            rate: 45,
            skills: ['Content Writing', 'SEO', 'Marketing', 'Copywriting', 'Social Media'],
            bio: 'Professional content writer and marketing specialist with 5 years of experience creating engaging content for various industries.',
            portfolio: 'https://jessicamartinez.com',
            availability: 'Available',
            experience: 5
        }
    },
    {
        name: 'Alex Thompson',
        email: 'alex.thompson@email.com',
        password: 'password123',
        phone: '+1-555-0106',
        type: 'freelancer',
        profile: {
            title: 'DevOps Engineer',
            rate: 85,
            skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
            bio: 'DevOps engineer with expertise in cloud infrastructure, containerization, and automation. Helping teams deploy faster and more reliably.',
            portfolio: 'https://alexthompson.io',
            availability: 'Limited',
            experience: 10
        }
    },
    {
        name: 'Maria Garcia',
        email: 'maria.garcia@email.com',
        password: 'password123',
        phone: '+1-555-0107',
        type: 'freelancer',
        profile: {
            title: 'Graphic Designer',
            rate: 50,
            skills: ['Photoshop', 'Illustrator', 'InDesign', 'Branding', 'Logo Design'],
            bio: 'Creative graphic designer specializing in branding, logo design, and visual identity. 7 years of experience working with startups and established brands.',
            portfolio: 'https://mariagarcia.design',
            availability: 'Available',
            experience: 7
        }
    },
    {
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        password: 'password123',
        phone: '+1-555-0108',
        type: 'freelancer',
        profile: {
            title: 'WordPress Developer',
            rate: 55,
            skills: ['WordPress', 'PHP', 'WooCommerce', 'Elementor', 'Custom Themes'],
            bio: 'WordPress expert with extensive experience building custom themes, plugins, and e-commerce solutions. 8 years in web development.',
            portfolio: 'https://jameswilson.dev',
            availability: 'Available',
            experience: 8
        }
    }
];

// Demo Clients
const demoClients = [
    {
        name: 'TechStart Inc.',
        email: 'contact@techstart.com',
        password: 'password123',
        phone: '+1-555-0201',
        type: 'client',
        profile: {
            company: 'TechStart Inc.',
            industry: 'Technology',
            about: 'A fast-growing tech startup focused on innovative software solutions. We work with talented freelancers to bring our vision to life.',
            website: 'https://techstart.com'
        }
    },
    {
        name: 'Creative Agency LLC',
        email: 'hello@creativeagency.com',
        password: 'password123',
        phone: '+1-555-0202',
        type: 'client',
        profile: {
            company: 'Creative Agency LLC',
            industry: 'Marketing & Advertising',
            about: 'Full-service creative agency providing branding, design, and marketing services to clients worldwide.',
            website: 'https://creativeagency.com'
        }
    },
    {
        name: 'E-Commerce Solutions',
        email: 'info@ecomsolutions.com',
        password: 'password123',
        phone: '+1-555-0203',
        type: 'client',
        profile: {
            company: 'E-Commerce Solutions',
            industry: 'E-Commerce',
            about: 'We help businesses build and optimize their online stores. Looking for skilled developers and designers.',
            website: 'https://ecomsolutions.com'
        }
    },
    {
        name: 'Digital Marketing Pro',
        email: 'team@digitalmarketingpro.com',
        password: 'password123',
        phone: '+1-555-0204',
        type: 'client',
        profile: {
            company: 'Digital Marketing Pro',
            industry: 'Digital Marketing',
            about: 'Leading digital marketing agency seeking talented content creators and marketing specialists.',
            website: 'https://digitalmarketingpro.com'
        }
    }
];

// Demo Jobs
const demoJobs = [
    {
        title: 'Build E-Commerce Platform with React',
        description: 'Looking for an experienced React developer to build a modern e-commerce platform. Must have experience with state management, API integration, and payment processing. The project includes product catalog, shopping cart, checkout, and admin dashboard.',
        budget: 5000,
        skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        status: 'open'
    },
    {
        title: 'Mobile App Design & Development',
        description: 'Need a talented mobile app developer to create a fitness tracking app for iOS and Android. Should include user profiles, workout tracking, progress charts, and social features.',
        budget: 8000,
        skills: ['React Native', 'iOS', 'Android', 'Firebase'],
        status: 'open'
    },
    {
        title: 'Website Redesign & Branding',
        description: 'Seeking a UI/UX designer and frontend developer to redesign our company website. Need modern, responsive design with improved user experience. Includes logo redesign and brand guidelines.',
        budget: 3500,
        skills: ['Figma', 'React', 'CSS', 'Design'],
        status: 'open'
    },
    {
        title: 'Content Marketing Campaign',
        description: 'Looking for a content writer and marketing specialist to create blog posts, social media content, and email campaigns for our SaaS product launch.',
        budget: 2500,
        skills: ['Content Writing', 'SEO', 'Marketing', 'Copywriting'],
        status: 'open'
    },
    {
        title: 'Data Analysis Dashboard',
        description: 'Need a Python developer to build a data analysis dashboard. Should process large datasets, create visualizations, and provide insights. Experience with pandas, matplotlib, and SQL required.',
        budget: 4000,
        skills: ['Python', 'Data Analysis', 'Pandas', 'SQL'],
        status: 'open'
    },
    {
        title: 'WordPress Custom Theme Development',
        description: 'Looking for a WordPress developer to create a custom theme for our news website. Should be fast, SEO-friendly, and include custom post types and widgets.',
        budget: 3000,
        skills: ['WordPress', 'PHP', 'Custom Themes'],
        status: 'open'
    },
    {
        title: 'DevOps Infrastructure Setup',
        description: 'Need a DevOps engineer to set up CI/CD pipeline, containerize our application, and deploy to AWS. Should include monitoring and auto-scaling configuration.',
        budget: 6000,
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        status: 'open'
    },
    {
        title: 'Brand Identity & Logo Design',
        description: 'Seeking a graphic designer to create a complete brand identity including logo, color palette, typography, and brand guidelines for our new startup.',
        budget: 2000,
        skills: ['Photoshop', 'Illustrator', 'Branding', 'Logo Design'],
        status: 'open'
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Job.deleteMany({});
        await ContactRequest.deleteMany({});
        await Connection.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create freelancers
        console.log('👨‍💻 Creating freelancers...');
        const createdFreelancers = [];
        for (const freelancer of demoFreelancers) {
            const user = new User(freelancer);
            await user.save();
            createdFreelancers.push(user);
            console.log(`   ✓ Created freelancer: ${freelancer.name}`);
        }
        console.log(`✅ Created ${createdFreelancers.length} freelancers`);

        // Create clients
        console.log('🏢 Creating clients...');
        const createdClients = [];
        for (const client of demoClients) {
            const user = new User(client);
            await user.save();
            createdClients.push(user);
            console.log(`   ✓ Created client: ${client.name}`);
        }
        console.log(`✅ Created ${createdClients.length} clients`);

        // Create jobs
        console.log('📋 Creating jobs...');
        const createdJobs = [];
        for (let i = 0; i < demoJobs.length; i++) {
            const jobData = demoJobs[i];
            const client = createdClients[i % createdClients.length];
            const job = new Job({
                clientId: client._id,
                clientName: client.name,
                ...jobData
            });
            await job.save();
            createdJobs.push(job);
            console.log(`   ✓ Created job: ${jobData.title}`);
        }
        console.log(`✅ Created ${createdJobs.length} jobs`);

        // Create some contact requests
        console.log('📧 Creating contact requests...');
        let requestCount = 0;
        for (let i = 0; i < 3; i++) {
            const client = createdClients[i];
            const freelancer = createdFreelancers[i];
            const request = new ContactRequest({
                clientId: client._id,
                clientName: client.name,
                clientEmail: client.email,
                clientPhone: client.phone,
                freelancerId: freelancer._id,
                summary: `Interested in working with ${freelancer.name} on a new project. Looking for ${freelancer.profile.title.toLowerCase()}.`,
                budget: `$${freelancer.profile.rate * 20 * 2} - $${freelancer.profile.rate * 20 * 4}`,
                timeline: '2-4 weeks',
                status: 'pending'
            });
            await request.save();
            requestCount++;
            console.log(`   ✓ Created contact request from ${client.name} to ${freelancer.name}`);
        }
        console.log(`✅ Created ${requestCount} contact requests`);

        // Create some connections (accepted requests)
        console.log('🤝 Creating connections...');
        let connectionCount = 0;
        for (let i = 0; i < 2; i++) {
            const client = createdClients[i + 1];
            const freelancer = createdFreelancers[i + 3];
            const connection = new Connection({
                clientId: client._id,
                clientName: client.name,
                clientEmail: client.email,
                clientPhone: client.phone,
                freelancerId: freelancer._id,
                freelancerName: freelancer.name,
                freelancerEmail: freelancer.email,
                freelancerPhone: freelancer.phone,
                status: 'accepted'
            });
            await connection.save();
            connectionCount++;
            console.log(`   ✓ Created connection between ${client.name} and ${freelancer.name}`);
        }
        console.log(`✅ Created ${connectionCount} connections`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - ${createdFreelancers.length} Freelancers`);
        console.log(`   - ${createdClients.length} Clients`);
        console.log(`   - ${createdJobs.length} Jobs`);
        console.log(`   - ${requestCount} Contact Requests`);
        console.log(`   - ${connectionCount} Connections`);
        console.log('\n💡 You can now login with any of these accounts:');
        console.log('   Email: sarah.johnson@email.com (Freelancer)');
        console.log('   Email: contact@techstart.com (Client)');
        console.log('   Password: password123 (for all demo accounts)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();

