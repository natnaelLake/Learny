"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  X, 
  Upload, 
  Loader2,
  Save,
  ArrowLeft,
  Eye
} from "lucide-react"
import Link from "next/link"

const categories = [
  "Web Development",
  "Mobile Development", 
  "Data Science",
  "Machine Learning",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Health & Fitness",
  "Language",
  "Other"
]

const levels = [
  "beginner",
  "intermediate", 
  "advanced"
]

interface Course {
  _id: string
  title: string
  description: string
  category: string
  level: string
  price: number
  thumbnail: string
  tags: string[]
  whatYouWillLearn: string[]
  requirements: string[]
  status: 'draft' | 'published' | 'archived'
}

export default function EditCoursePage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const courseId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
    price: "",
    thumbnail: "",
    tags: [] as string[],
    whatYouWillLearn: [] as string[],
    requirements: [] as string[]
  })
  
  const [newTag, setNewTag] = useState("")
  const [newLearningPoint, setNewLearningPoint] = useState("")
  const [newRequirement, setNewRequirement] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "instructor") {
      router.push("/")
      return
    }

    fetchCourse()
  }, [isAuthenticated, user, router, courseId])

  const fetchCourse = async () => {
    try {
      setIsLoading(true)
      
      const response = await api.getCourse(courseId)
      
      if (response.success && response.data) {
        const courseData = response.data
        setCourse(courseData)
        setCourseData({
          title: courseData.title || "",
          description: courseData.description || "",
          category: courseData.category || "",
          level: courseData.level || "",
          price: courseData.price?.toString() || "",
          thumbnail: courseData.thumbnail || "",
          tags: courseData.tags || [],
          whatYouWillLearn: courseData.whatYouWillLearn || [],
          requirements: courseData.requirements || []
        })
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      router.push("/instructor/courses")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addLearningPoint = () => {
    if (newLearningPoint.trim() && !courseData.whatYouWillLearn.includes(newLearningPoint.trim())) {
      setCourseData(prev => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, newLearningPoint.trim()]
      }))
      setNewLearningPoint("")
    }
  }

  const removeLearningPoint = (pointToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter(point => point !== pointToRemove)
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !courseData.requirements.includes(newRequirement.trim())) {
      setCourseData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (requirementToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }))
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const response = await api.uploadFile(file)
      
      if (response.success && response.data) {
        setCourseData(prev => ({
          ...prev,
          thumbnail: response.data.url
        }))
        
        toast({
          title: "Thumbnail uploaded",
          description: "Course thumbnail has been uploaded successfully",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Thumbnail upload failed'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!courseData.title.trim()) {
      toast({
        title: "Validation error",
        description: "Course title is required",
        variant: "destructive",
      })
      return
    }

    if (!courseData.description.trim()) {
      toast({
        title: "Validation error",
        description: "Course description is required",
        variant: "destructive",
      })
      return
    }

    if (!courseData.category) {
      toast({
        title: "Validation error",
        description: "Please select a category",
        variant: "destructive",
      })
      return
    }

    if (!courseData.level) {
      toast({
        title: "Validation error",
        description: "Please select a level",
        variant: "destructive",
      })
      return
    }

    if (!courseData.price || parseFloat(courseData.price) < 0) {
      toast({
        title: "Validation error",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      
      const response = await api.updateCourse(courseId, {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level.toLowerCase(),
        price: parseFloat(courseData.price),
        thumbnail: courseData.thumbnail,
        tags: courseData.tags,
        whatYouWillLearn: courseData.whatYouWillLearn,
        requirements: courseData.requirements
      })

      if (response.success && response.data) {
        toast({
          title: "Course updated!",
          description: "Your course has been updated successfully",
        })
        
        // Redirect to course detail page
        router.push(`/instructor/courses/${courseId}`)
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading course...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Course not found</h2>
            <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/instructor/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Link href={`/instructor/courses/${courseId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Edit Course</h1>
              <p className="text-muted-foreground">Update your course information and content</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/instructor/courses/${courseId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Link>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the foundation of your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={courseData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={courseData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select value={courseData.level} onValueChange={(value) => handleInputChange("level", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>Course Thumbnail</CardTitle>
                <CardDescription>Update the image that represents your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseData.thumbnail && (
                    <div className="w-full max-w-xs">
                      <img
                        src={courseData.thumbnail}
                        alt="Course thumbnail"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      id="thumbnail"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Label htmlFor="thumbnail" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={isUploading}>
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {courseData.thumbnail ? "Update Thumbnail" : "Upload Thumbnail"}
                      </Button>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Course Tags</CardTitle>
                <CardDescription>Update relevant tags to help students find your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {courseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {courseData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What Students Will Learn */}
            <Card>
              <CardHeader>
                <CardTitle>What Students Will Learn</CardTitle>
                <CardDescription>Update the key learning outcomes of your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newLearningPoint}
                    onChange={(e) => setNewLearningPoint(e.target.value)}
                    placeholder="Add a learning outcome"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningPoint())}
                  />
                  <Button type="button" onClick={addLearningPoint} disabled={!newLearningPoint.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {courseData.whatYouWillLearn.length > 0 && (
                  <div className="space-y-2">
                    {courseData.whatYouWillLearn.map((point, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <span className="flex-1">{point}</span>
                        <button
                          type="button"
                          onClick={() => removeLearningPoint(point)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <CardDescription>Update what students should know before taking this course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add a requirement"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} disabled={!newRequirement.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {courseData.requirements.length > 0 && (
                  <div className="space-y-2">
                    {courseData.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <span className="flex-1">{requirement}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(requirement)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/instructor/courses/${courseId}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 