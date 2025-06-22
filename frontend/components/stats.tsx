import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Award, Globe } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Students",
    description: "Learning every day",
  },
  {
    icon: BookOpen,
    value: "500+",
    label: "Courses Available",
    description: "Across all categories",
  },
  {
    icon: Award,
    value: "50+",
    label: "Expert Instructors",
    description: "Industry professionals",
  },
  {
    icon: Globe,
    value: "100+",
    label: "Countries",
    description: "Students worldwide",
  },
]

export function Stats() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="font-semibold">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.description}</div>
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
