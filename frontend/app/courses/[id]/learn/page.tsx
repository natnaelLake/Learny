"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { VideoPlayer } from "@/components/video-player"
import { CourseSidebar } from "@/components/course-sidebar"
import { LessonContent } from "@/components/lesson-content"
import { QuizComponent } from "@/components/quiz-component"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Lesson {
  _id: string
  title: string
  type: string
  duration: number
  order: number
  isPublished: boolean
  videoUrl?: string
  content?: string
  quizData?: {
    questions: Array<{
      id: string
      question: string
      type: 'multiple-choice' | 'true-false' | 'short-answer'
      options?: string[]
      correctAnswer: string
      explanation?: string
      points: number
    }>
    timeLimit: number
    passingScore: number
    allowRetakes: boolean
  }
}

interface Section {
  _id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Course {
  _id: string
  title: string
  description: string
  instructor: {
    _id: string
    name: string
    avatar?: string
  }
  sections: Section[]
  isEnrolled: boolean
  enrollmentId?: string
}

interface Enrollment {
  _id: string
  course: string
  student: string
  progress: {
    currentLesson?: string
    completedLessons: Array<{
      lesson: string
      completedAt: Date
      timeSpent?: number
    }>
  }
}

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()
  
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch course data and enrollment
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch course data
        const courseResponse = await api.getCourse(courseId)
        if (!courseResponse.success || !courseResponse.data) {
          throw new Error('Failed to fetch course data')
        }

        const courseData = courseResponse.data
        
        // Check if user is enrolled
        if (!courseData.isEnrolled) {
          setError('You must be enrolled in this course to access the learning content')
          setIsLoading(false)
          return
        }

        setCourse(courseData)

