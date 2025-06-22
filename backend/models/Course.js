const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Web Development',
      'Data Science',
      'Design',
      'Backend Development',
      'Mobile Development',
      'DevOps',
      'Business',
      'Marketing',
      'Finance',
      'Health & Fitness',
      'Music',
      'Photography',
      'Other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Please provide a difficulty level'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop&crop=center'
  },
  previewVideo: {
    type: String
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  language: {
    type: String,
    default: 'English'
  },
  tags: [String],
  whatYouWillLearn: [String],
  requirements: [String],
  targetAudience: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  certificate: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    template: String
  },
  settings: {
    allowReviews: {
      type: Boolean,
      default: true
    },
    allowQuestions: {
      type: Boolean,
      default: true
    },
    lifetimeAccess: {
      type: Boolean,
      default: true
    },
    downloadableContent: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    seoTitle: String,
    seoDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Virtual for lessons
courseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Virtual for sections
courseSchema.virtual('sections', {
  ref: 'Section',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Virtual for enrollments
courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Create slug from title
courseSchema.pre('save', function(next) {
  if (!this.isModified('title')) {
    return next();
  }
  
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

// Calculate average rating
courseSchema.methods.calculateAverageRating = async function() {
  try {
    // Import Review model dynamically to avoid circular dependency
    const Review = require('./Review');
    
    const stats = await Review.aggregate([
      {
        $match: { course: this._id }
      },
      {
        $group: {
          _id: '$course',
          avgRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      this.rating = Math.round(stats[0].avgRating * 10) / 10;
      this.reviewCount = stats[0].numReviews;
    } else {
      this.rating = 0;
      this.reviewCount = 0;
    }

    await this.save();
  } catch (error) {
    console.error('Error calculating average rating:', error);
  }
};

module.exports = mongoose.model('Course', courseSchema); 