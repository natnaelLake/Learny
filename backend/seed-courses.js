const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const Course = require('./models/Course');
const User = require('./models/User');
const Section = require('./models/Section');
const Lesson = require('./models/Lesson');

// User data
const userData = [
  // Admin/Instructor
  {
    name: 'Admin Instructor',
    email: 'admin@learning.com',
    password: 'admin123456',
    role: 'instructor',
    instructorProfile: {
      expertise: ['Web Development', 'Data Science', 'Design'],
      experience: 8,
      education: ['Computer Science', 'MBA'],
      certifications: ['AWS Certified', 'Google Cloud Certified'],
      bio: 'Experienced instructor with expertise in multiple domains including web development, data science, and design. Passionate about teaching and helping students succeed.'
    }
  },
  // Additional Instructors
  {
    name: 'Sarah Johnson',
    email: 'sarah@learning.com',
    password: 'sarah123456',
    role: 'instructor',
    instructorProfile: {
      expertise: ['UI/UX Design', 'Product Design', 'Design Systems'],
      experience: 6,
      education: ['Design', 'Human-Computer Interaction'],
      certifications: ['Figma Certified', 'Adobe Creative Suite'],
      bio: 'Senior UI/UX designer with 6+ years of experience creating beautiful and functional user interfaces. Specialized in design systems and user research.'
    }
  },
  {
    name: 'Michael Chen',
    email: 'michael@learning.com',
    password: 'michael123456',
    role: 'instructor',
    instructorProfile: {
      expertise: ['Backend Development', 'DevOps', 'System Architecture'],
      experience: 10,
      education: ['Computer Science', 'Software Engineering'],
      certifications: ['AWS Solutions Architect', 'Docker Certified'],
      bio: 'Senior backend developer and DevOps engineer with extensive experience in building scalable applications and managing cloud infrastructure.'
    }
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily@learning.com',
    password: 'emily123456',
    role: 'instructor',
    instructorProfile: {
      expertise: ['Data Science', 'Machine Learning', 'Python'],
      experience: 7,
      education: ['Data Science', 'Statistics'],
      certifications: ['Google Data Analytics', 'TensorFlow Developer'],
      bio: 'Data scientist and machine learning engineer passionate about making AI accessible to everyone. Expert in Python, pandas, and scikit-learn.'
    }
  },
  // Students
  {
    name: 'John Smith',
    email: 'john@student.com',
    password: 'john123456',
    role: 'student',
    studentProfile: {
      interests: ['Web Development', 'JavaScript'],
      experience: 'beginner',
      goals: 'Become a full-stack developer'
    }
  },
  {
    name: 'Lisa Wang',
    email: 'lisa@student.com',
    password: 'lisa123456',
    role: 'student',
    studentProfile: {
      interests: ['Data Science', 'Python'],
      experience: 'intermediate',
      goals: 'Transition to data science career'
    }
  },
  {
    name: 'David Brown',
    email: 'david@student.com',
    password: 'david123456',
    role: 'student',
    studentProfile: {
      interests: ['Design', 'UI/UX'],
      experience: 'beginner',
      goals: 'Learn modern design principles'
    }
  },
  {
    name: 'Maria Garcia',
    email: 'maria@student.com',
    password: 'maria123456',
    role: 'student',
    studentProfile: {
      interests: ['Mobile Development', 'React Native'],
      experience: 'intermediate',
      goals: 'Build mobile apps'
    }
  }
];