        // Fetch enrollment data
        if (courseData.enrollmentId) {
          const enrollmentResponse = await api.getEnrollment(courseData.enrollmentId)
          if (enrollmentResponse.success && enrollmentResponse.data) {
            setEnrollment(enrollmentResponse.data)
            
            // Set current lesson from enrollment progress or first lesson
            const currentLesson = enrollmentResponse.data.progress?.currentLesson
            if (currentLesson) {
              setCurrentLessonId(currentLesson)
            } else if (courseData.sections.length > 0 && courseData.sections[0].lessons.length > 0) {
              setCurrentLessonId(courseData.sections[0].lessons[0]._id)
            }
          }
        } else if (courseData.sections.length > 0 && courseData.sections[0].lessons.length > 0) {
          // Fallback to first lesson if no enrollment progress
          setCurrentLessonId(courseData.sections[0].lessons[0]._id)
        }

      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Failed to load course data'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (courseId && isAuthenticated) {
      fetchCourseData()
    }
  }, [courseId, isAuthenticated, toast])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, router])

  const getCurrentLesson = (): Lesson | null => {
    if (!course || !currentLessonId) return null
    
    for (const section of course.sections) {
      const lesson = section.lessons.find(l => l._id === currentLessonId)
      if (lesson) return lesson
    }
    return null
  }

  const getNextLesson = (): Lesson | null => {
    if (!course || !currentLessonId) return null
    
    let foundCurrent = false
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (foundCurrent) return lesson
        if (lesson._id === currentLessonId) foundCurrent = true
      }
    }
    return null
  }

  const getPreviousLesson = (): Lesson | null => {
    if (!course || !currentLessonId) return null
    
    let previousLesson = null
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson._id === currentLessonId) return previousLesson
        previousLesson = lesson
      }
    }
    return null
  }

  const isLessonCompleted = (lessonId: string): boolean => {
    if (!enrollment) return false
    return enrollment.progress.completedLessons.some(cl => cl.lesson === lessonId)
  }

  const calculateProgress = (): number => {
    if (!course || !enrollment) return 0
    
    const totalLessons = course.sections.reduce((total, section) => 
      total + section.lessons.length, 0
    )
    
    if (totalLessons === 0) return 0
    
    return Math.round((enrollment.progress.completedLessons.length / totalLessons) * 100)
  }

  const handleLessonComplete = async () => {
    if (!enrollment || !currentLessonId) return

    try {
      // Mark lesson as completed
      await api.completeLesson(enrollment._id, { lessonId: currentLessonId })
      
      // Update local enrollment state
      const updatedEnrollment = { ...enrollment }
      if (!updatedEnrollment.progress.completedLessons.some(cl => cl.lesson === currentLessonId)) {
        updatedEnrollment.progress.completedLessons.push({
          lesson: currentLessonId,
          completedAt: new Date()
        })
      }
      setEnrollment(updatedEnrollment)

      // Move to next lesson
      const nextLesson = getNextLesson()
      if (nextLesson) {
        setCurrentLessonId(nextLesson._id)
        
        // Update progress in backend
        await api.updateProgress(enrollment._id, { currentLesson: nextLesson._id })
      }

      toast({
        title: "Lesson completed!",
        description: "Great job! Moving to the next lesson.",
      })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to complete lesson'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId)
    
    // Update progress in backend if enrollment exists
    if (enrollment) {
      api.updateProgress(enrollment._id, { currentLesson: lessonId }).catch(error => {
        console.error('Failed to update progress:', error)
      })
    }
  }

  const lesson = getCurrentLesson()
  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()
  const progress = calculateProgress()

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading course content...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load course</h2>
          <p className="text-muted-foreground mb-4">{error || "Course not found"}</p>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No lessons available</h2>
          <p className="text-muted-foreground">This course doesn't have any lessons yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Course Sidebar */}
      <CourseSidebar
        course={{
          id: course._id,
          title: course.title,
          progress,
          curriculum: course.sections.map(section => ({
            id: section._id,
            title: section.title,
            lessons: section.lessons.map(lesson => ({
              id: lesson._id,
              title: lesson.title,
              duration: `${Math.round(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}`,
              type: lesson.type,
              completed: isLessonCompleted(lesson._id)
            }))
          }))
        }}
        currentLesson={currentLessonId || ''}
        onLessonSelect={handleLessonSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/courses/${courseId}`)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-semibold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">{lesson.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <Progress value={progress} className="w-24" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Badge variant={lesson.type === "video" ? "default" : "secondary"}>{lesson.type}</Badge>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-hidden">
          {lesson.type === "video" && lesson.videoUrl && (
            <VideoPlayer
              videoUrl={lesson.videoUrl}
              title={lesson.title}
              onComplete={handleLessonComplete}
            />
          )}

          {lesson.type === "quiz" && (
            <QuizComponent 
              lessonId={lesson._id} 
              courseId={courseId}
              quizData={lesson.quizData}
              onComplete={handleLessonComplete} 
            />
          )}

          {lesson.type === "text" && lesson.content && (
            <LessonContent 
              content={lesson.content} 
              onComplete={handleLessonComplete} 
            />
          )}

          {lesson.type === "video" && !lesson.videoUrl && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video not available</h3>
                <p className="text-muted-foreground mb-4">This video lesson is not available yet.</p>
                <Button onClick={handleLessonComplete}>
                  Mark as Complete
                </Button>
              </div>
            </div>
          )}

          {lesson.type === "text" && !lesson.content && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Content not available</h3>
                <p className="text-muted-foreground mb-4">This text lesson is not available yet.</p>
                <Button onClick={handleLessonComplete}>
                  Mark as Complete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => previousLesson && setCurrentLessonId(previousLesson._id)}
              disabled={!previousLesson}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {isLessonCompleted(lesson._id) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />
              )}
              <span className="text-sm">
                {isLessonCompleted(lesson._id) ? "Completed" : "Mark as complete"}
              </span>
            </div>

            <Button 
              onClick={() => nextLesson && setCurrentLessonId(nextLesson._id)} 
              disabled={!nextLesson}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
