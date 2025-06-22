const express = require('express');
const { body, validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course', 'title thumbnail instructor price')
      .populate('course.instructor', 'name avatar')
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

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'title thumbnail instructor price')
      .populate('course.instructor', 'name avatar')
      .populate('progress.completedLessons.lesson', 'title duration');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this enrollment'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Enroll in course
// @route   POST /api/enrollments
// @access  Private
router.post('/', protect, [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
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

    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if course is published
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        error: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      payment: {
        amount: course.price, // Use price from course model
        currency: 'USD',
        status: 'completed' // For MVP, assume payment is completed
      }
    });

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title thumbnail instructor price')
      .populate('course.instructor', 'name avatar');

    res.status(201).json({
      success: true,
      data: populatedEnrollment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark lesson as completed
// @route   PUT /api/enrollments/:id/complete-lesson
// @access  Private
router.put('/:id/complete-lesson', protect, [
  body('lessonId')
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  body('timeSpent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Time spent must be a positive number')
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

    const { lessonId, timeSpent = 0 } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this enrollment'
      });
    }

    // Mark lesson as completed
    await enrollment.completeLesson(lessonId, timeSpent);

    const updatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title thumbnail instructor price')
      .populate('course.instructor', 'name avatar')
      .populate('progress.completedLessons.lesson', 'title duration');

    res.json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
router.put('/:id/progress', protect, [
  body('currentLesson')
    .optional()
    .isMongoId()
    .withMessage('Valid lesson ID is required')
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

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this enrollment'
      });
    }

    // Update current lesson
    if (req.body.currentLesson) {
      enrollment.progress.currentLesson = req.body.currentLesson;
    }

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    const updatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title thumbnail instructor price')
      .populate('course.instructor', 'name avatar')
      .populate('progress.completedLessons.lesson', 'title duration');

    res.json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel enrollment
// @route   PUT /api/enrollments/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this enrollment'
      });
    }

    enrollment.status = 'cancelled';
    await enrollment.save();

    res.json({
      success: true,
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 