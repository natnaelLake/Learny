"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { CourseCard } from "@/components/course-card"
import { Loader2, BookOpen } from "lucide-react"

interface EnrolledCourse {
  _id: string
  course: {
    _id: string
    title: string
    thumbnail: string
    instructor: {
      name: string
    }
  }
  progress: {
    percentage: number
  }
}

export default function MyLearningPage() {
  const { user } = useAuthStore()
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await api.getEnrollments()
        if (response.success) {
          setEnrollments(response.data || [])
        } else {
          setError(response.error || "Failed to fetch enrollments")
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "An unexpected error occurred.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnrollments()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Learning</h1>
      
      {enrollments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">You haven't enrolled in any courses yet.</h2>
          <p className="text-muted-foreground">Browse our catalog to find your next learning adventure!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrollments.map((enrollment) => (
            <CourseCard
              key={enrollment._id}
              course={{
                ...enrollment.course,
                progress: enrollment.progress.percentage
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
