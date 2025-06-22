# LearnY - Online Learning Platform

A comprehensive online learning platform built with Next.js frontend and Node.js/Express backend.

## Features

- **User Authentication**: Register, login, and role-based access (Student, Instructor, Admin)
- **Course Management**: Create, edit, and manage courses with sections and lessons
- **Enrollment System**: Students can enroll in courses and track progress
- **Payment Integration**: Secure payment processing for course enrollment
- **Progress Tracking**: Track lesson completion and course progress
- **File Upload**: Support for course materials and user avatars
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Zustand** - State management
- **React Hook Form** - Form handling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd learny
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Update .env with your configuration
# Required variables:
# - MONGODB_URI
# - JWT_SECRET
# - PORT (optional, defaults to 5000)
# - UPLOAD_PATH (optional, defaults to ./uploads)

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start the development server
npm run dev
```

### 4. Database Setup

Make sure MongoDB is running and accessible. The application will automatically create the necessary collections when it starts.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Courses
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (instructor only)
- `PUT /api/courses/:id` - Update course (instructor only)
- `DELETE /api/courses/:id` - Delete course (instructor only)
- `GET /api/courses/featured` - Get featured courses
- `GET /api/courses/instructor/my-courses` - Get instructor's courses

### Lessons
- `GET /api/lessons/course/:courseId` - Get course lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create lesson (instructor only)
- `PUT /api/lessons/:id` - Update lesson (instructor only)
- `DELETE /api/lessons/:id` - Delete lesson (instructor only)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `GET /api/enrollments/:id` - Get enrollment by ID
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:id/complete-lesson` - Complete lesson
- `PUT /api/enrollments/:id/progress` - Update progress
- `PUT /api/enrollments/:id/cancel` - Cancel enrollment

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Uploads
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
learny/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/           # Utilities and API client
│   ├── hooks/         # Custom hooks
│   └── package.json
└── README.md
```

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/learny
JWT_SECRET=your-secret-key
PORT=5000
UPLOAD_PATH=./uploads
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon
npm start    # Start production server
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start development server
npm run build  # Build for production
npm start    # Start production server
```

## Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Deploy to your preferred platform (Heroku, Railway, etc.)
3. Set environment variables
4. Start the server

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Set the `NEXT_PUBLIC_API_URL` environment variable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 