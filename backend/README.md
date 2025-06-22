# LearnY Backend API

A comprehensive backend API for the LearnY learning platform built with Express.js and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Course Management**: CRUD operations for courses with instructor permissions
- **Lesson Management**: Organize course content with sections and lessons
- **Enrollment System**: Track student progress and course enrollments
- **Payment Processing**: Basic payment integration (ready for Stripe)
- **File Uploads**: Support for course materials and media files
- **Progress Tracking**: Monitor student learning progress
- **Search & Filtering**: Advanced course discovery features

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/learny
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create uploads directory**
   ```bash
   mkdir uploads
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Instructor only)
- `PUT /api/courses/:id` - Update course (Instructor only)
- `DELETE /api/courses/:id` - Delete course (Instructor only)
- `GET /api/courses/instructor/my-courses` - Get instructor's courses
- `GET /api/courses/featured` - Get featured courses

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons for a course
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons` - Create lesson (Instructor only)
- `PUT /api/lessons/:id` - Update lesson (Instructor only)
- `DELETE /api/lessons/:id` - Delete lesson (Instructor only)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `GET /api/enrollments/:id` - Get single enrollment
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:id/complete-lesson` - Mark lesson as completed
- `PUT /api/enrollments/:id/progress` - Update enrollment progress
- `PUT /api/enrollments/:id/cancel` - Cancel enrollment

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Uploads
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## Database Models

### User
- Basic info (name, email, password)
- Role-based access (student, instructor, admin)
- Profile data (avatar, bio, preferences)
- Instructor profile (expertise, experience, social links)
- Student profile (interests, completed courses, certificates)

### Course
- Course details (title, description, category, level)
- Pricing and enrollment data
- Instructor relationship
- Content organization (sections, lessons)
- Analytics (rating, reviews, enrollment count)

### Lesson
- Lesson content (video, text, quiz, assignment, file)
- Course and section relationships
- Progress tracking
- Resource attachments

### Section
- Course content organization
- Lesson grouping
- Order management

### Enrollment
- Student-course relationship
- Progress tracking
- Payment information
- Completion status

## Authentication & Authorization

### JWT Token
- Tokens are sent in the Authorization header: `Bearer <token>`
- Token expiration: 7 days (configurable)
- Automatic token refresh not implemented (client should handle)

### Role-Based Access
- **Student**: Can enroll in courses, view lessons, track progress
- **Instructor**: Can create/edit courses, manage lessons, view analytics
- **Admin**: Full system access, user management

## Error Handling

The API uses a centralized error handling middleware that:
- Catches and formats all errors
- Provides meaningful error messages
- Includes stack traces in development
- Handles MongoDB-specific errors (validation, duplicate keys, etc.)

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: bcryptjs for secure password storage
- **JWT**: Secure token-based authentication

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (not implemented yet)

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Set up MongoDB Atlas or production MongoDB
4. Configure environment variables
5. Set up reverse proxy (nginx)
6. Use PM2 or similar process manager
7. Set up SSL/TLS certificates

## Future Enhancements

- [ ] Password reset functionality
- [ ] Stripe payment integration
- [ ] Cloudinary file upload integration
- [ ] Real-time notifications (Socket.io)
- [ ] Course reviews and ratings
- [ ] Discussion forums
- [ ] Certificate generation
- [ ] Analytics dashboard
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Docker containerization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 