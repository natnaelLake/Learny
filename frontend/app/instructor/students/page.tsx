"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Calendar,
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Loader2,
  Eye,
  MessageSquare,
  Award,
  GraduationCap
} from "lucide-react"
import Link from "next/link"

interface Student {
  _id: string
  name: string
  email: string
  avatar?: string
  enrolledAt: string
  progress: number
  completedLessons: string[]
  lastActive: string
  totalTimeSpent: number
  course: {
    _id: string
    title: string
    thumbnail: string
    price: number
  }
}

interface Course {
  _id: string
  title: string
  enrollmentCount: number
  thumbnail: string
}

export default function StudentsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [progressFilter, setProgressFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "instructor") {
      router.push("/")
      return
    }

    fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch instructor's courses first
      const coursesResponse = await api.getInstructorCourses()
      
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data)
        
        // Fetch all enrollments for all courses
        const allEnrollments: Student[] = []
        
        for (const course of coursesResponse.data) {
          try {
            const enrollmentsResponse = await api.getCourseEnrollments(course._id)
            if (enrollmentsResponse.success && enrollmentsResponse.data) {
              const courseEnrollments = enrollmentsResponse.data.map((enrollment: any) => ({
                ...enrollment,
                course: {
                  _id: course._id,
                  title: course.title,
                  thumbnail: course.thumbnail,
                  price: course.price
                }
              }))
              allEnrollments.push(...courseEnrollments)
            }
          } catch (error) {
            console.error(`Error fetching enrollments for course ${course._id}:`, error)
          }
        }
        
        setStudents(allEnrollments)
      }
    } catch (error) {
      console.error('Fetch data error:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch data'
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

  // Filter and sort students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCourse = selectedCourse === "all" || student.course._id === selectedCourse
    
    const matchesProgress = progressFilter === "all" || 
                           (progressFilter === "completed" && student.progress === 100) ||
                           (progressFilter === "in-progress" && student.progress > 0 && student.progress < 100) ||
                           (progressFilter === "not-started" && student.progress === 0)
    
    return matchesSearch && matchesCourse && matchesProgress
  }).sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
      case "name":
        return a.name.localeCompare(b.name)
      case "progress":
        return b.progress - a.progress
      case "course":
        return a.course.title.localeCompare(b.course.title)
      default:
        return 0
    }
  })

  const getProgressBadge = (progress: number) => {
    if (progress === 100) {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>
    } else if (progress > 0) {
      return <Badge variant="secondary">In Progress</Badge>
    } else {
      return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getTotalRevenue = () => {
    return students.reduce((total, student) => total + student.course.price, 0)
  }

  const getAverageProgress = () => {
    if (students.length === 0) return 0
    return Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length)
  }

  const getActiveStudents = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return students.filter(student => new Date(student.lastActive) > thirtyDaysAgo).length
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Students</h1>
              <p className="text-muted-foreground">Manage and track your students' progress</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/instructor/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Courses
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getActiveStudents()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAverageProgress()}%</div>
                <p className="text-xs text-muted-foreground">Course completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${getTotalRevenue().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From enrollments</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
              <CardDescription>Find specific students or filter by criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Course</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Progress</label>
                  <Select value={progressFilter} onValueChange={setProgressFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All progress" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="not-started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently enrolled</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading students...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={fetchData}>
                Try again
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground mb-6">
                  {students.length === 0 
                    ? "You don't have any students enrolled in your courses yet."
                    : "No students match your current filters."
                  }
                </p>
                {students.length === 0 && (
                  <Button asChild>
                    <Link href="/instructor/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Your Courses
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Students ({filteredStudents.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              </div>

              <div className="grid gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{student.name}</h3>
                            {getProgressBadge(student.progress)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              <span>{student.email}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Enrolled {new Date(student.enrolledAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              <span>{student.course.title}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{student.progress}%</div>
                          <div className="text-sm text-muted-foreground">Progress</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/instructor/courses/${student.course._id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Course
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Course Progress</span>
                        <span>{student.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 