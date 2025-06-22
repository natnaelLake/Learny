const express = require('express');
const { body, validationResult } = require('express-validator');
const Section = require('../models/Section');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all sections for a course
// @route   GET /api/sections/course/:courseId
// @access  Public
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const sections = await Section.find({ course: req.params.courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single section
// @route   GET /api/sections/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('lessons')
      .populate('course', 'title');

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create section
// @route   POST /api/sections
// @access  Private (Instructors only)
router.post('/', protect, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
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

    // Verify the course exists and belongs to the instructor
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add sections to this course'
      });
    }

    const section = await Section.create({
      title: req.body.title,
      description: req.body.description || '',
      course: req.body.course,
      order: req.body.order
    });

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private (Instructors only)
router.put('/:id', protect, authorize('instructor', 'admin'), [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
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

    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Verify the course belongs to the instructor
    const course = await Course.findById(section.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this section'
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedSection
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private (Instructors only)
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Verify the course belongs to the instructor
    const course = await Course.findById(section.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this section'
      });
    }

    // Delete all lessons in this section first
    const Lesson = require('../models/Lesson');
    await Lesson.deleteMany({ section: req.params.id });

    // Delete the section
    await Section.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reorder sections
// @route   PUT /api/sections/reorder
// @access  Private (Instructors only)
router.put('/reorder', protect, authorize('instructor', 'admin'), [
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('sections').isArray().withMessage('Sections must be an array'),
  body('sections.*.id').isMongoId().withMessage('Valid section ID is required'),
  body('sections.*.order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
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

    // Verify the course belongs to the instructor
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reorder sections in this course'
      });
    }

    // Update each section's order
    const updatePromises = req.body.sections.map(section => 
      Section.findByIdAndUpdate(section.id, { order: section.order })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Sections reordered successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 