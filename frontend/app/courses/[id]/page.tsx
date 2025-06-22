"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { CourseContentPreview } from "@/components/course-content-preview"
import { CourseReviews } from "@/components/course-reviews"
import { PaymentModal } from "@/components/payment-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  Star, 
  Users, 
  Clock, 
  Award, 
  CheckCircle, 
  Play, 
  Loader2,
  BookOpen,
  Target,
  FileText
} from "lucide-react"

interface Course {
  _id: string
  title: string
  description: string
  instructor: {
    _id: string
    name: string
    avatar?: string
    bio?: string
  }
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  enrollmentCount: number
  duration: number
  level: string
  thumbnail: string
  category: string
  tags: string[]
  whatYouWillLearn: string[]
  requirements: string[]
  sections: Array<{
    _id: string
    title: string
    lessons: Array<{
      _id: string
      title: string
      type: string
      duration: number
      isPreview: boolean
    }>
  }>
  isEnrolled?: boolean
  enrollmentId?: string
}

export default function CoursePage() {
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await api.getCourse(courseId)
        
        if (response.success && response.data) {
          setCourse(response.data)
        }
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch course'
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

    if (courseId) {
      fetchCourse()
    }
  }, [courseId, toast])

  const handleEnroll = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to enroll in this course",
        variant: "destructive",
      })
      return
    }

    if (course?.isEnrolled) {
      // Redirect to learning page
      window.location.href = `/courses/${courseId}/learn`
      return
    }

    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    try {
      // Check if already enrolled before attempting to enroll
      if (course?.isEnrolled) {
        toast({
          title: "Already enrolled!",
          description: "You are already enrolled in this course.",
        })
        setShowPaymentModal(false)
        // Redirect to learning page
        setTimeout(() => {
          window.location.href = `/courses/${courseId}/learn`
        }, 1000)
        return
      }

      // This is now a mock enrollment since payment is simulated
      await api.enrollInCourse({ courseId })

      // Refresh course data to show enrollment status
      const response = await api.getCourse(courseId)
      if (response.success && response.data) {
        setCourse(response.data)
      }

      setShowPaymentModal(false)
      toast({
        title: "Enrollment successful!",
        description: "You can now access the course content.",
      })

      // Redirect to learning page
      setTimeout(() => {
        window.location.href = `/courses/${courseId}/learn`
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Enrollment failed'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* <Header /> */}
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
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
            <p className="text-muted-foreground mb-6">
              {error || "The course you're looking for doesn't exist."}
            </p>
            <Button onClick={() => window.history.back()}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const totalLessons = (course.sections || []).reduce((total, section) => 
    total + (section.lessons || []).length, 0
  )

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course header */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">({course.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrollmentCount} students enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{Math.round(course.duration / 60)} hours</span>
                </div>
                <Badge variant="secondary">{course.level}</Badge>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={course.instructor.avatar || "/placeholder.svg"}
                  alt={course.instructor.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">Created by {course.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">{course.category}</p>
                </div>
              </div>
            </div>

            {/* Course thumbnail */}
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <Button size="lg" variant="secondary">
                  <Play className="h-5 w-5 mr-2" />
                  Preview Course
                </Button>
              </div>
            </div>

            {/* What you'll learn */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  What you'll learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(course.whatYouWillLearn || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No learning objectives specified yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {(course.whatYouWillLearn || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(course.requirements || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No specific requirements listed.</p>
                ) : (
                  <ul className="space-y-2">
                    {(course.requirements || []).map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                        <span className="text-sm">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Course content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseContentPreview 
                  sections={course.sections || []}
                  isEnrolled={course.isEnrolled || false}
                />
              </CardContent>
            </Card>

            {/* Reviews */}
            <CourseReviews courseId={course._id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {course.isEnrolled ? (
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>You are enrolled!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">You have access to all content in this course.</p>
                  <Button 
                    onClick={() => window.location.href = `/courses/${courseId}/learn`} 
                    className="w-full"
                    size="lg"
                  >
                    Go to Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2">
                      ${course.price}
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-lg text-muted-foreground line-through ml-2">
                          ${course.originalPrice}
                        </span>
                      )}
                    </div>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <Badge variant="destructive" className="mb-4">
                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                  </div>

                  <Button 
                    onClick={handleEnroll} 
                    className="w-full mb-4"
                    size="lg"
                  >
                    Enroll Now
                  </Button>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Course includes:</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(course.duration / 60)} hours on-demand video</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{totalLessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Full lifetime access</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      30-Day Money-Back Guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          course={course}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
