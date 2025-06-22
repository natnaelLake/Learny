"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  instructor: {
    name: string
  }
  price: number
  originalPrice?: number
  rating: number
  enrollmentCount: number
  duration: number
  level: string
  thumbnail: string
  category: string
  description: string
}

interface FeaturedCoursesProps {
  courses: Course[]
  isLoading: boolean
}

export function FeaturedCourses({ courses, isLoading }: FeaturedCoursesProps) {
  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
            <p className="text-lg text-muted-foreground">
              Discover our most popular courses and start your learning journey
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading featured courses...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
            <p className="text-lg text-muted-foreground">
              Discover our most popular courses and start your learning journey
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">No featured courses available yet</p>
              <p className="text-sm text-muted-foreground">Check back soon for new courses!</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
          <p className="text-lg text-muted-foreground">
            Discover our most popular courses and start your learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.slice(0, 6).map((course) => (
            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden">
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <CardTitle className="text-lg mb-2 line-clamp-2">
                  <Link href={`/courses/${course._id}`} className="hover:text-primary">
                    {course.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 mb-3">
                  {course.description}
                </CardDescription>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollmentCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.round((course.duration || 0) / 60)}h</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">${course.price || 0}</span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${course.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/courses/${course._id}`}>View Course</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/courses">Browse All Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
