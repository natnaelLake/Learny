"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  DollarSign, 
  Star, 
  Eye, 
  Clock,
  Calendar,
  BookOpen,
  Play,
  FileText,
  Loader2,
  TrendingUp,
  MessageSquare,
  Award,
  Plus,
  ExternalLink,
  Shield,
  ShieldOff,
  Trophy,
  Gift,
  MessageCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  description: string
  category: string
  level: string
  price: number
  thumbnail: string
  tags: string[]
  whatYouWillLearn: string[]
  requirements: string[]
  enrollmentCount: number
  rating: number
  reviewCount: number
  status: 'draft' | 'published' | 'archived'
  sections?: Section[]
  createdAt: string
  updatedAt: string
}

interface Section {
  _id: string
  title: string
  lessons?: Lesson[]
}

interface Lesson {
  _id: string
  title: string
  type: 'video' | 'text' | 'quiz'
  duration?: number
  content?: string
  videoUrl?: string
  isPublished: boolean
}

interface Progress {
  percentage: number
  totalTimeSpent: number
  completedLessons: string[]
  currentLesson?: string
}

interface InstructorNote {
  note: string
  createdAt: string
  createdBy: {
    _id: string
    name: string
  }
}

interface Achievement {
  type: string
  earnedAt: string
}

interface Enrollment {
  _id: string
  student: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  enrolledAt: string
  progress: Progress
  completedLessons: string[]
  // Student management fields
  points: number
  isBlocked: boolean
  blockedAt?: string
  blockedBy?: {
    _id: string
    name: string
  }
  blockReason?: string
  instructorNotes: InstructorNote[]
  achievements: Achievement[]
}

interface Review {
  _id: string
  student: {
    _id: string
    name: string
    avatar?: string
  }
  rating: number
  comment: string
  createdAt: string
}

