const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://learny-tmll.onrender.com/api';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    pages: number;
  };
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: any;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('API: Making request to:', url, 'with config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? 'Body present' : 'No body'
    })

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('API: Response status:', response.status, 'data:', data)

      if (!response.ok) {
        throw new ApiError(response.status, data.error || data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API: Request failed:', error)
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Network error');
    }
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'instructor';
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Registration failed');
    }

    return data;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Login failed');
    }

    return data;
  }

  async getCurrentUser(): Promise<{ success: boolean; user: any }> {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('token') && { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Failed to get current user');
    }

    return data;
  }

  async updateProfile(profileData: { name?: string; bio?: string; avatar?: string }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Courses
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    search?: string;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    
    return this.request<any[]>(endpoint);
  }

  async getCourse(id: string) {
    console.log('API: Getting course with ID:', id);
    return this.request<any>(`/courses/${id}`);
  }

  async getFeaturedCourses() {
    return this.request<any[]>('/courses/featured');
  }

  async createCourse(courseData: {
    title: string;
    description: string;
    category: string;
    level: string;
    price: number;
    thumbnail: string;
    tags?: string[];
    whatYouWillLearn?: string[];
    requirements?: string[];
  }) {
    console.log('API: Creating course with data:', courseData)
    
    try {
      const response = await this.request<any>('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });
      
      console.log('API: Course creation response:', response);
      return response;
    } catch (error) {
      console.error('API: Course creation failed:', error);
      throw error;
    }
  }

  async updateCourse(id: string, courseData: Partial<any>) {
    return this.request<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: string) {
    return this.request<{ message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async getInstructorCourses() {
    return this.request<any[]>('/courses/instructor/my-courses');
  }

  async getCourseEnrollments(courseId: string) {
    return this.request<any[]>(`/courses/${courseId}/enrollments`);
  }

  async getCourseReviews(courseId: string) {
    return this.request<any[]>(`/courses/${courseId}/reviews`);
  }

  async publishCourse(courseId: string) {
    return this.request<any>(`/courses/${courseId}/publish`, {
      method: 'PUT',
    });
  }

  async unpublishCourse(courseId: string) {
    return this.request<any>(`/courses/${courseId}/unpublish`, {
      method: 'PUT',
    });
  }

  async archiveCourse(courseId: string) {
    return this.request<any>(`/courses/${courseId}/archive`, {
      method: 'PUT',
    });
  }

  async getCourseAnalytics(courseId: string) {
    return this.request<any>(`/courses/${courseId}/analytics`);
  }

  async getCourseLessons(courseId: string) {
    return this.request<any[]>(`/courses/${courseId}/lessons`);
  }

  // Lessons
  async getLesson(id: string) {
    return this.request<any>(`/lessons/${id}`);
  }

  async createLesson(lessonData: {
    title: string;
    course: string;
    section: string;
    type: string;
    order: number;
    content?: any;
    videoUrl?: string;
    duration?: number;
    quizData?: {
      questions: Array<{
        id: string;
        question: string;
        type: 'multiple-choice' | 'true-false' | 'short-answer';
        options?: string[];
        correctAnswer: string;
        explanation?: string;
        points: number;
      }>;
      timeLimit: number;
      passingScore: number;
      allowRetakes: boolean;
    };
    references?: Array<{
      id: string;
      title: string;
      type: 'book' | 'pdf' | 'article' | 'link' | 'video';
      url?: string;
      description?: string;
      isRequired: boolean;
    }>;
  }) {
    console.log('API: Creating lesson with data:', lessonData);
    
    try {
      const response = await this.request<any>('/lessons', {
        method: 'POST',
        body: JSON.stringify(lessonData),
      });
      
      console.log('API: Lesson creation response:', response);
      return response;
    } catch (error) {
      console.error('API: Lesson creation failed:', error);
      throw error;
    }
  }

  async updateLesson(id: string, lessonData: Partial<any>) {
    console.log('API: Updating lesson:', id, 'with data:', lessonData);
    return this.request<any>(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    });
  }

  async deleteLesson(id: string) {
    console.log('API: Deleting lesson:', id);
    return this.request<{ message: string }>(`/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  // Sections
  async getSection(id: string) {
    return this.request<any>(`/sections/${id}`);
  }

  async createSection(sectionData: {
    title: string;
    description: string;
    course: string;
    order: number;
  }) {
    console.log('API: Creating section with data:', sectionData);
    
    try {
      const response = await this.request<any>('/sections', {
        method: 'POST',
        body: JSON.stringify(sectionData),
      });
      
      console.log('API: Section creation response:', response);
      return response;
    } catch (error) {
      console.error('API: Section creation failed:', error);
      throw error;
    }
  }

  async updateSection(id: string, sectionData: Partial<any>) {
    console.log('API: Updating section:', id, 'with data:', sectionData);
    return this.request<any>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData),
    });
  }

  async deleteSection(id: string) {
    console.log('API: Deleting section:', id);
    return this.request<{ message: string }>(`/sections/${id}`, {
      method: 'DELETE',
    });
  }

  // Enrollments
  async getEnrollments() {
    return this.request<any[]>('/enrollments');
  }

  async getEnrollment(id: string) {
    return this.request<any>(`/enrollments/${id}`);
  }

  async enrollInCourse(enrollmentData: { courseId: string }) {
    return this.request<any>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
  }

  async completeLesson(enrollmentId: string, lessonData: { lessonId: string; timeSpent?: number }) {
    return this.request<any>(`/enrollments/${enrollmentId}/complete-lesson`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    });
  }

  async updateProgress(enrollmentId: string, progressData: { currentLesson?: string }) {
    return this.request<any>(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  async unenrollFromCourse(enrollmentId: string) {
    return this.request<{ message: string }>(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async cancelEnrollment(id: string) {
    return this.request<{ message: string }>(`/enrollments/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // Payments
  async createPaymentIntent(paymentData: { amount: number; courseId: string }) {
    return this.request<any>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async confirmPayment(paymentData: { paymentIntentId: string; courseId: string }) {
    return this.request<any>('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory() {
    return this.request<any[]>('/payments/history');
  }

  // Uploads
  async uploadFile(file: File) {
    console.log('API: Uploading file:', file.name, 'size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      console.log('API: Upload response:', data);

      if (!response.ok) {
        throw new ApiError(response.status, data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('API: Upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${this.baseURL}/upload/multiple`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.error || 'Upload failed');
    }

    return response.json();
  }

  // Users (Admin only)
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUserRole(id: string, role: string) {
    return this.request<any>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Quiz functions
  async startQuizAttempt(quizData: {
    courseId: string;
    lessonId: string;
    totalQuestions: number;
    allowRetakes?: boolean;
  }) {
    return this.request<any>('/quiz/start', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  async submitQuizAnswer(answerData: {
    attemptId: string;
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
  }) {
    return this.request<any>('/quiz/answer', {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async completeQuizAttempt(attemptId: string) {
    return this.request<any>('/quiz/complete', {
      method: 'POST',
      body: JSON.stringify({ attemptId }),
    });
  }

  async getCurrentQuizAttempt(lessonId: string) {
    return this.request<any>(`/quiz/current/${lessonId}`);
  }

  async getCompletedQuizAttempt(lessonId: string) {
    return this.request<any>(`/quiz/completed/${lessonId}`);
  }

  async canTakeQuiz(lessonId: string) {
    return this.request<any>(`/quiz/can-take/${lessonId}`);
  }

  async getQuizHistory(lessonId: string) {
    return this.request<any>(`/quiz/history/${lessonId}`);
  }

  async abandonQuizAttempt(attemptId: string) {
    return this.request<any>('/quiz/abandon', {
      method: 'POST',
      body: JSON.stringify({ attemptId }),
    });
  }

  async getQuizStats(courseId: string) {
    return this.request<any>(`/quiz/stats/${courseId}`);
  }

  // Student Management (Instructor only)
  async awardPoints(enrollmentId: string, pointsData: { points: number; reason?: string }) {
    return this.request<any>(`/enrollments/${enrollmentId}/award-points`, {
      method: 'PUT',
      body: JSON.stringify(pointsData),
    });
  }

  async toggleBlockStudent(enrollmentId: string, blockData?: { reason?: string }) {
    return this.request<any>(`/enrollments/${enrollmentId}/toggle-block`, {
      method: 'PUT',
      body: JSON.stringify(blockData || {}),
    });
  }

  async addInstructorNote(enrollmentId: string, noteData: { note: string }) {
    return this.request<any>(`/enrollments/${enrollmentId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async awardAchievement(enrollmentId: string, achievementData: { achievement: string }) {
    return this.request<any>(`/enrollments/${enrollmentId}/achievements`, {
      method: 'POST',
      body: JSON.stringify(achievementData),
    });
  }

  async getStudentManagementData(enrollmentId: string) {
    return this.request<any>(`/enrollments/${enrollmentId}/management`);
  }
}

export const api = new ApiService(API_BASE_URL);
export { ApiError }; 