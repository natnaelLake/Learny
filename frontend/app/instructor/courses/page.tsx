"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  DollarSign, 
  Star,
  Loader2,
  BookOpen,
  Calendar
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
  enrollmentCount: number
  rating: number
  reviewCount: number
  isPublished: boolean
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

export default function InstructorCoursesPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "instructor") {
      router.push("/")
      return
    }

    fetchCourses()
  }, [isAuthenticated, user, router])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.getInstructorCourses()
      
      if (response.success && response.data) {
        // Ensure all courses have proper default values
        const formattedCourses = response.data.map((course: any) => ({
          _id: course._id,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          category: course.category || 'Uncategorized',
          level: course.level || 'Not specified',
          price: course.price || 0,
          thumbnail: course.thumbnail || '',
          enrollmentCount: course.enrollmentCount || 0,
          rating: course.rating || 0,
          reviewCount: course.reviewCount || 0,
          isPublished: course.isPublished || false,
          status: course.status || 'draft',
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }))
        
        setCourses(formattedCourses)
      }
    } catch (error) {
      console.error('Fetch courses error:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch courses'
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

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      await api.deleteCourse(courseId)
      
      toast({
        title: "Course deleted",
        description: "Course has been deleted successfully",
      })
      
      // Refresh courses list
      fetchCourses()
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handlePublishCourse = async (courseId: string) => {
    try {
      await api.publishCourse(courseId)
      
      toast({
        title: "Course published",
        description: "Course is now live and visible to students",
      })
      
      // Refresh courses list
      fetchCourses()
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to publish course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleUnpublishCourse = async (courseId: string) => {
    try {
      await api.unpublishCourse(courseId)
      
      toast({
        title: "Course unpublished",
        description: "Course is now hidden from students",
      })
      
      // Refresh courses list
      fetchCourses()
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to unpublish course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (isPublished: boolean) => {
    if (isPublished) {
      return <Badge variant="default" className="bg-green-500">Published</Badge>
    } else {
      return <Badge variant="secondary">Draft</Badge>
    }
  }

  const capitalizeLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      
      <div className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Courses</h1>
              <p className="text-muted-foreground">Manage your courses and track their performance</p>
            </div>
            <Button asChild>
              <Link href="/instructor/courses/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">Courses created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.reduce((total, course) => total + course.enrollmentCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Students enrolled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${courses.reduce((total, course) => total + (course.price * course.enrollmentCount), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">From course sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.length > 0 
                    ? (courses.reduce((total, course) => total + course.rating, 0) / courses.length).toFixed(1)
                    : "0.0"
                  }
                </div>
                <p className="text-xs text-muted-foreground">Student satisfaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading courses...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={fetchCourses}>
                Try again
              </Button>
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first course and start teaching students around the world.
                </p>
                <Button asChild>
                  <Link href="/instructor/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course._id} className="overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{course.category}</Badge>
                      {getStatusBadge(course.isPublished)}
                    </div>
                    
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {course.title}
                    </CardTitle>
                    
                    <CardDescription className="line-clamp-2 mb-3">
                      {course.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{course.enrollmentCount}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {capitalizeLevel(course.level)}
                          </span>
                        </div>
                      </div>
                      <div className="font-semibold text-primary">
                        ${course.price}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/instructor/courses/${course._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/instructor/courses/${course._id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        {course.isPublished ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnpublishCourse(course._id)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Unpublish
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePublishCourse(course._id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteCourse(course._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 