const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const Course = require('./models/Course');
const User = require('./models/User');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function listFeaturedCourses() {
  try {
    console.log('\n📋 Featured Courses:');
    console.log('==================');
    
    const featuredCourses = await Course.find({ isFeatured: true })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    if (featuredCourses.length === 0) {
      console.log('No featured courses found.');
      return;
    }

    featuredCourses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Instructor: ${course.instructor?.name || 'Unknown'}`);
      console.log(`   Status: ${course.isPublished ? '✅ Published' : '📝 Draft'}`);
      console.log(`   Price: $${course.price}`);
      console.log(`   ID: ${course._id}`);
    });
  } catch (error) {
    console.error('Error listing featured courses:', error);
  }
}

async function listAllCourses() {
  try {
    console.log('\n📚 All Courses:');
    console.log('==============');
    
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    if (courses.length === 0) {
      console.log('No courses found.');
      return;
    }

    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Instructor: ${course.instructor?.name || 'Unknown'}`);
      console.log(`   Status: ${course.isPublished ? '✅ Published' : '📝 Draft'}`);
      console.log(`   Featured: ${course.isFeatured ? '⭐ Yes' : '❌ No'}`);
      console.log(`   Price: $${course.price}`);
      console.log(`   ID: ${course._id}`);
    });
  } catch (error) {
    console.error('Error listing courses:', error);
  }
}

async function setFeatured(courseId) {
  try {
    if (!courseId) {
      console.log('❌ Please provide a course ID');
      console.log('Usage: node manage-featured.js set <courseId>');
      return;
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { isFeatured: true },
      { new: true }
    ).populate('instructor', 'name email');

    if (!course) {
      console.log('❌ Course not found');
      return;
    }

    console.log(`\n✅ Course "${course.title}" is now featured!`);
    console.log(`   Instructor: ${course.instructor?.name || 'Unknown'}`);
    console.log(`   Status: ${course.isPublished ? 'Published' : 'Draft'}`);
  } catch (error) {
    console.error('Error setting featured course:', error);
  }
}

async function unsetFeatured(courseId) {
  try {
    if (!courseId) {
      console.log('❌ Please provide a course ID');
      console.log('Usage: node manage-featured.js unset <courseId>');
      return;
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { isFeatured: false },
      { new: true }
    ).populate('instructor', 'name email');

    if (!course) {
      console.log('❌ Course not found');
      return;
    }

    console.log(`\n✅ Course "${course.title}" is no longer featured`);
    console.log(`   Instructor: ${course.instructor?.name || 'Unknown'}`);
    console.log(`   Status: ${course.isPublished ? 'Published' : 'Draft'}`);
  } catch (error) {
    console.error('Error unsetting featured course:', error);
  }
}

async function toggleFeatured(courseId) {
  try {
    if (!courseId) {
      console.log('❌ Please provide a course ID');
      console.log('Usage: node manage-featured.js toggle <courseId>');
      return;
    }

    const course = await Course.findById(courseId).populate('instructor', 'name email');
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }

    const newFeaturedStatus = !course.isFeatured;
    
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { isFeatured: newFeaturedStatus },
      { new: true }
    ).populate('instructor', 'name email');

    console.log(`\n✅ Course "${updatedCourse.title}" featured status: ${newFeaturedStatus ? '⭐ Featured' : '❌ Not Featured'}`);
    console.log(`   Instructor: ${updatedCourse.instructor?.name || 'Unknown'}`);
    console.log(`   Status: ${updatedCourse.isPublished ? 'Published' : 'Draft'}`);
  } catch (error) {
    console.error('Error toggling featured course:', error);
  }
}

async function main() {
  try {
    switch (command) {
      case 'list':
        await listFeaturedCourses();
        break;
      case 'all':
        await listAllCourses();
        break;
      case 'set':
        await setFeatured(args[1]);
        break;
      case 'unset':
        await unsetFeatured(args[1]);
        break;
      case 'toggle':
        await toggleFeatured(args[1]);
        break;
      default:
        console.log('\n🎯 Featured Course Management Tool');
        console.log('==================================');
        console.log('\nCommands:');
        console.log('  list                    - Show all featured courses');
        console.log('  all                     - Show all courses with featured status');
        console.log('  set <courseId>          - Set a course as featured');
        console.log('  unset <courseId>        - Remove featured status from a course');
        console.log('  toggle <courseId>       - Toggle featured status of a course');
        console.log('\nExamples:');
        console.log('  node manage-featured.js list');
        console.log('  node manage-featured.js all');
        console.log('  node manage-featured.js set 507f1f77bcf86cd799439011');
        console.log('  node manage-featured.js toggle 507f1f77bcf86cd799439011');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
main(); 