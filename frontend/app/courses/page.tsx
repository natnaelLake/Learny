"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { CourseCard } from "@/components/course-card"
import { CourseFilters } from "@/components/course-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, Eye, EyeOff, Grid3X3, List } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import { useDebounce } from "../../hooks/use-debounce"

interface Course {
  _id: string
  title: string
  instructor: {
    _id: string
    name: string
    avatar?: string
  }
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  enrollmentCount: number
  duration: number
  level: string
  thumbnail: string
  category: string
  description: string
  tags: string[]
  slug: string
  isPublished: boolean
}

interface Filters {
  category: string
  level: string
  priceRange: [number, number]
  sort: string
}

export default function CoursesPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllCourses, setShowAllCourses] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    level: "all",
    priceRange: [0, 200],
    sort: "newest"
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  
  const { toast } = useToast()
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort
      }

      // Add search query if provided
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim()
      }

      // Add filters if not "all"
      if (filters.category !== "all") {
        params.category = filters.category
      }
      if (filters.level !== "all") {
        params.level = filters.level
      }
      
      // Add price range filter
      if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 200) {
        params.minPrice = filters.priceRange[0]
        params.maxPrice = filters.priceRange[1]
      }

      let response: any
      
      // If user is instructor and wants to see all courses, use instructor endpoint
      if (isAuthenticated && user?.role === "instructor" && showAllCourses) {
        response = await api.getInstructorCourses()
        if (response.success && response.data) {
          setCourses(response.data)
          setPagination(prev => ({ ...prev, total: response.data.length, pages: 1 }))
        }
      } else {
        // Otherwise, get published courses with filters
        response = await api.getCourses(params)
        if (response.success && response.data) {
          setCourses(response.data)
          if (response.pagination) {
            setPagination(prev => ({
              ...prev,
              total: response.total || 0,
              pages: response.pagination.pages || 1
            }))
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch courses'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchQuery, filters, pagination.page, pagination.limit, showAllCourses, isAuthenticated, user, toast])

  // Fetch courses when dependencies change
  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearchQuery, filters.category, filters.level, filters.sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by the useEffect above with debouncing
  }

  const handleFilter = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sort }))
  }

  const clearFilters = () => {
    setFilters({
      category: "all",
      level: "all",
      priceRange: [0, 200],
      sort: "newest"
    })
    setSearchQuery("")
  }

  const hasActiveFilters = filters.category !== "all" || 
                          filters.level !== "all" || 
                          filters.priceRange[0] !== 0 || 
                          filters.priceRange[1] !== 200 ||
                          debouncedSearchQuery.trim() !== ""

  if (isLoading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading courses...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && courses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Browse Courses</h1>
          
          {/* Instructor toggle for viewing all courses */}
          {isAuthenticated && user?.role === "instructor" && (
            <div className="flex items-center space-x-2">
              <Badge variant={showAllCourses ? "default" : "secondary"}>
                {showAllCourses ? "All My Courses" : "Published Courses"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllCourses(!showAllCourses)}
              >
                {showAllCourses ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Show Published Only
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show All My Courses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <CourseFilters 
              filters={filters}
              onApplyFilters={handleFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Search and controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search courses by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Sort dropdown */}
              <Select value={filters.sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results count and clear filters */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {pagination.total > 0 ? `${pagination.total} course${pagination.total === 1 ? '' : 's'} found` : 'No courses found'}
                {hasActiveFilters && (
                  <span className="ml-2">
                    (filtered)
                  </span>
                )}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Loading indicator for subsequent loads */}
            {isLoading && courses.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Updating results...</span>
              </div>
            )}

            {/* Results */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {courses.map((course) => (
                <div key={course._id} className="relative">
                  {/* Publication status badge for instructors */}
                  {isAuthenticated && user?.role === "instructor" && showAllCourses && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant={course.isPublished ? "default" : "secondary"}>
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  )}
                  
                  <CourseCard 
                    course={{
                      _id: course._id,
                      title: course.title,
                      instructor: { name: course.instructor?.name || 'Unknown Instructor' },
                      price: course.price,
                      originalPrice: course.originalPrice || course.price,
                      rating: course.rating,
                      enrollmentCount: course.enrollmentCount,
                      duration: `${Math.round(course.duration / 60)} hours`,
                      level: course.level,
                      thumbnail: course.thumbnail,
                      category: course.category,
                      description: course.description,
                      tags: course.tags
                    }} 
                  />
                </div>
              ))}
            </div>

            {/* No results message */}
            {courses.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? "No courses found matching your criteria. Try adjusting your filters."
                    : "No courses available at the moment."
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
