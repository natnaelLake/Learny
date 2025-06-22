import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative py-20 lg:py-32">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Learn Without
                <span className="text-primary"> Limits</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Access thousands of courses from expert instructors and advance your career with our comprehensive
                learning platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div>
                <div className="font-semibold text-2xl text-foreground">10K+</div>
                <div>Students</div>
              </div>
              <div>
                <div className="font-semibold text-2xl text-foreground">500+</div>
                <div>Courses</div>
              </div>
              <div>
                <div className="font-semibold text-2xl text-foreground">50+</div>
                <div>Instructors</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
