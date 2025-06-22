"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Award, Target, Heart, Zap } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const stats = [
    { icon: Users, value: "50K+", label: "Students" },
    { icon: BookOpen, value: "500+", label: "Courses" },
    { icon: Award, value: "200+", label: "Instructors" },
    { icon: Target, value: "95%", label: "Success Rate" },
  ]

  const values = [
    {
      icon: Heart,
      title: "Quality Education",
      description: "We believe everyone deserves access to high-quality education that transforms lives and careers.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously innovate our platform to provide the best learning experience possible.",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a supportive community where learners can connect, collaborate, and grow together.",
    },
    {
      icon: Target,
      title: "Accessibility",
      description: "Making education accessible to everyone, regardless of their background or location.",
    },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Former educator with 15+ years experience in edtech and online learning platforms.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Tech leader passionate about building scalable learning solutions that empower students worldwide.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Content",
      bio: "Curriculum expert dedicated to creating engaging, effective learning experiences for all skill levels.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      name: "David Kim",
      role: "Head of Community",
      bio: "Community builder focused on fostering meaningful connections between learners and instructors.",
      image: "/placeholder.svg?height=150&width=150",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            About LearnY
          </Badge>
          <h1 className="text-4xl font-bold mb-6">
            Empowering Learners Worldwide
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to democratize education by providing high-quality, 
            accessible learning experiences to students around the globe.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                At LearnY, we believe that education should be accessible, engaging, and transformative. 
                Our platform connects passionate instructors with eager learners, creating a dynamic 
                ecosystem where knowledge flows freely and skills are developed effectively.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether you're looking to advance your career, learn a new skill, or explore a passion, 
                we provide the tools, resources, and community support you need to succeed.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <value.icon className="w-8 h-8 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of learners who are already transforming their lives with our courses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Get in Touch</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 