"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  GraduationCap,
  Shield,
  ShieldOff,
  Trophy,
  Gift,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

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
  // Student management fields
  enrollmentId: string
  points: number
  isBlocked: boolean
  blockedAt?: string
  blockedBy?: {
    _id: string
    name: string
  }
  blockReason?: string
  instructorNotes: Array<{
    note: string
    createdAt: string
    createdBy: {
      _id: string
      name: string
    }
  }>
  achievements: Array<{
    type: string
    earnedAt: string
  }>
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
  const [statusFilter, setStatusFilter] = useState("all")

  // Student management state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
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
                _id: enrollment._id,
                name: enrollment.student.name,
                email: enrollment.student.email,
                avatar: enrollment.student.avatar,
                enrolledAt: enrollment.enrolledAt,
                progress: enrollment.progress.percentage,
                completedLessons: enrollment.progress.completedLessons.map((l: any) => l.lesson),
                lastActive: enrollment.lastAccessedAt,
                totalTimeSpent: enrollment.progress.totalTimeSpent,
                course: {
                  _id: course._id,
                  title: course.title,
                  thumbnail: course.thumbnail,
                  price: course.price
                },
                enrollmentId: enrollment._id,
                points: enrollment.points || 0,
                isBlocked: enrollment.isBlocked || false,
                blockedAt: enrollment.blockedAt,
                blockedBy: enrollment.blockedBy,
                blockReason: enrollment.blockReason,
                instructorNotes: enrollment.instructorNotes || [],
                achievements: enrollment.achievements || []
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
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      (student.name?.toLowerCase().includes(searchTermLower)) ||
      (student.email?.toLowerCase().includes(searchTermLower)) ||
      (student.course?.title?.toLowerCase().includes(searchTermLower));
    
    const matchesCourse = selectedCourse === "all" || student.course?._id === selectedCourse;
    
    const matchesProgress = progressFilter === "all" || 
                           (progressFilter === "completed" && student.progress === 100) ||
                           (progressFilter === "in-progress" && student.progress > 0 && student.progress < 100) ||
                           (progressFilter === "not-started" && student.progress === 0)
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && !student.isBlocked) ||
                         (statusFilter === "blocked" && student.isBlocked)
    
    return matchesSearch && matchesCourse && matchesProgress && matchesStatus
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

  // Student management functions
  const handleAwardPoints = async () => {
    if (!selectedStudent) return
    
    try {
      await api.awardPoints(selectedStudent.enrollmentId, {
        points: pointsAmount,
        reason: pointsReason
      })
      
      toast({
        title: "Success",
        description: `Awarded ${pointsAmount} points to ${selectedStudent.name}`,
      })
      
      setIsPointsDialogOpen(false)
      setPointsAmount(10)
      setPointsReason('')
      fetchData() // Refresh data
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
    if (!selectedStudent) return
    
    try {
      await api.toggleBlockStudent(selectedStudent.enrollmentId, {
        reason: blockReason
      })
      
      toast({
        title: "Success",
        description: `Student ${selectedStudent.isBlocked ? 'unblocked' : 'blocked'} successfully`,
      })
      
      setIsBlockDialogOpen(false)
      setBlockReason('')
      fetchData() // Refresh data
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
    if (!selectedStudent || !noteText.trim()) return
    
    try {
      await api.addInstructorNote(selectedStudent.enrollmentId, {
        note: noteText
      })
      
      toast({
        title: "Success",
        description: "Note added successfully",
      })
      
      setIsNoteDialogOpen(false)
      setNoteText('')
      fetchData() // Refresh data
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
    if (!selectedStudent || !achievementText.trim()) return
    
    try {
      await api.awardAchievement(selectedStudent.enrollmentId, {
        achievement: achievementText
      })
      
      toast({
        title: "Success",
        description: `Achievement "${achievementText}" awarded successfully`,
      })
      
      setIsAchievementDialogOpen(false)
      setAchievementText('')
      fetchData() // Refresh data
    } catch (error) {
      console.error('Award achievement error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to award achievement',
        variant: "destructive",
      })
    }
  }

  const openStudentManagement = (student: Student) => {
    setSelectedStudent(student)
    setIsStudentDetailOpen(true)
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
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
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
                            {student.isBlocked && (
                              <Badge variant="destructive" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              <span>{student.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Enrolled in: 
                                <Link href={`/courses/${student.course?._id}`} className="font-semibold hover:underline ml-1">
                                  {student.course?.title || 'Untitled Course'}
                                </Link>
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Enrolled on: {new Date(student.enrolledAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{student.points || 0} points</span>
                            <span>{student.achievements?.length || 0} achievements</span>
                            <span>{Math.round((student.totalTimeSpent || 0) / 60)}h spent</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Progress</span>
                            <span>{Math.round(student.progress || 0)}%</span>
                          </div>
                          <Progress value={student.progress || 0} />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/instructor/courses/${student.course._id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Course
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openStudentManagement(student)}
                          >
                            <MoreHorizontal className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Management Dialogs */}
      
      {/* Student Detail Dialog */}
      <Dialog open={isStudentDetailOpen} onOpenChange={setIsStudentDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Student Management - {selectedStudent?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Manage student progress, award points, and add notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                  {selectedStudent.avatar ? (
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-medium">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant={selectedStudent.isBlocked ? "destructive" : "default"}>
                      {selectedStudent.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                    <span className="text-sm">{selectedStudent.points || 0} points</span>
                    <span className="text-sm">{selectedStudent.achievements?.length || 0} achievements</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="space-y-2">
                <h4 className="font-semibold">Course Information</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedStudent.course.title}</p>
                  <p className="text-sm text-muted-foreground">Enrolled on {new Date(selectedStudent.enrolledAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <h4 className="font-semibold">Progress</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{selectedStudent.progress || 0}%</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold">{Math.round((selectedStudent.totalTimeSpent || 0) / 60)}h</p>
                  </div>
                </div>
                <Progress value={selectedStudent.progress || 0} className="mt-2" />
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
                  variant={selectedStudent.isBlocked ? "default" : "destructive"}
                  onClick={() => {
                    setIsStudentDetailOpen(false)
                    setIsBlockDialogOpen(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  {selectedStudent.isBlocked ? (
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
                  <MessageSquare className="h-4 w-4" />
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
              {selectedStudent.instructorNotes && selectedStudent.instructorNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Notes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedStudent.instructorNotes.map((note, index) => (
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
              {selectedStudent.achievements && selectedStudent.achievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.achievements.map((achievement, index) => (
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
              Award points to {selectedStudent?.name} for their performance
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
              <Textarea
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="Why are you awarding these points?"
                className="mt-1"
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
              {selectedStudent?.isBlocked ? (
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
              {selectedStudent?.isBlocked 
                ? `Unblock ${selectedStudent.name} to restore their access`
                : `Block ${selectedStudent?.name} from accessing the course`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={selectedStudent?.isBlocked 
                  ? "Why are you unblocking this student?"
                  : "Why are you blocking this student?"
                }
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedStudent?.isBlocked ? "default" : "destructive"}
              onClick={handleToggleBlock}
            >
              {selectedStudent?.isBlocked ? "Unblock" : "Block"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Add Note</span>
            </DialogTitle>
            <DialogDescription>
              Add a private note about {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="mt-1"
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
              Award an achievement to {selectedStudent?.name}
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