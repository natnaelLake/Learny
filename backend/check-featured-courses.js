const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Course model
const Course = require('./models/Course');

async function checkFeaturedCourses() {
  try {
    console.log('Checking all courses...');
    
    // Get all courses
    const allCourses = await Course.find({});
    console.log(`Total courses in database: ${allCourses.length}`);
    
    if (allCourses.length > 0) {
      console.log('\nAll courses:');
      allCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} - Published: ${course.isPublished}, Featured: ${course.isFeatured}`);
      });
    }
    
    // Get published courses
    const publishedCourses = await Course.find({ isPublished: true });
    console.log(`\nPublished courses: ${publishedCourses.length}`);
    
    // Get featured courses
    const featuredCourses = await Course.find({ isFeatured: true });
    console.log(`Featured courses: ${featuredCourses.length}`);
    
    // Get published AND featured courses
    const publishedAndFeatured = await Course.find({ 
      isPublished: true, 
      isFeatured: true 
    });
    console.log(`Published AND featured courses: ${publishedAndFeatured.length}`);
    
    if (publishedAndFeatured.length === 0 && publishedCourses.length > 0) {
      console.log('\n⚠️  No featured courses found, but there are published courses.');
      console.log('Setting some published courses as featured...');
      
      // Set the first few published courses as featured
      const coursesToFeature = publishedCourses.slice(0, 3);
      for (const course of coursesToFeature) {
        await Course.findByIdAndUpdate(course._id, { isFeatured: true });
        console.log(`✅ Set "${course.title}" as featured`);
      }
      
      console.log('\nNow checking featured courses again...');
      const newFeaturedCourses = await Course.find({ 
        isPublished: true, 
        isFeatured: true 
      });
      console.log(`Featured courses after update: ${newFeaturedCourses.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFeaturedCourses(); 