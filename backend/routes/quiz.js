const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const { protect } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

// Check if quiz can be taken (for frontend to determine if quiz is available)
router.get('/can-take/:lessonId', protect, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    // Check if there's a completed attempt
    const completedAttempt = await QuizAttempt.findOne({
      student: studentId,
      lesson: lessonId,
      status: 'completed'
    });

    // Check if there's an in-progress attempt
    const inProgressAttempt = await QuizAttempt.findOne({
      student: studentId,
      lesson: lessonId,
      status: 'in_progress'
    });

    res.json({
      success: true,
      data: {
        canTake: !completedAttempt, // Can't take if already completed
        hasInProgress: !!inProgressAttempt,
        completedAttempt: completedAttempt ? {
          id: completedAttempt._id,
          score: completedAttempt.results.score,
          passed: completedAttempt.results.passed,
          completedAt: completedAttempt.completedAt,
          timeSpent: completedAttempt.timeSpent
        } : null,
        inProgressAttempt: inProgressAttempt ? {
          id: inProgressAttempt._id,
          startedAt: inProgressAttempt.startedAt,
          progress: inProgressAttempt.getProgress()
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Start a new quiz attempt
router.post('/start', protect, async (req, res, next) => {
  try {
    const { courseId, lessonId, totalQuestions, allowRetakes = false } = req.body;
    const studentId = req.user.id;

    if (!courseId || !lessonId || !totalQuestions) {
      throw new ApiError(400, 'Missing required fields: courseId, lessonId, totalQuestions');
    }

    // Check if there's a completed attempt and retakes are not allowed
    if (!allowRetakes) {
      const completedAttempt = await QuizAttempt.findOne({
        student: studentId,
        lesson: lessonId,
        status: 'completed'
      });

      if (completedAttempt) {
        throw new ApiError(403, 'Quiz already completed and retakes are not allowed');
      }
    }

    // Check if there's an existing in-progress attempt
    let existingAttempt = await QuizAttempt.findOne({
      student: studentId,
      lesson: lessonId,
      status: 'in_progress'
    });

    if (existingAttempt) {
      return res.json({
        success: true,
        data: existingAttempt,
        message: 'Resumed existing quiz attempt'
      });
    }

    // Get the next attempt number
    const attemptCount = await QuizAttempt.countDocuments({
      student: studentId,
      lesson: lessonId
    });

    // Create new attempt
    const quizAttempt = new QuizAttempt({
      student: studentId,
      course: courseId,
      lesson: lessonId,
      attemptNumber: attemptCount + 1,
      results: {
        totalQuestions: parseInt(totalQuestions),
        passingThreshold: 70
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await quizAttempt.save();

    res.json({
      success: true,
      data: quizAttempt,
      message: 'Quiz attempt started successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Submit an answer
router.post('/answer', protect, async (req, res, next) => {
  try {
    const { attemptId, questionIndex, selectedAnswer, isCorrect } = req.body;
    const studentId = req.user.id;

    if (!attemptId || questionIndex === undefined || selectedAnswer === undefined || isCorrect === undefined) {
      throw new ApiError(400, 'Missing required fields: attemptId, questionIndex, selectedAnswer, isCorrect');
    }

    const quizAttempt = await QuizAttempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress'
    });

    if (!quizAttempt) {
      throw new ApiError(404, 'Quiz attempt not found or already completed');
    }

    // Add the answer
    quizAttempt.addAnswer(questionIndex, selectedAnswer, isCorrect);
    await quizAttempt.save();

    res.json({
      success: true,
      data: {
        attempt: quizAttempt,
        progress: quizAttempt.getProgress(),
        results: quizAttempt.results
      },
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Complete quiz attempt
router.post('/complete', protect, async (req, res, next) => {
  try {
    const { attemptId } = req.body;
    const studentId = req.user.id;

    if (!attemptId) {
      throw new ApiError(400, 'Missing required field: attemptId');
    }

    const quizAttempt = await QuizAttempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress'
    });

    if (!quizAttempt) {
      throw new ApiError(404, 'Quiz attempt not found or already completed');
    }

    // Calculate time spent
    const timeSpent = Math.floor((Date.now() - quizAttempt.startedAt.getTime()) / 1000);
    quizAttempt.timeSpent = timeSpent;

    // Complete the attempt
    quizAttempt.complete();
    await quizAttempt.save();

    res.json({
      success: true,
      data: {
        attempt: quizAttempt,
        results: quizAttempt.results,
        timeSpent
      },
      message: 'Quiz completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current quiz attempt for a lesson
router.get('/current/:lessonId', protect, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    const quizAttempt = await QuizAttempt.findOne({
      student: studentId,
      lesson: lessonId,
      status: 'in_progress'
    });

    if (!quizAttempt) {
      return res.json({
        success: true,
        data: null,
        message: 'No active quiz attempt found'
      });
    }

    res.json({
      success: true,
      data: {
        attempt: quizAttempt,
        progress: quizAttempt.getProgress(),
        results: quizAttempt.results
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get completed quiz attempt for a lesson
router.get('/completed/:lessonId', protect, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    const quizAttempt = await QuizAttempt.findOne({
      student: studentId,
      lesson: lessonId,
      status: 'completed'
    }).sort({ completedAt: -1 });

    if (!quizAttempt) {
      return res.json({
        success: true,
        data: null,
        message: 'No completed quiz attempt found'
      });
    }

    res.json({
      success: true,
      data: {
        attempt: quizAttempt,
        results: quizAttempt.results,
        timeSpent: quizAttempt.timeSpent
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz history for a lesson
router.get('/history/:lessonId', protect, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    const attempts = await QuizAttempt.getStudentAttempts(studentId, lessonId);
    const bestAttempt = await QuizAttempt.getBestAttempt(studentId, lessonId);

    res.json({
      success: true,
      data: {
        attempts,
        bestAttempt,
        totalAttempts: attempts.length,
        completedAttempts: attempts.filter(a => a.status === 'completed').length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Abandon current quiz attempt
router.post('/abandon', protect, async (req, res, next) => {
  try {
    const { attemptId } = req.body;
    const studentId = req.user.id;

    if (!attemptId) {
      throw new ApiError(400, 'Missing required field: attemptId');
    }

    const quizAttempt = await QuizAttempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress'
    });

    if (!quizAttempt) {
      throw new ApiError(404, 'Quiz attempt not found or already completed');
    }

    quizAttempt.status = 'abandoned';
    quizAttempt.completedAt = new Date();
    await quizAttempt.save();

    res.json({
      success: true,
      data: quizAttempt,
      message: 'Quiz attempt abandoned'
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz statistics for a course
router.get('/stats/:courseId', protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const attempts = await QuizAttempt.find({
      student: studentId,
      course: courseId,
      status: 'completed'
    });

    const stats = {
      totalAttempts: attempts.length,
      passedAttempts: attempts.filter(a => a.results.passed).length,
      averageScore: attempts.length > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + a.results.score, 0) / attempts.length)
        : 0,
      bestScore: attempts.length > 0 
        ? Math.max(...attempts.map(a => a.results.score))
        : 0,
      totalTimeSpent: attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 