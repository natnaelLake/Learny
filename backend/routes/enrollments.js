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
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name avatar'
        }
      })
      .sort({ enrolledAt: -1 });
      
    // Manually calculate progress for each enrollment for display purposes
    const data = await Promise.all(enrollments.map(async (enrollment) => {
      const Lesson = require('../models/Lesson');
      const enrollmentObj = enrollment.toObject();
      
      const totalLessons = await Lesson.countDocuments({ 
        course: enrollmentObj.course._id,
        isPublished: true
      });

      if (totalLessons === 0) {
        enrollmentObj.progress.percentage = 0;
      } else {
        enrollmentObj.progress.percentage = Math.round(
          (enrollmentObj.progress.completedLessons.length / totalLessons) * 100
        );
      }
      return enrollmentObj;
    }));

    res.json({
      success: true,
      count: enrollments.length,
      data
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

    // A regular user cannot enroll in an unpublished course
    // Allow admin or the course instructor to enroll for testing/preview purposes
    const isInstructorOrAdmin = (req.user.role === 'admin' || course.instructor.toString() === req.user.id);

    if (!course.isPublished && !isInstructorOrAdmin) {
      return res.status(400).json({
        success: false,
        error: 'This course is not available for enrollment.'
      });
    }

    // Check if the user is the instructor of the course
    if (course.instructor.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot enroll in your own course.'
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

// @desc    Delete enrollment (unenroll)
// @route   DELETE /api/enrollments/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
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
        error: 'Not authorized to delete this enrollment'
      });
    }

    const courseId = enrollment.course;

    // Use deleteOne for Mongoose 7+ or remove() for older versions
    await enrollment.deleteOne(); 

    // Decrement course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: -1 }
    });

    res.json({
      success: true,
      message: 'Successfully unenrolled from the course'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Award points to student (Instructor only)
// @route   PUT /api/enrollments/:id/award-points
// @access  Private (Instructor)
router.put('/:id/award-points', protect, [
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { points, reason } = req.body;

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'instructor')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user is the course instructor
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to award points'
      });
    }

    enrollment.points += points;
    
    // Add note about points awarded
    enrollment.instructorNotes.push({
      note: `Awarded ${points} points${reason ? `: ${reason}` : ''}`,
      createdBy: req.user.id
    });

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
      message: `Successfully awarded ${points} points to ${enrollment.student.name}`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Block/Unblock student (Instructor only)
// @route   PUT /api/enrollments/:id/toggle-block
// @access  Private (Instructor)
router.put('/:id/toggle-block', protect, [
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { reason } = req.body;

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'instructor')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user is the course instructor
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to block/unblock student'
      });
    }

    enrollment.isBlocked = !enrollment.isBlocked;
    
    if (enrollment.isBlocked) {
      enrollment.blockedAt = new Date();
      enrollment.blockedBy = req.user.id;
      enrollment.blockReason = reason || 'No reason provided';
      
      enrollment.instructorNotes.push({
        note: `Student blocked${reason ? `: ${reason}` : ''}`,
        createdBy: req.user.id
      });
    } else {
      enrollment.blockedAt = null;
      enrollment.blockedBy = null;
      enrollment.blockReason = null;
      
      enrollment.instructorNotes.push({
        note: 'Student unblocked',
        createdBy: req.user.id
      });
    }

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
      message: `Student ${enrollment.isBlocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add instructor note (Instructor only)
// @route   POST /api/enrollments/:id/notes
// @access  Private (Instructor)
router.post('/:id/notes', protect, [
  body('note')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { note } = req.body;

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'instructor')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user is the course instructor
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add notes'
      });
    }

    enrollment.instructorNotes.push({
      note,
      createdBy: req.user.id
    });

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
      message: 'Note added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Award achievement to student (Instructor only)
// @route   POST /api/enrollments/:id/achievements
// @access  Private (Instructor)
router.post('/:id/achievements', protect, [
  body('achievement')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Achievement must be between 1 and 100 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { achievement } = req.body;

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'instructor')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user is the course instructor
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to award achievements'
      });
    }

    // Check if achievement already exists
    const achievementExists = enrollment.achievements.some(a => a.type === achievement);
    if (achievementExists) {
      return res.status(400).json({
        success: false,
        error: 'Achievement already awarded'
      });
    }

    enrollment.achievements.push({
      type: achievement,
      earnedAt: new Date()
    });

    enrollment.instructorNotes.push({
      note: `Awarded achievement: ${achievement}`,
      createdBy: req.user.id
    });

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
      message: `Achievement "${achievement}" awarded successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get student management data (Instructor only)
// @route   GET /api/enrollments/:id/management
// @access  Private (Instructor)
router.get('/:id/management', protect, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'instructor title')
      .populate('student', 'name email avatar')
      .populate('instructorNotes.createdBy', 'name')
      .populate('blockedBy', 'name');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if user is the course instructor
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view management data'
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

module.exports = router;