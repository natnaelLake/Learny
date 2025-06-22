const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: Number, // in seconds
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number, // index of selected answer
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  results: {
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0 // percentage
    },
    passed: {
      type: Boolean,
      default: false
    },
    passingThreshold: {
      type: Number,
      default: 70 // 70% to pass
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: String
  }
}, {
  timestamps: true
});

// Compound index to ensure unique attempt per student per lesson
quizAttemptSchema.index({ student: 1, lesson: 1, attemptNumber: 1 }, { unique: true });

// Calculate results based on answers
quizAttemptSchema.methods.calculateResults = function() {
  const correctCount = this.answers.filter(answer => answer.isCorrect).length;
  const totalQuestions = this.results.totalQuestions;
  
  this.results.correctAnswers = correctCount;
  this.results.score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  this.results.passed = this.results.score >= this.results.passingThreshold;
  
  return this.results;
};

// Add answer to the attempt
quizAttemptSchema.methods.addAnswer = function(questionIndex, selectedAnswer, isCorrect) {
  // Remove existing answer for this question if it exists
  this.answers = this.answers.filter(answer => answer.questionIndex !== questionIndex);
  
  // Add new answer
  this.answers.push({
    questionIndex,
    selectedAnswer,
    isCorrect,
    answeredAt: new Date()
  });
  
  // Recalculate results
  this.calculateResults();
};

// Complete the quiz attempt
quizAttemptSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.calculateResults();
};

// Get current progress
quizAttemptSchema.methods.getProgress = function() {
  return {
    answered: this.answers.length,
    total: this.results.totalQuestions,
    percentage: this.results.totalQuestions > 0 
      ? Math.round((this.answers.length / this.results.totalQuestions) * 100) 
      : 0
  };
};

// Get best attempt for a student on a specific lesson
quizAttemptSchema.statics.getBestAttempt = async function(studentId, lessonId) {
  const attempts = await this.find({
    student: studentId,
    lesson: lessonId,
    status: 'completed'
  }).sort({ 'results.score': -1, 'results.correctAnswers': -1 });
  
  return attempts.length > 0 ? attempts[0] : null;
};

// Get all attempts for a student on a specific lesson
quizAttemptSchema.statics.getStudentAttempts = async function(studentId, lessonId) {
  return await this.find({
    student: studentId,
    lesson: lessonId
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema); 