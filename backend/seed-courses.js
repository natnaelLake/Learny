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

const courseData = [
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
    reviewCount: 89
  },
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
    reviewCount: 156
  },
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
    reviewCount: 67
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
    reviewCount: 45
  },
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
    reviewCount: 0
  },
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
    reviewCount: 34
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
    reviewCount: 0
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
    reviewCount: 92
  }
];

async function seedCourses() {
  try {
    console.log('Starting course seeding...');

    // Find or create admin instructor
    let adminUser = await User.findOne({ email: 'admin@learning.com' });
    
    if (!adminUser) {
      console.log('Creating admin instructor...');
      adminUser = await User.create({
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
      });
      console.log('✅ Admin instructor created');
    } else {
      console.log('✅ Admin instructor found');
    }

    // Clear existing courses (optional - comment out if you want to keep existing)
    // await Course.deleteMany({});
    // console.log('Cleared existing courses');

    // Create courses
    const createdCourses = [];
    
    for (const courseInfo of courseData) {
      // Check if course already exists
      const existingCourse = await Course.findOne({ 
        title: courseInfo.title,
        instructor: adminUser._id 
      });

      if (existingCourse) {
        console.log(`⏭️  Course "${courseInfo.title}" already exists, skipping...`);
        continue;
      }

      // Create course
      const course = await Course.create({
        ...courseInfo,
        instructor: adminUser._id
      });

      console.log(`✅ Created course: ${course.title} (${course.isPublished ? 'Published' : 'Draft'}, ${course.isFeatured ? 'Featured' : 'Not Featured'})`);

      // Create sections and lessons for published courses
      if (course.isPublished) {
        await createCourseContent(course._id, courseInfo.title);
      }

      createdCourses.push(course);
    }

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Total courses created: ${createdCourses.length}`);
    
    const published = createdCourses.filter(c => c.isPublished).length;
    const featured = createdCourses.filter(c => c.isFeatured).length;
    const drafts = createdCourses.filter(c => !c.isPublished).length;
    
    console.log(`Published courses: ${published}`);
    console.log(`Featured courses: ${featured}`);
    console.log(`Draft courses: ${drafts}`);

    console.log('\n🎉 Course seeding completed successfully!');
    console.log('You can now visit your homepage to see the featured courses.');

  } catch (error) {
    console.error('❌ Error seeding courses:', error);
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
seedCourses(); 