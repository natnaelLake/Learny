import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api, ApiError } from './api'

interface User {
  id: string
  email: string
  name: string
  role: "student" | "instructor" | "admin"
  avatar?: string
  bio?: string
  instructorProfile?: any
  studentProfile?: any
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: { name: string; email: string; password: string; role?: 'student' | 'instructor' }) => Promise<void>
  logout: () => void
  getCurrentUser: () => Promise<void>
  updateProfile: (profileData: { name?: string; bio?: string; avatar?: string }) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.login({ email, password })
      
      if (response.success && response.token && response.user) {
        // Store token in localStorage
        localStorage.setItem('token', response.token)
        
        // Update store with user data
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Login failed'
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null
      })
      throw error
    }
  },

  register: async (userData: { name: string; email: string; password: string; role?: 'student' | 'instructor' }) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.register(userData)
      
      if (response.success && response.token && response.user) {
        // Store token in localStorage
        localStorage.setItem('token', response.token)
        
        // Update store with user data
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Registration failed'
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      user: null,
      isAuthenticated: false,
      error: null
    })
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    set({ isLoading: true })
    try {
      const response = await api.getCurrentUser()
      
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      // If token is invalid, remove it and set as not authenticated
      localStorage.removeItem('token')
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  },

  updateProfile: async (profileData: { name?: string; bio?: string; avatar?: string }) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.updateProfile(profileData)
      
      if (response.success && response.user) {
        set({
          user: response.user,
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Profile update failed'
      set({
        isLoading: false,
        error: errorMessage
      })
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  price: number
  thumbnail: string
  duration: string
  level: "beginner" | "intermediate" | "advanced"
  category: string
  enrolled: boolean
  progress?: number
}

interface CourseState {
  courses: Course[]
  enrolledCourses: Course[]
  currentCourse: Course | null
  setCourses: (courses: Course[]) => void
  setEnrolledCourses: (courses: Course[]) => void
  setCurrentCourse: (course: Course | null) => void
  enrollInCourse: (courseId: string) => void
  updateProgress: (courseId: string, progress: number) => void
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  enrolledCourses: [],
  currentCourse: null,
  setCourses: (courses) => set({ courses }),
  setEnrolledCourses: (courses) => set({ enrolledCourses: courses }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  enrollInCourse: (courseId) => {
    const { courses, enrolledCourses } = get()
    const course = courses.find((c) => c.id === courseId)
    if (course && !enrolledCourses.find((c) => c.id === courseId)) {
      set({
        enrolledCourses: [...enrolledCourses, { ...course, enrolled: true, progress: 0 }],
      })
    }
  },
  updateProgress: (courseId, progress) => {
    const { enrolledCourses } = get()
    const updatedCourses = enrolledCourses.map((course) => (course.id === courseId ? { ...course, progress } : course))
    set({ enrolledCourses: updatedCourses })
  },
}))