// Course data with instructor assignments
const courseData = [
  // Admin Instructor Courses
  {
    title: "Complete React Development Bootcamp 2024",
    description: "Master React.js from scratch to advanced concepts. Build real-world projects, learn hooks, context, Redux, and modern React patterns. Perfect for beginners and intermediate developers.",
    category: "Web Development",
    level: "intermediate",
    price: 89.99,
    originalPrice: 129.99,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
    tags: ["React", "JavaScript", "Frontend", "Web Development", "Hooks"],
    whatYouWillLearn: [
      "Build modern React applications with functional components",
      "Master React Hooks (useState, useEffect, useContext, useReducer)",
      "Implement state management with Context API and Redux",
      "Create reusable components and custom hooks",
      "Build and deploy React applications",
      "Work with APIs and handle async operations"
    ],
    requirements: [
      "Basic knowledge of HTML, CSS, and JavaScript",
      "A computer with internet connection",
      "Willingness to learn and practice"
    ],
    isPublished: true,
    isFeatured: true,
    enrollmentCount: 1247,
    rating: 4.8,
    reviewCount: 89,
    instructorEmail: 'admin@learning.com'
  },
  {
    title: "Node.js Backend Development",
    description: "Build scalable backend applications with Node.js, Express, and MongoDB. Learn REST APIs, authentication, database design, and deployment.",
    category: "Backend Development",
    level: "advanced",
    price: 94.99,
    originalPrice: 119.99,
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    tags: ["Node.js", "Express", "MongoDB", "Backend", "API"],
    whatYouWillLearn: [
      "Build RESTful APIs with Express.js",
      "Database design and MongoDB integration",
      "Authentication and authorization",
      "Error handling and validation",
      "Testing and deployment strategies",
      "Performance optimization and scaling"
    ],
    requirements: [
      "JavaScript fundamentals",
      "Basic understanding of web development",
      "Familiarity with databases"
    ],
    isPublished: true,
    isFeatured: true,
    enrollmentCount: 743,
    rating: 4.6,
    reviewCount: 45,
    instructorEmail: 'admin@learning.com'
  },
  // Sarah Johnson Courses (Design)
  {
    title: "UI/UX Design Masterclass",
    description: "Learn modern UI/UX design principles, tools, and techniques. Master Figma, create beautiful interfaces, and understand user experience design.",
    category: "Design",
    level: "intermediate",
    price: 69.99,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
    tags: ["UI/UX", "Design", "Figma", "Prototyping", "User Research"],
    whatYouWillLearn: [
      "Design thinking and user-centered design",
      "UI design principles and best practices",
      "Master Figma for design and prototyping",
      "User research and usability testing",
      "Design systems and component libraries",
      "Portfolio creation and design presentation"
    ],
    requirements: [
      "Basic computer skills",
      "Access to Figma (free account)",
      "Creative mindset"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 892,
    rating: 4.7,
    reviewCount: 67,
    instructorEmail: 'sarah@learning.com'
  },
  {
    title: "Design Systems & Component Libraries",
    description: "Master the art of creating scalable design systems and component libraries. Learn to build consistent, maintainable design systems for large applications.",
    category: "Design",
    level: "advanced",
    price: 79.99,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
    tags: ["Design Systems", "Components", "Figma", "Design Tokens", "Documentation"],
    whatYouWillLearn: [
      "Create comprehensive design systems",
      "Build reusable component libraries",
      "Implement design tokens and variables",
      "Document design patterns and guidelines",
      "Collaborate with developers effectively",
      "Maintain and scale design systems"
    ],
    requirements: [
      "Basic UI/UX design knowledge",
      "Familiarity with Figma",
      "Understanding of design principles"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 456,
    rating: 4.9,
    reviewCount: 34,
    instructorEmail: 'sarah@learning.com'
  },
  // Michael Chen Courses (Backend/DevOps)
  {
    title: "DevOps & CI/CD Pipeline Mastery",
    description: "Master DevOps practices, Docker, Kubernetes, and CI/CD pipelines. Learn to automate deployment, manage infrastructure, and scale applications.",
    category: "DevOps",
    level: "advanced",
    price: 109.99,
    originalPrice: 149.99,
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=600&fit=crop",
    tags: ["DevOps", "Docker", "Kubernetes", "CI/CD", "AWS"],
    whatYouWillLearn: [
      "Docker containerization and orchestration",
      "Kubernetes cluster management",
      "CI/CD pipeline automation",
      "Cloud infrastructure management",
      "Monitoring and logging",
      "Security best practices"
    ],
    requirements: [
      "Linux command line experience",
      "Basic networking knowledge",
      "Understanding of web applications"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 456,
    rating: 4.5,
    reviewCount: 34,
    instructorEmail: 'michael@learning.com'
  },
  {
    title: "Microservices Architecture",
    description: "Learn to design, build, and deploy microservices-based applications. Understand service discovery, API gateways, and distributed systems.",
    category: "Backend Development",
    level: "advanced",
    price: 99.99,
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    tags: ["Microservices", "Architecture", "Docker", "Kubernetes", "API Gateway"],
    whatYouWillLearn: [
      "Design microservices architecture",
      "Implement service discovery and communication",
      "Build API gateways and load balancers",
      "Handle distributed data management",
      "Monitor and debug microservices",
      "Deploy and scale microservices"
    ],
    requirements: [
      "Backend development experience",
      "Knowledge of Docker and containers",
      "Understanding of REST APIs"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 234,
    rating: 4.7,
    reviewCount: 23,
    instructorEmail: 'michael@learning.com'
  },
  // Emily Rodriguez Courses (Data Science)
  {
    title: "Python for Data Science & Machine Learning",
    description: "Learn Python programming for data science, machine learning, and AI. Master pandas, numpy, matplotlib, scikit-learn, and build real data science projects.",
    category: "Data Science",
    level: "beginner",
    price: 79.99,
    originalPrice: 99.99,
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop",
    tags: ["Python", "Data Science", "Machine Learning", "AI", "Pandas"],
    whatYouWillLearn: [
      "Python programming fundamentals for data science",
      "Data manipulation with pandas and numpy",
      "Data visualization with matplotlib and seaborn",
      "Machine learning algorithms with scikit-learn",
      "Statistical analysis and hypothesis testing",
      "Real-world data science projects"
    ],
    requirements: [
      "No programming experience required",
      "Basic math skills",
      "Curiosity about data and AI"
    ],
    isPublished: true,
    isFeatured: true,
    enrollmentCount: 2156,
    rating: 4.9,
    reviewCount: 156,
    instructorEmail: 'emily@learning.com'
  },
  {
    title: "Deep Learning with TensorFlow",
    description: "Master deep learning concepts and build neural networks with TensorFlow. Learn CNN, RNN, transformers, and real-world AI applications.",
    category: "Data Science",
    level: "advanced",
    price: 119.99,
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop",
    tags: ["Deep Learning", "TensorFlow", "Neural Networks", "CNN", "RNN"],
    whatYouWillLearn: [
      "Neural network fundamentals",
      "Convolutional Neural Networks (CNN)",
      "Recurrent Neural Networks (RNN)",
      "Transformer architecture",
      "Computer vision applications",
      "Natural language processing"
    ],
    requirements: [
      "Python programming experience",
      "Basic machine learning knowledge",
      "Understanding of linear algebra"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 567,
    rating: 4.8,
    reviewCount: 45,
    instructorEmail: 'emily@learning.com'
  },
  // Draft Courses
  {
    title: "Mobile App Development with React Native",
    description: "Create cross-platform mobile apps with React Native. Build iOS and Android apps with one codebase, learn navigation, state management, and native features.",
    category: "Mobile Development",
    level: "intermediate",
    price: 84.99,
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop",
    tags: ["React Native", "Mobile", "iOS", "Android", "Cross-platform"],
    whatYouWillLearn: [
      "React Native fundamentals and setup",
      "Navigation and routing",
      "State management with Redux",
      "Native device features integration",
      "App store deployment",
      "Performance optimization"
    ],
    requirements: [
      "React.js knowledge",
      "Basic JavaScript skills",
      "Mac for iOS development (optional)"
    ],
    isPublished: false,
    isFeatured: false,
    enrollmentCount: 0,
    rating: 0,
    reviewCount: 0,
    instructorEmail: 'admin@learning.com'
  },
  {
    title: "Digital Marketing Strategy",
    description: "Learn comprehensive digital marketing strategies. Master SEO, social media marketing, content marketing, and analytics to grow your business.",
    category: "Marketing",
    level: "beginner",
    price: 59.99,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    tags: ["Marketing", "SEO", "Social Media", "Analytics", "Growth"],
    whatYouWillLearn: [
      "SEO optimization and keyword research",
      "Social media marketing strategies",
      "Content marketing and copywriting",
      "Google Analytics and tracking",
      "Email marketing campaigns",
      "Marketing automation tools"
    ],
    requirements: [
      "Basic computer skills",
      "Interest in marketing",
      "Access to social media platforms"
    ],
    isPublished: false,
    isFeatured: true,
    enrollmentCount: 0,
    rating: 0,
    reviewCount: 0,
    instructorEmail: 'admin@learning.com'
  },
  {
    title: "Financial Planning & Investment",
    description: "Master personal finance, investment strategies, and wealth building. Learn about stocks, bonds, real estate, and retirement planning.",
    category: "Finance",
    level: "beginner",
    price: 74.99,
    originalPrice: 89.99,
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
    tags: ["Finance", "Investment", "Retirement", "Budgeting", "Wealth"],
    whatYouWillLearn: [
      "Personal finance fundamentals",
      "Investment strategies and portfolio management",
      "Retirement planning and 401(k)",
      "Real estate investment basics",
      "Tax optimization strategies",
      "Risk management and insurance"
    ],
    requirements: [
      "Basic math skills",
      "Interest in personal finance",
      "Willingness to learn about money"
    ],
    isPublished: true,
    isFeatured: false,
    enrollmentCount: 1234,
    rating: 4.8,
    reviewCount: 92,
    instructorEmail: 'admin@learning.com'
  }
];

async function seedUsers() {
  try {
    console.log('👥 Creating users...');
    
    const createdUsers = [];
    
    for (const userInfo of userData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userInfo.email });
      
      if (existingUser) {
        console.log(`⏭️  User "${userInfo.email}" already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }
      
      // Create user
      const user = await User.create(userInfo);
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
      createdUsers.push(user);
    }
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function seedCourses(users) {
  try {
    console.log('\n📚 Creating courses...');
    
    // Create a map of instructor emails to user objects
    const instructorMap = {};
    users.forEach(user => {
      if (user.role === 'instructor') {
        instructorMap[user.email] = user;
      }
    });
    
    const createdCourses = [];
    
    for (const courseInfo of courseData) {
      const instructor = instructorMap[courseInfo.instructorEmail];
      if (!instructor) {
        console.log(`⚠️  Instructor ${courseInfo.instructorEmail} not found, skipping course: ${courseInfo.title}`);
        continue;
      }
      
      // Check if course already exists
      const existingCourse = await Course.findOne({ 
        title: courseInfo.title,
        instructor: instructor._id 
      });

      if (existingCourse) {
        console.log(`⏭️  Course "${courseInfo.title}" already exists, skipping...`);
        continue;
      }

      // Remove instructorEmail from course data before creating
      const { instructorEmail, ...courseDataWithoutInstructor } = courseInfo;
      
      // Create course
      const course = await Course.create({
        ...courseDataWithoutInstructor,
        instructor: instructor._id
      });

      console.log(`✅ Created course: ${course.title} by ${instructor.name} (${course.isPublished ? 'Published' : 'Draft'}, ${course.isFeatured ? 'Featured' : 'Not Featured'})`);

      // Create sections and lessons for published courses
      if (course.isPublished) {
        await createCourseContent(course._id, courseInfo.title);
      }

      createdCourses.push(course);
    }
    
    return createdCourses;
  } catch (error) {
    console.error('❌ Error creating courses:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive seeding...');
    
    // Create users first
    const users = await seedUsers();
    
    // Then create courses
    const courses = await seedCourses(users);
    
    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Total users created: ${users.length}`);
    console.log(`Total courses created: ${courses.length}`);
    
    const instructors = users.filter(u => u.role === 'instructor').length;
    const students = users.filter(u => u.role === 'student').length;
    const published = courses.filter(c => c.isPublished).length;
    const featured = courses.filter(c => c.isFeatured).length;
    const drafts = courses.filter(c => !c.isPublished).length;
    
    console.log(`Instructors: ${instructors}`);
    console.log(`Students: ${students}`);
    console.log(`Published courses: ${published}`);
    console.log(`Featured courses: ${featured}`);
    console.log(`Draft courses: ${drafts}`);

    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log('\n📋 User Credentials:');
    console.log('==================');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
    console.log('\nYou can now:');
    console.log('1. Login as any instructor to manage courses');
    console.log('2. Login as any student to enroll in courses');
    console.log('3. Visit your homepage to see the featured courses');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function createCourseContent(courseId, courseTitle) {
  try {
    // Create sections based on course type
    const sections = getSectionsForCourse(courseTitle);
    
    for (let i = 0; i < sections.length; i++) {
      const section = await Section.create({
        title: sections[i].title,
        description: sections[i].description,
        course: courseId,
        order: i + 1
      });

      // Create lessons for this section
      for (let j = 0; j < sections[i].lessons.length; j++) {
        const lesson = sections[i].lessons[j];
        await Lesson.create({
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          duration: lesson.duration,
          order: j + 1,
          section: section._id,
          course: courseId,
          isPublished: true
        });
      }
    }
    
    console.log(`  📚 Created ${sections.length} sections with lessons for "${courseTitle}"`);
  } catch (error) {
    console.error(`Error creating content for ${courseTitle}:`, error);
  }
}

function getSectionsForCourse(courseTitle) {
  const baseSections = [
    {
      title: "Introduction & Setup",
      description: "Get started with the course and set up your development environment",
      lessons: [
        {
          title: "Welcome to the Course",
          type: "text",
          content: { text: { content: "Welcome to this comprehensive course! In this lesson, we'll cover what you'll learn and how to get the most out of this course." } },
          duration: 300
        },
        {
          title: "Setting Up Your Environment",
          type: "video",
          content: { video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
          duration: 900
        }
      ]
    },
    {
      title: "Core Concepts",
      description: "Learn the fundamental concepts and principles",
      lessons: [
        {
          title: "Understanding the Basics",
          type: "text",
          content: { text: { content: "In this lesson, we'll dive deep into the core concepts that form the foundation of this subject." } },
          duration: 600
        },
        {
          title: "Practical Examples",
          type: "video",
          content: { video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
          duration: 1200
        }
      ]
    },
    {
      title: "Advanced Topics",
      description: "Explore advanced concepts and real-world applications",
      lessons: [
        {
          title: "Advanced Techniques",
          type: "text",
          content: { text: { content: "Now that you understand the basics, let's explore some advanced techniques and best practices." } },
          duration: 900
        },
        {
          title: "Real-World Project",
          type: "video",
          content: { video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
          duration: 1800
        }
      ]
    }
  ];

  return baseSections;
}

// Run the seeding
main(); 