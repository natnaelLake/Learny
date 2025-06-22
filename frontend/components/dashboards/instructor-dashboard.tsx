"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, DollarSign, TrendingUp, Plus, Edit, MoreHorizontal } from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, ApiError } from "@/lib/api"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export function InstructorDashboard() {
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [publishedCourses, setPublishedCourses] = useState(0)
  const [draftCourses, setDraftCourses] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [enrollmentTrends, setEnrollmentTrends] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch instructor's courses
      const coursesRes = await api.getInstructorCourses()
      if (!coursesRes.success || !coursesRes.data) throw new Error("Failed to fetch courses")
      setCourses(coursesRes.data)

      // Aggregate stats
      let students = 0
      let revenue = 0
      let published = 0
      let draft = 0
      let ratingSum = 0
      let ratingCount = 0
      let allEnrollments: any[] = []
      let allRecent: any[] = []
      let enrollmentsByMonth: Record<string, number> = {}
      const now = new Date()
      for (const course of coursesRes.data) {
        if (course.status === "published") published++
        if (course.status === "draft") draft++
        if (course.rating && course.reviewCount > 0) {
          ratingSum += course.rating * course.reviewCount
          ratingCount += course.reviewCount
        }
        students += course.enrollmentCount || 0
        revenue += (course.price || 0) * (course.enrollmentCount || 0)
        // Fetch enrollments for each course
        try {
          const enrollmentsRes = await api.getCourseEnrollments(course._id)
          if (enrollmentsRes.success && enrollmentsRes.data) {
            allEnrollments.push(...enrollmentsRes.data)
            // Recent students (last 5)
            const sorted = [...enrollmentsRes.data].sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
            allRecent.push(...sorted.slice(0, 2))
            // Enrollment trends (by month)
            for (const enr of enrollmentsRes.data) {
              const d = new Date(enr.enrolledAt)
              const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`
              enrollmentsByMonth[key] = (enrollmentsByMonth[key] || 0) + 1
            }
          }
        } catch (e) { /* ignore per-course errors */ }
      }
      setTotalStudents(students)
      setTotalRevenue(revenue)
      setPublishedCourses(published)
      setDraftCourses(draft)
      setAvgRating(ratingCount > 0 ? (ratingSum / ratingCount) : 0)
      setRecentStudents(allRecent.slice(0, 5))
      // Prepare chart data for last 6 months
      const chartData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`
        chartData.push({
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          enrollments: enrollmentsByMonth[key] || 0
        })
      }
      setEnrollmentTrends(chartData)
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading dashboard...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
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
            <div>
              <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
              <p className="text-muted-foreground">Manage your courses and track your success</p>
            </div>
            <Button asChild>
              <Link href="/instructor/courses/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">Across all your courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publishedCourses}</div>
                <p className="text-xs text-muted-foreground">{draftCourses} in draft</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgRating.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Average across all courses</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends (Last 6 Months)</CardTitle>
              <CardDescription>Track your student growth over time</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* My Courses */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Manage and track your course performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-muted-foreground">Updated {new Date(course.updatedAt).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>{course.enrollmentCount?.toLocaleString() || 0}</TableCell>
                          <TableCell>${((course.price || 0) * (course.enrollmentCount || 0)).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={course.status === "published" ? "default" : "secondary"}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/courses/${course._id}`}>
                                    <Users className="w-4 h-4 mr-2" />
                                    View Course
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/instructor/courses/${course._id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Course
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Students */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentStudents.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No recent enrollments</div>
                    ) : recentStudents.map((student, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.student?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{student.course?.title || "Unknown Course"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(student.enrolledAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href="/instructor/courses/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Course
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/instructor/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/instructor/students">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Students
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
