"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
  AlertCircle,
  Image as ImageIcon,
  Copy,
  MousePointer,
  FileImage
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

interface FormErrors {
  title?: string
  description?: string
  category?: string
  level?: string
  price?: string
  thumbnail?: string
}

export default function CreateCoursePage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  
  const [newTag, setNewTag] = useState("")
  const [newLearningPoint, setNewLearningPoint] = useState("")
  const [newRequirement, setNewRequirement] = useState("")

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "instructor") {
      router.push("/")
      return
    }
  }, [isAuthenticated, user, router])

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            handleFileSelect(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [thumbnailPreview])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!courseData.title.trim()) {
      newErrors.title = "Course title is required"
    } else if (courseData.title.trim().length < 5) {
      newErrors.title = "Course title must be at least 5 characters"
    }

    if (!courseData.description.trim()) {
      newErrors.description = "Course description is required"
    } else if (courseData.description.trim().length < 20) {
      newErrors.description = "Course description must be at least 20 characters"
    }

    if (!courseData.category) {
      newErrors.category = "Please select a category"
    }

    if (!courseData.level) {
      newErrors.level = "Please select a level"
    }

    if (!courseData.price) {
      newErrors.price = "Price is required"
    } else if (parseFloat(courseData.price) < 0) {
      newErrors.price = "Price must be 0 or greater"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
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

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return false
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return

    // Store the file for later upload
    setSelectedFile(file)
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file)
    setThumbnailPreview(previewUrl)
    
    toast({
      title: "File selected",
      description: "Image will be uploaded when you create the course",
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      let thumbnailUrl = courseData.thumbnail
      
      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true)
        try {
          const uploadResponse = await api.uploadFile(selectedFile)
          if (uploadResponse.success && uploadResponse.data) {
            thumbnailUrl = uploadResponse.data.url
          } else {
            throw new Error('Upload failed')
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          const errorMessage = uploadError instanceof ApiError ? uploadError.message : 'Thumbnail upload failed'
          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          })
          return
        } finally {
          setIsUploading(false)
        }
      }
      
      const coursePayload = {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        category: courseData.category,
        level: courseData.level.toLowerCase(),
        price: parseFloat(courseData.price),
        thumbnail: thumbnailUrl,
        tags: courseData.tags,
        whatYouWillLearn: courseData.whatYouWillLearn,
        requirements: courseData.requirements
      }

      console.log('Submitting course data:', coursePayload)
      
      const response = await api.createCourse(coursePayload)

      if (response.success && response.data) {
        toast({
          title: "Course created!",
          description: "Your course has been created successfully",
        })
        
        // Clean up preview URL
        if (thumbnailPreview) {
          URL.revokeObjectURL(thumbnailPreview)
        }
        
        // Redirect to course detail page
        router.push(`/instructor/courses/${response.data._id}`)
      }
    } catch (error) {
      console.error('Course creation error:', error)
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create course'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Link href="/instructor/courses">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Courses
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Create New Course</h1>
              <p className="text-muted-foreground">Build your course and start teaching</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the foundation of your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter course title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <div className="flex items-center space-x-1 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={courseData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    rows={4}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <div className="flex items-center space-x-1 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.description}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={courseData.category} 
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
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
                    {errors.category && (
                      <div className="flex items-center space-x-1 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.category}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select 
                      value={courseData.level} 
                      onValueChange={(value) => handleInputChange("level", value)}
                    >
                      <SelectTrigger className={errors.level ? "border-red-500" : ""}>
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
                    {errors.level && (
                      <div className="flex items-center space-x-1 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.level}</span>
                      </div>
                    )}
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
                      className={errors.price ? "border-red-500" : ""}
                    />
                    {errors.price && (
                      <div className="flex items-center space-x-1 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>Course Thumbnail</CardTitle>
                <CardDescription>Upload an image that represents your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current thumbnail preview */}
                  {(thumbnailPreview || courseData.thumbnail) && (
                    <div className="w-full max-w-xs">
                      <img
                        src={thumbnailPreview || courseData.thumbnail}
                        alt="Course thumbnail"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile.name} (will be uploaded)
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Upload area */}
                  <div
                    ref={dropZoneRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                      ${isDragOver 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                      }
                      ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    
                    <div className="space-y-4">
                      {isUploading ? (
                        <div className="flex flex-col items-center space-y-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-3 rounded-full bg-primary/10">
                              <ImageIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {courseData.thumbnail ? 'Update thumbnail' : 'Upload thumbnail'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Drag & drop, click to browse, or paste from clipboard
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center space-x-2"
                            >
                              <MousePointer className="h-4 w-4" />
                              <span>Browse Files</span>
                            </Button>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Paste ready",
                                  description: "Press Ctrl+V (or Cmd+V) to paste an image from your clipboard",
                                })
                              }}
                              className="flex items-center space-x-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Paste Image</span>
                            </Button>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Supported formats: JPEG, PNG, GIF</p>
                            <p>Maximum size: 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Course Tags</CardTitle>
                <CardDescription>Add relevant tags to help students find your course</CardDescription>
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
                <CardDescription>List the key learning outcomes of your course</CardDescription>
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
                <CardDescription>What students should know before taking this course</CardDescription>
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
              <Button type="button" variant="outline" onClick={() => router.push("/instructor/courses")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 