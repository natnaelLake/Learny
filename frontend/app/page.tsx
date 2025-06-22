"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedCourses } from "@/components/featured-courses"
import { Stats } from "@/components/stats"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        setIsLoading(true)
        const response = await api.getFeaturedCourses()
        
        if (response.success && response.data) {
          setFeaturedCourses(response.data as any)
        }
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch featured courses'
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedCourses()
  }, [toast])

  return (
    <div className="min-h-screen bg-background">
      {/* <Header />   */}
      <main>
        <Hero />
        <FeaturedCourses courses={featuredCourses} isLoading={isLoading} />
        <Stats />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
