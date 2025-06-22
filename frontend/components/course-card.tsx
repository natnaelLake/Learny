import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Users, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  thumbnail: string
  instructor: {
    name: string
  }
  price?: number
  originalPrice?: number
  rating?: number
  enrollmentCount?: number
  progress?: number
  duration?: string
  level?: string
  category?: string
  description?: string
  tags?: string[]
}

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const instructorName = course.instructor?.name || 'N/A';
  console.log(course, "course");
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
      <CardHeader className="p-0">
        <Link href={`/courses/${course._id}`} className="block relative aspect-video overflow-hidden">
          <Image
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 h-14 group-hover:text-primary transition-colors">
            <Link href={`/courses/${course._id}`}>
              {course.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">by {instructorName}</p>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
            {course.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                {course.rating}
              </div>
            )}
            {course.enrollmentCount && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {course.enrollmentCount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col items-start w-full">
        <div className="flex items-center justify-between w-full mb-2 text-sm text-muted-foreground">
          {course.rating ? (
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span>{course.rating}</span>
            </div>
          ) : <div />}
          <span className="text-lg font-bold text-foreground">
            {course.price ? `$${course.price}` : 'Free'}
          </span>
        </div>

        {typeof course.progress === 'number' ? (
          <div className="w-full space-y-2">
            <Progress value={course.progress} aria-label={`${course.progress}% complete`} />
            <p className="text-xs text-muted-foreground text-center">{course.progress}% complete</p>
            <Button className="w-full mt-2" asChild>
              <Link href={`/courses/${course._id}/learn`}>Continue Learning</Link>
            </Button>
          </div>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/courses/${course._id}`}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Course
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
