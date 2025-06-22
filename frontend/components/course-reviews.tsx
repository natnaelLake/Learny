"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Star, ThumbsUp, ThumbsDown } from "lucide-react"

interface CourseReviewsProps {
  courseId: string
}

const reviews = [
  {
    id: "1",
    user: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    rating: 5,
    date: "2 weeks ago",
    content:
      "Excellent course! The instructor explains everything clearly and the projects are very practical. I learned so much about React and feel confident building applications now.",
    helpful: 24,
    notHelpful: 2,
  },
  {
    id: "2",
    user: {
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    rating: 4,
    date: "1 month ago",
    content:
      "Great content and well-structured lessons. The only thing I'd improve is adding more advanced topics, but overall it's a solid course for beginners to intermediate developers.",
    helpful: 18,
    notHelpful: 1,
  },
  {
    id: "3",
    user: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    rating: 5,
    date: "1 month ago",
    content:
      "This course exceeded my expectations. The hands-on approach and real-world examples made learning React enjoyable and effective. Highly recommended!",
    helpful: 31,
    notHelpful: 0,
  },
]

const ratingDistribution = [
  { stars: 5, count: 1847, percentage: 65 },
  { stars: 4, count: 712, percentage: 25 },
  { stars: 3, count: 213, percentage: 7 },
  { stars: 2, count: 57, percentage: 2 },
  { stars: 1, count: 28, percentage: 1 },
]

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const [sortBy, setSortBy] = useState("helpful")

  const totalReviews = ratingDistribution.reduce((acc, item) => acc + item.count, 0)
  const averageRating = ratingDistribution.reduce((acc, item) => acc + item.stars * item.count, 0) / totalReviews

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Student Reviews</CardTitle>
          <CardDescription>{totalReviews.toLocaleString()} reviews for this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Course Rating</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm">{item.stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={item.percentage} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Sort by:</span>
        <div className="flex space-x-2">
          <Button variant={sortBy === "helpful" ? "default" : "outline"} size="sm" onClick={() => setSortBy("helpful")}>
            Most Helpful
          </Button>
          <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
            Most Recent
          </Button>
          <Button variant={sortBy === "rating" ? "default" : "outline"} size="sm" onClick={() => setSortBy("rating")}>
            Highest Rating
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={review.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.user.name}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-sm leading-relaxed">{review.content}</p>

                {/* Review Actions */}
                <div className="flex items-center space-x-4 pt-2">
                  <span className="text-sm text-muted-foreground">Was this helpful?</span>
                  <Button variant="ghost" size="sm" className="h-8">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {review.helpful}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {review.notHelpful}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Reviews</Button>
      </div>
    </div>
  )
}
