const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    completedLessons: [{
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: Number // in minutes
    }],
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    }
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  // Student management fields
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockReason: String,
  instructorNotes: [{
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  achievements: [{
    type: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String
}, {
  timestamps: true
});

// Compound index to ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Calculate progress percentage
enrollmentSchema.methods.calculateProgress = async function() {
  const Lesson = mongoose.model('Lesson');
  
  // Get total published lessons in the course
  const totalLessons = await Lesson.countDocuments({ 
    course: this.course, 
    isPublished: true 
  });
  
  if (totalLessons === 0) {
    this.progress.percentage = 0;
  } else {
    this.progress.percentage = Math.round(
      (this.progress.completedLessons.length / totalLessons) * 100
    );
  }
  
  // Update status to completed if 100%
  if (this.progress.percentage === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
};

// Mark lesson as completed
enrollmentSchema.methods.completeLesson = async function(lessonId, timeSpent = 0) {
  const lessonExists = this.progress.completedLessons.find(
    lesson => lesson.lesson.toString() === lessonId.toString()
  );
  
  if (!lessonExists) {
    this.progress.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date(),
      timeSpent
    });
    
    this.progress.totalTimeSpent += (timeSpent || 0);
    this.lastAccessedAt = new Date();
    
    await this.calculateProgress();
    await this.save(); // Explicitly save after updating progress
  }
};

module.exports = mongoose.model('Enrollment', enrollmentSchema); 