export default function CourseDetailPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Student management state
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false)
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false)
  const [pointsAmount, setPointsAmount] = useState(10)
  const [pointsReason, setPointsReason] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [noteText, setNoteText] = useState('')
  const [achievementText, setAchievementText] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "instructor") {
      router.push("/")
      return
    }

    fetchCourseData()
  }, [isAuthenticated, user, router, courseId])

  const fetchCourseData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [courseResponse, enrollmentsResponse, reviewsResponse] = await Promise.all([
        api.getCourse(courseId),
        api.getCourseEnrollments(courseId),
        api.getCourseReviews(courseId)
      ])
      
      if (courseResponse.success && courseResponse.data) {
        // Ensure course has proper default values
        const courseData = {
          _id: courseResponse.data._id,
          title: courseResponse.data.title || 'Untitled Course',
          description: courseResponse.data.description || 'No description available',
          category: courseResponse.data.category || 'Uncategorized',
          level: courseResponse.data.level || 'Not specified',
          price: courseResponse.data.price || 0,
          thumbnail: courseResponse.data.thumbnail || '',
          tags: courseResponse.data.tags || [],
          whatYouWillLearn: courseResponse.data.whatYouWillLearn || [],
          requirements: courseResponse.data.requirements || [],
          enrollmentCount: courseResponse.data.enrollmentCount || 0,
          rating: courseResponse.data.rating || 0,
          reviewCount: courseResponse.data.reviewCount || 0,
          status: courseResponse.data.status || 'draft',
          sections: courseResponse.data.sections || [],
          createdAt: courseResponse.data.createdAt,
          updatedAt: courseResponse.data.updatedAt
        }
        setCourse(courseData)
      }
      
      if (enrollmentsResponse.success && enrollmentsResponse.data) {
        setEnrollments(enrollmentsResponse.data)
      }
      
      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data)
      }
    } catch (error) {
      console.error('Fetch course data error:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch course data'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="destructive">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const capitalizeLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  const getTotalDuration = () => {
    if (!course?.sections) return 0
    return course.sections.reduce((total, section) => {
      return total + (section.lessons?.reduce((sectionTotal, lesson) => {
        return sectionTotal + (lesson.duration || 0)
      }, 0) || 0)
    }, 0)
  }

  const getTotalLessons = () => {
    if (!course?.sections) return 0
    return course.sections.reduce((total, section) => total + (section.lessons?.length || 0), 0)
  }

  const handlePreviewLesson = (lesson: Lesson) => {
    setPreviewLesson(lesson)
    setIsPreviewOpen(true)
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'quiz':
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const renderLessonContent = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return (
          <div className="space-y-4">
            {lesson.videoUrl && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                ) : lesson.videoUrl.includes('vimeo.com') ? (
                  <iframe
                    src={lesson.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                ) : (
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    title={lesson.title}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
            {lesson.videoUrl && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href={lesson.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open video in new tab
                </a>
              </div>
            )}
            {!lesson.videoUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4" />
                <p>No video URL provided</p>
              </div>
            )}
          </div>
        )
      
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            {lesson.content ? (
              <div className="whitespace-pre-wrap">{lesson.content}</div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No content provided</p>
              </div>
            )}
          </div>
        )
      
      case 'quiz':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4" />
            <p>Quiz content will be available in the full lesson view</p>
            <p className="text-sm">This is a quiz lesson with interactive questions</p>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Content type not supported for preview</p>
          </div>
        )
    }
  }

  // Student management functions
  const handleAwardPoints = async () => {
    if (!selectedEnrollment) return
    
    try {
      await api.awardPoints(selectedEnrollment._id, {
        points: pointsAmount,
        reason: pointsReason
      })
      
      toast({
        title: "Success",
        description: `Awarded ${pointsAmount} points to ${selectedEnrollment.student.name}`,
      })
      
      setIsPointsDialogOpen(false)
      setPointsAmount(10)
      setPointsReason('')
      fetchCourseData() // Refresh data
    } catch (error) {
      console.error('Award points error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to award points',
        variant: "destructive",
      })
    }
  }

  const handleToggleBlock = async () => {
    if (!selectedEnrollment) return
    
    try {
      await api.toggleBlockStudent(selectedEnrollment._id, {
        reason: blockReason
      })
      
      toast({
        title: "Success",
        description: `Student ${selectedEnrollment.isBlocked ? 'unblocked' : 'blocked'} successfully`,
      })
      
      setIsBlockDialogOpen(false)
      setBlockReason('')
      fetchCourseData() // Refresh data
    } catch (error) {
      console.error('Toggle block error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update student status',
        variant: "destructive",
      })
    }
  }

  const handleAddNote = async () => {
    if (!selectedEnrollment || !noteText.trim()) return
    
    try {
      await api.addInstructorNote(selectedEnrollment._id, {
        note: noteText
      })
      
      toast({
        title: "Success",
        description: "Note added successfully",
      })
      
      setIsNoteDialogOpen(false)
      setNoteText('')
      fetchCourseData() // Refresh data
    } catch (error) {
      console.error('Add note error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add note',
        variant: "destructive",
      })
    }
  }

  const handleAwardAchievement = async () => {
    if (!selectedEnrollment || !achievementText.trim()) return
    
    try {
      await api.awardAchievement(selectedEnrollment._id, {
        achievement: achievementText
      })
      
      toast({
        title: "Success",
        description: `Achievement "${achievementText}" awarded successfully`,
      })
      
      setIsAchievementDialogOpen(false)
      setAchievementText('')
      fetchCourseData() // Refresh data
    } catch (error) {
      console.error('Award achievement error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to award achievement',
        variant: "destructive",
      })
    }
  }

  const openStudentManagement = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setIsStudentDetailOpen(true)
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* <Header /> */}
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading course...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background">
        {/* <Header /> */}
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Course not found</h2>
            <p className="text-muted-foreground mb-6">{error || "The course you're looking for doesn't exist."}</p>
            <Button asChild>
              <Link href="/instructor/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      
      <div className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/instructor/courses">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-muted-foreground">Course management and analytics</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/instructor/courses/${course._id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Link>
            </Button>
          </div>

          {/* Course Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="aspect-video overflow-hidden">
                  <img
                    src={course.thumbnail || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    {getStatusBadge(course.status)}
                  </div>
                  <CardTitle className="text-2xl">{course.title}</CardTitle>
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{capitalizeLevel(course.level)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.enrollmentCount} students</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-muted-foreground fill-yellow-400 text-yellow-400" />
                      <span>{course.rating} rating</span>
                    </div>
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{getTotalLessons()} lessons</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{Math.round(getTotalDuration() / 60)}h</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Course Content</CardTitle>
                      <CardDescription>Manage your course sections and lessons</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button asChild variant="outline">
                        <Link href={`/instructor/courses/${course._id}/content`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Manage Content
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href={`/instructor/courses/${course._id}/content`}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Add Content
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {course.sections && course.sections.length > 0 ? (
                    <div className="space-y-4">
                      {course.sections.map((section, sectionIndex) => (
                        <div key={section._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              Section {sectionIndex + 1}: {section.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                {section.lessons?.length || 0} lessons
                              </span>
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/instructor/courses/${course._id}/content`}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {section.lessons && section.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson._id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex items-center space-x-2">
                                  {lesson.type === 'video' && <Play className="h-4 w-4" />}
                                  {lesson.type === 'text' && <FileText className="h-4 w-4" />}
                                  {lesson.type === 'quiz' && <Award className="h-4 w-4" />}
                                  <span className="text-sm">
                                    Lesson {lessonIndex + 1}: {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {lesson.duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(lesson.duration / 60)}m
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreviewLesson(lesson)}
                                    title="Preview lesson content"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button asChild size="sm" variant="ghost">
                                    <Link href={`/instructor/courses/${course._id}/content`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(!section.lessons || section.lessons.length === 0) && (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                  No lessons in this section yet
                                </p>
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/instructor/courses/${course._id}/content`}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Lesson
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Want to add more content?
                        </p>
                        <div className="flex justify-center space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/instructor/courses/${course._id}/content`}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Section
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href={`/instructor/courses/${course._id}/content`}>
                              <BookOpen className="h-3 w-3 mr-1" />
                              Manage Content
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add sections and lessons to your course to get started.
                      </p>
                      <Button asChild>
                        <Link href={`/instructor/courses/${course._id}/content`}>
                          Add Content
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-semibold">
                      ${(course.price * course.enrollmentCount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{course.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Reviews</span>
                    <span className="font-semibold">{course.reviewCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Course Price</span>
                    <span className="font-semibold text-primary">${course.price}</span>
                  </div>
                </CardContent>
              </Card>

              {/* What Students Will Learn */}
              <Card>
                <CardHeader>
                  <CardTitle>What Students Will Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.whatYouWillLearn.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs for detailed views */}
          <Tabs defaultValue="enrollments" className="space-y-6">
            <TabsList>
              <TabsTrigger value="enrollments">Enrollments ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Enrollments</CardTitle>
                  <CardDescription>Manage your students and track their progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollments.length > 0 ? (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                {enrollment.student.avatar ? (
                                  <img
                                    src={enrollment.student.avatar}
                                    alt={enrollment.student.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">
                                    {enrollment.student.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{enrollment.student.name}</p>
                                  {enrollment.isBlocked && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Blocked
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {enrollment.progress?.percentage || 0}% complete
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {enrollment.points || 0} points
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {enrollment.achievements?.length || 0} achievements
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {enrollment.progress?.percentage || 0}% complete
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStudentManagement(enrollment)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
                      <p className="text-muted-foreground">
                        Students will appear here once they enroll in your course.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <CardDescription>Feedback from your students</CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                {review.student.avatar ? (
                                  <img
                                    src={review.student.avatar}
                                    alt={review.student.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">
                                    {review.student.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{review.student.name}</p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                      <p className="text-muted-foreground">
                        Student reviews will appear here once they complete your course.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Analytics</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Enrollment Trends</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">This Month</span>
                          <span className="font-medium">
                            {enrollments.filter(e => 
                              new Date(e.enrolledAt).getMonth() === new Date().getMonth()
                            ).length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Last Month</span>
                          <span className="font-medium">
                            {enrollments.filter(e => {
                              const date = new Date(e.enrolledAt)
                              const lastMonth = new Date().getMonth() - 1
                              return date.getMonth() === (lastMonth < 0 ? 11 : lastMonth)
                            }).length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Completion Rates</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Progress</span>
                          <span className="font-medium">
                            {enrollments.length > 0 
                              ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress?.percentage || 0), 0) / enrollments.length)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Completed Course</span>
                          <span className="font-medium">
                            {enrollments.filter(e => e.progress?.percentage === 100).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lesson Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {previewLesson && getLessonIcon(previewLesson.type)}
              <span>{previewLesson?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {previewLesson && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Type: {previewLesson.type}</span>
                    {previewLesson.duration && (
                      <span>Duration: {Math.round(previewLesson.duration / 60)} minutes</span>
                    )}
                    <Badge variant={previewLesson.isPublished ? "default" : "secondary"}>
                      {previewLesson.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {renderLessonContent(previewLesson)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {previewLesson && course && (
              <Button asChild>
                <Link href={`/instructor/courses/${course._id}/content`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lesson
                </Link>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Management Dialogs */}
      
      {/* Student Detail Dialog */}
      <Dialog open={isStudentDetailOpen} onOpenChange={setIsStudentDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Student Management - {selectedEnrollment?.student.name}</span>
            </DialogTitle>
            <DialogDescription>
              Manage student progress, award points, and add notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                  {selectedEnrollment.student.avatar ? (
                    <img
                      src={selectedEnrollment.student.avatar}
                      alt={selectedEnrollment.student.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-medium">
                      {selectedEnrollment.student.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEnrollment.student.name}</h3>
                  <p className="text-muted-foreground">{selectedEnrollment.student.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant={selectedEnrollment.isBlocked ? "destructive" : "default"}>
                      {selectedEnrollment.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                    <span className="text-sm">{selectedEnrollment.points || 0} points</span>
                    <span className="text-sm">{selectedEnrollment.achievements?.length || 0} achievements</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <h4 className="font-semibold">Progress</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{selectedEnrollment.progress?.percentage || 0}%</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold">{Math.round((selectedEnrollment.progress?.totalTimeSpent || 0) / 60)}h</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setIsStudentDetailOpen(false)
                    setIsPointsDialogOpen(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  <Gift className="h-4 w-4" />
                  <span>Award Points</span>
                </Button>
                <Button
                  variant={selectedEnrollment.isBlocked ? "default" : "destructive"}
                  onClick={() => {
                    setIsStudentDetailOpen(false)
                    setIsBlockDialogOpen(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  {selectedEnrollment.isBlocked ? (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      <span>Unblock</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Block</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStudentDetailOpen(false)
                    setIsNoteDialogOpen(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Add Note</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStudentDetailOpen(false)
                    setIsAchievementDialogOpen(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Award Achievement</span>
                </Button>
              </div>

              {/* Notes */}
              {selectedEnrollment.instructorNotes && selectedEnrollment.instructorNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Notes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedEnrollment.instructorNotes.map((note, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedEnrollment.achievements && selectedEnrollment.achievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnrollment.achievements.map((achievement, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3" />
                        <span>{achievement.type}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Award Points Dialog */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Award Points</span>
            </DialogTitle>
            <DialogDescription>
              Award points to {selectedEnrollment?.student.name} for their performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Points</label>
              <input
                type="number"
                min="1"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <textarea
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="Why are you awarding these points?"
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPointsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAwardPoints}>
              Award Points
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedEnrollment?.isBlocked ? (
                <>
                  <ShieldOff className="h-5 w-5" />
                  <span>Unblock Student</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Block Student</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedEnrollment?.isBlocked 
                ? `Unblock ${selectedEnrollment.student.name} to restore their access`
                : `Block ${selectedEnrollment?.student.name} from accessing the course`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={selectedEnrollment?.isBlocked 
                  ? "Why are you unblocking this student?"
                  : "Why are you blocking this student?"
                }
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedEnrollment?.isBlocked ? "default" : "destructive"}
              onClick={handleToggleBlock}
            >
              {selectedEnrollment?.isBlocked ? "Unblock" : "Block"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Add Note</span>
            </DialogTitle>
            <DialogDescription>
              Add a private note about {selectedEnrollment?.student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full mt-1 p-2 border rounded-md"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Achievement Dialog */}
      <Dialog open={isAchievementDialogOpen} onOpenChange={setIsAchievementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Award Achievement</span>
            </DialogTitle>
            <DialogDescription>
              Award an achievement to {selectedEnrollment?.student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Achievement</label>
              <input
                type="text"
                value={achievementText}
                onChange={(e) => setAchievementText(e.target.value)}
                placeholder="e.g., Perfect Score, Quick Learner, etc."
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAchievementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAwardAchievement}>
              Award Achievement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 