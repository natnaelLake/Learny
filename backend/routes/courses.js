const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const { protect, authorize, checkInstructor } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all courses (debug route - temporary)
// @route   GET /api/courses/debug/all
// @access  Public
router.get('/debug/all', async (req, res, next) => {
  try {
    const allCourses = await Course.find({})
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: allCourses.length,
      data: allCourses.map(course => ({
        _id: course._id,
        title: course.title,
        isPublished: course.isPublished,
        instructor: course.instructor,
        createdAt: course.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular']).withMessage('Invalid sort option'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isPublished: true }; // Only show published courses by default

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Level filter
    if (req.query.level) {
      query.level = req.query.level;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Search filter
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Build sort
    let sort = {};
    switch (req.query.sort) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'popular':
        sort = { enrollmentCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort(sort)
      .limit(limit)
      .skip(startIndex);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      count: courses.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: courses
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const courses = await Course.find({ 
      isPublished: true, 
      isFeatured: true 
    })
      .populate('instructor', 'name avatar')
      .sort({ enrollmentCount: -1 })
      .limit(6);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor/my-courses
// @access  Private (Instructors only)
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio instructorProfile');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Manually populate sections and their lessons
    const Section = require('../models/Section');
    const Lesson = require('../models/Lesson');
    
    const sections = await Section.find({ course: req.params.id })
      .sort({ order: 1 });
    
    // Populate lessons for each section
    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({ section: section._id })
          .sort({ order: 1 });
        
        // Transform lessons to match frontend expectations
        const transformedLessons = lessons.map(lesson => {
          const transformedLesson = {
            _id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            order: lesson.order,
            isPublished: lesson.isPublished,
            // Extract simple fields from complex content structure
            videoUrl: lesson.content?.video?.url || '',
            content: lesson.content?.text?.content || ''
          };

          // Add quiz data if it's a quiz lesson
          if (lesson.type === 'quiz' && lesson.content?.quiz) {
            transformedLesson.quizData = {
              questions: lesson.content.quiz.questions || [],
              timeLimit: lesson.content.quiz.timeLimit || 30,
              passingScore: lesson.content.quiz.passingScore || 70,
              allowRetakes: lesson.content.quiz.allowRetakes !== false
            };
          }

          return transformedLesson;
        });
        
        return {
          _id: section._id,
          title: section.title,
          description: section.description,
          order: section.order,
          lessons: transformedLessons
        };
      })
    );

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    let enrollmentId = null;
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.id) {
          const Enrollment = require('../models/Enrollment');
          const enrollment = await Enrollment.findOne({
            student: decoded.id,
            course: req.params.id
          });
          
          if (enrollment) {
            isEnrolled = true;
            enrollmentId = enrollment._id;
          }
        }
      } catch (error) {
        // Token is invalid, but we'll still return the course data
        console.log('Invalid token when checking enrollment status:', error.message);
      }
    }

    // Add sections to course data
    const courseData = {
      ...course.toObject(),
      sections: sectionsWithLessons,
      isEnrolled,
      enrollmentId
    };

    res.json({
      success: true,
      data: courseData
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    next(error);
  }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Instructors only)
router.post('/', protect, authorize('instructor', 'admin'), [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn([
      'Web Development', 'Data Science', 'Design', 'Backend Development',
      'Mobile Development', 'DevOps', 'Business', 'Marketing', 'Finance',
      'Health & Fitness', 'Music', 'Photography', 'Other'
    ])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('thumbnail')
    .optional()
    .isString()
    .withMessage('Thumbnail must be a string')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Set default thumbnail if not provided
    const courseData = {
      ...req.body,
      instructor: req.user.id,
      thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop&crop=center'
    };

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course instructor only)
router.put('/:id', protect, checkInstructor, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .optional()
    .isIn([
      'Web Development', 'Data Science', 'Design', 'Backend Development',
      'Mobile Development', 'DevOps', 'Business', 'Marketing', 'Finance',
      'Health & Fitness', 'Music', 'Photography', 'Other'
    ])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course instructor only)
router.delete('/:id', protect, checkInstructor, async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get course enrollments (for instructors)
// @route   GET /api/courses/:id/enrollments
// @access  Private (Course instructor only)
router.get('/:id/enrollments', protect, checkInstructor, async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email avatar')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get course reviews (for instructors)
// @route   GET /api/courses/:id/reviews
// @access  Private (Course instructor only)
router.get('/:id/reviews', protect, checkInstructor, async (req, res, next) => {
  try {
    const reviews = await Review.find({ course: req.params.id })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
// @access  Private (Course instructor only)
router.put('/:id/publish', protect, checkInstructor, async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course published successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Unpublish course
// @route   PUT /api/courses/:id/unpublish
// @access  Private (Course instructor only)
router.put('/:id/unpublish', protect, checkInstructor, async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course unpublished successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get enrollments for a specific course
// @route   GET /api/courses/:courseId/enrollments
// @access  Private (Course instructor only)
router.get('/:courseId/enrollments', protect, authorize('instructor', 'admin'), async (req, res, next) => {
  try {
    // First, verify the user is the instructor of this course
    const course = await Course.findById(req.params.courseId);
    if (!course || course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view enrollments for this course.'
      });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email avatar')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get reviews for a course
// @route   GET /api/courses/:courseId/reviews
// @access  Public
router.get('/:courseId/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 