"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { api } from "@/lib/api"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts"
import { Users, DollarSign, BookOpen, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const COLORS = ["#6366f1", "#10b981", "#f59e42", "#ef4444", "#3b82f6", "#a21caf"]

export default function InstructorAnalyticsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollmentTrends, setEnrollmentTrends] = useState<any[]>([])
  const [revenueTrends, setRevenueTrends] = useState<any[]>([])
  const [courseComparison, setCourseComparison] = useState<any[]>([])
  const [ratingsData, setRatingsData] = useState<any[]>([])
  const [studentActivity, setStudentActivity] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch instructor's courses
      const coursesRes = await api.getInstructorCourses()
      if (!coursesRes.success || !coursesRes.data) throw new Error("Failed to fetch courses")
      setCourses(coursesRes.data)

      // Aggregate for charts
      let allEnrollments: any[] = []
      let enrollmentsByMonth: Record<string, number> = {}
      let revenueByMonth: Record<string, number> = {}
      let coursePerf: any[] = []
      let ratings: Record<string, number> = {}
      let active = 0, inactive = 0
      const now = new Date()
      for (const course of coursesRes.data) {
        // Fetch enrollments for each course
        try {
          const enrollmentsRes = await api.getCourseEnrollments(course._id)
          if (enrollmentsRes.success && enrollmentsRes.data) {
            allEnrollments.push(...enrollmentsRes.data.map((e: any) => ({...e, course})))
            // Enrollment & revenue trends (by month)
            for (const enr of enrollmentsRes.data) {
              const d = new Date(enr.enrolledAt)
              const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`
              enrollmentsByMonth[key] = (enrollmentsByMonth[key] || 0) + 1
              revenueByMonth[key] = (revenueByMonth[key] || 0) + (course.price || 0)
              // Student activity (active = progress > 0)
              if (enr.progress?.percentage > 0) active++; else inactive++
            }
            // Course performance
            coursePerf.push({
              name: course.title,
              students: course.enrollmentCount || 0,
              revenue: (course.price || 0) * (course.enrollmentCount || 0),
              rating: course.rating || 0
            })
            // Ratings
            const rating = Math.round(course.rating || 0)
            if (rating > 0) ratings[rating] = (ratings[rating] || 0) + 1
          }
        } catch (e) { /* ignore per-course errors */ }
      }
      // Enrollment trends (last 6 months)
      const chartData = []
      const revData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`
        chartData.push({
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          enrollments: enrollmentsByMonth[key] || 0
        })
        revData.push({
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          revenue: revenueByMonth[key] || 0
        })
      }
      setEnrollmentTrends(chartData)
      setRevenueTrends(revData)
      setCourseComparison(coursePerf)
      setRatingsData(Object.entries(ratings).map(([key, value]) => ({ rating: key, count: value })))
      setStudentActivity([
        { name: "Active", value: active },
        { name: "Inactive", value: inactive }
      ])
    } catch (err: any) {
      setError(err.message || "Failed to load analytics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Visualize your teaching business</p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>

        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends</CardTitle>
            <CardDescription>Monthly new student enrollments</CardDescription>
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

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue from enrollments</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance Comparison</CardTitle>
            <CardDescription>Compare your courses by students and revenue</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseComparison} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#6366f1" name="Students" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ratings Distribution & Student Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Ratings Distribution</CardTitle>
              <CardDescription>How your courses are rated</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ratingsData} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={80} label>
                    {ratingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Activity</CardTitle>
              <CardDescription>Active vs. inactive students</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={studentActivity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {studentActivity.map((entry, index) => (
                      <Cell key={`cell-activity-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 