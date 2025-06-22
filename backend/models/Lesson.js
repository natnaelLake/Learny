const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a lesson title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'file'],
    default: 'video'
  },
  content: {
    video: {
      url: String,
      duration: Number, // in seconds
      thumbnail: String,
      transcript: String
    },
    text: {
      content: String,
      attachments: [String]
    },
    quiz: {
      questions: [{
        id: String,
        question: String,
        type: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'short-answer'],
          default: 'multiple-choice'
        },
        options: [String],
        correctAnswer: String,
        explanation: String,
        points: {
          type: Number,
          default: 1
        }
      }],
      timeLimit: {
        type: Number,
        default: 30
      }, // in minutes
      passingScore: {
        type: Number,
        default: 70
      },
      allowRetakes: {
        type: Boolean,
        default: true
      }
    },
    assignment: {
      description: String,
      requirements: [String],
      dueDate: Date,
      maxPoints: {
        type: Number,
        default: 100
      }
    },
    file: {
      url: String,
      filename: String,
      size: Number,
      type: String
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  // Reference materials for the lesson
  references: [{
    id: String,
    title: String,
    type: {
      type: String,
      enum: ['book', 'pdf', 'article', 'link', 'video'],
      default: 'book'
    },
    url: String,
    description: String,
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  notes: String,
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
lessonSchema.index({ course: 1, section: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema); 