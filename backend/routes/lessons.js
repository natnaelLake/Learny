const express = require('express');
const { body, validationResult } = require('express-validator');
const Lesson = require('../models/Lesson');
const Section = require('../models/Section');
const { protect, checkInstructor, checkEnrollment } = require('../middleware/auth');

const router = express.Router();

// @desc    Get lessons for a course (enrolled students or instructor)
// @route   GET /api/lessons/course/:courseId
// @access  Private
router.get('/course/:courseId', protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if user is instructor or enrolled
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      // Check enrollment
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: courseId,
        status: { $in: ['active', 'completed'] }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'You must be enrolled in this course to view lessons'
        });
      }
    }

    const sections = await Section.find({ course: courseId })
      .populate({
        path: 'lessons',
        match: { isPublished: true },
        options: { sort: { order: 1 } }
      })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private (enrolled students or instructor)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor')
      .populate('section', 'title');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if user is instructor or enrolled
    const isInstructor = lesson.course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: lesson.course._id,
        status: { $in: ['active', 'completed'] }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'You must be enrolled in this course to view this lesson'
        });
      }
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create lesson
// @route   POST /api/lessons
// @access  Private (Course instructor only)
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('section')
    .isMongoId()
    .withMessage('Valid section ID is required'),
  body('type')
    .isIn(['video', 'text', 'quiz', 'assignment', 'file'])
    .withMessage('Invalid lesson type'),
  body('order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer')
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

    // Check if user is course instructor
    const Course = require('../models/Course');
    const course = await Course.findById(req.body.course);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to add lessons to this course'
      });
    }

    // Transform frontend data to match backend model structure
    const lessonData = {
      title: req.body.title,
      course: req.body.course,
      section: req.body.section,
      type: req.body.type,
      order: req.body.order,
      duration: req.body.duration || 0,
      isPublished: false
    };

    // Handle content based on lesson type
    if (req.body.type === 'video') {
      lessonData.content = {
        video: {
          url: req.body.videoUrl || '',
          duration: req.body.duration ? req.body.duration * 60 : 0, // Convert minutes to seconds
          thumbnail: '',
          transcript: ''
        }
      };
    } else if (req.body.type === 'text') {
      lessonData.content = {
        text: {
          content: req.body.content || '',
          attachments: []
        }
      };
    } else if (req.body.type === 'quiz') {
      lessonData.content = {
        quiz: {
          questions: req.body.quizData?.questions || [],
          timeLimit: req.body.quizData?.timeLimit || 30,
          passingScore: req.body.quizData?.passingScore || 70,
          allowRetakes: req.body.quizData?.allowRetakes !== undefined ? req.body.quizData.allowRetakes : true
        }
      };
    }

    // Handle references
    if (req.body.references && Array.isArray(req.body.references)) {
      lessonData.references = req.body.references;
    }

    console.log('Creating lesson with data:', lessonData);

    const lesson = await Lesson.create(lessonData);

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    next(error);
  }
});

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (Course instructor only)
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('type')
    .optional()
    .isIn(['video', 'text', 'quiz', 'assignment', 'file'])
    .withMessage('Invalid lesson type'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer')
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

    const lesson = await Lesson.findById(req.params.id);
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if user is course instructor
    const Course = require('../models/Course');
    const course = await Course.findById(lesson.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to modify this lesson'
      });
    }

    // Transform frontend data to match backend model structure
    const updateData = { ...req.body };

    // Handle content updates based on lesson type
    if (req.body.type === 'video' && req.body.videoUrl) {
      updateData.content = {
        video: {
          url: req.body.videoUrl,
          duration: req.body.duration ? req.body.duration * 60 : lesson.content?.video?.duration || 0,
          thumbnail: lesson.content?.video?.thumbnail || '',
          transcript: lesson.content?.video?.transcript || ''
        }
      };
    } else if (req.body.type === 'text' && req.body.content) {
      updateData.content = {
        text: {
          content: req.body.content,
          attachments: lesson.content?.text?.attachments || []
        }
      };
    } else if (req.body.type === 'quiz' && req.body.quizData) {
      updateData.content = {
        quiz: {
          questions: req.body.quizData.questions || lesson.content?.quiz?.questions || [],
          timeLimit: req.body.quizData.timeLimit || lesson.content?.quiz?.timeLimit || 30,
          passingScore: req.body.quizData.passingScore || lesson.content?.quiz?.passingScore || 70,
          allowRetakes: req.body.quizData.allowRetakes !== undefined ? req.body.quizData.allowRetakes : (lesson.content?.quiz?.allowRetakes !== undefined ? lesson.content.quiz.allowRetakes : true)
        }
      };
    }

    // Handle references updates
    if (req.body.references && Array.isArray(req.body.references)) {
      updateData.references = req.body.references;
    }

    console.log('Updating lesson with data:', updateData);

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedLesson
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    next(error);
  }
});

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Course instructor only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if user is course instructor
    const Course = require('../models/Course');
    const course = await Course.findById(lesson.course);
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this lesson'
      });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 