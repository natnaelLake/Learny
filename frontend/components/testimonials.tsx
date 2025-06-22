import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Developer",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "The courses here are incredibly well-structured and the instructors are top-notch. I landed my dream job after completing the React course!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Data Analyst",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "Amazing platform with practical projects. The Python for Data Science course gave me the skills I needed to transition into data analytics.",
    rating: 5,
  },
  {
    name: "Emily Davis",
    role: "UX Designer",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "The UI/UX course was comprehensive and hands-on. I now feel confident designing user interfaces and have improved my portfolio significantly.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold">What Our Students Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied learners who have transformed their careers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-muted-foreground">"{testimonial.content}"</p>

                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
