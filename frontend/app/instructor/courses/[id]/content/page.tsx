"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, 
  X, 
  GripVertical,
  Play,
  FileText,
  Award,
  Save,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  RefreshCw,
  AlertCircle,
  Eye,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface Section {
  _id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  _id: string
  title: string
  type: 'video' | 'text' | 'quiz'
  content?: string
  videoUrl?: string
  duration?: number
  order: number
  isPublished: boolean
}

interface Course {
  _id: string
  title: string
  sections?: Section[]
}

export default function CourseContentPage() {
  const params = useParams()
  const courseId = params?.id as string
  
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Section form state
  const [newSection, setNewSection] = useState({ title: "", description: "" })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  
  // Lesson form state
  const [newLesson, setNewLesson] = useState<{
    title: string;
    type: 'video' | 'text' | 'quiz';
    content: string;
    videoUrl: string;
    videoFile?: File;
    duration: string;
    quizData?: {
      timeLimit: number;
      passingScore: number;
      allowRetakes: boolean;
      questions: {
        id: string;
        question: string;
        type: 'multiple-choice' | 'true-false' | 'short-answer';
        options?: string[];
        correctAnswer: string;
        explanation: string;
        points: number;
      }[];
    };
    references?: {
      id: string;
      title: string;
      type: 'book' | 'pdf' | 'article' | 'link' | 'video';
      url?: string;
      description: string;
      isRequired: boolean;
    }[];
  }>({
    title: "",
    type: "video",
    content: "",
    videoUrl: "",
    duration: ""
  })
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
 
  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching course:', courseId)
      
      if (!courseId || courseId.length < 24) {
        throw new Error('Invalid course ID. Please check the URL.')
      }
      
      const response = await api.getCourse(courseId)
      console.log('Course response:', response)
      
      if (response.success && response.data) {
        const courseData = {
          ...response.data,
          sections: response.data.sections || []
        }
        console.log('Processed course data:', courseData)
        setCourse(courseData)
      } else {
        throw new Error(response.error || 'Failed to fetch course data')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to fetch course'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSection = async () => {
    if (!newSection.title.trim()) {
      toast({
        title: "Error",
        description: "Section title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      console.log('Creating section with data:', {
        title: newSection.title,
        description: newSection.description,
        course: courseId,
        order: course?.sections?.length || 0
      })
      
      const response = await api.createSection({
        title: newSection.title,
        description: newSection.description,
        course: courseId,
        order: course?.sections?.length || 0
      })

      console.log('Section creation response:', response)

      if (response.success) {
        toast({
          title: "Success",
          description: "New section has been added successfully",
        })
        setNewSection({ title: "", description: "" })
        await fetchCourse() // Refresh the course data
      } else {
        throw new Error(response.error || 'Failed to create section')
      }
    } catch (error) {
      console.error('Error creating section:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to add section'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSection = async (sectionId: string, data: { title: string; description: string }) => {
    try {
      setIsSaving(true)
      setError(null)
      
      console.log('Updating section:', sectionId, 'with data:', data)
      
      const response = await api.updateSection(sectionId, data)

      if (response.success) {
        toast({
          title: "Success",
          description: "Section has been updated successfully",
        })
        setEditingSection(null)
        await fetchCourse()
      } else {
        throw new Error(response.error || 'Failed to update section')
      }
    } catch (error) {
      console.error('Error updating section:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to update section'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? All lessons in this section will also be deleted.")) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      console.log('Deleting section:', sectionId)
      
      const response = await api.deleteSection(sectionId)

      if (response.success) {
        toast({
          title: "Success",
          description: "Section has been deleted successfully",
        })
        await fetchCourse()
      } else {
        throw new Error(response.error || 'Failed to delete section')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to delete section'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddLesson = async () => {
    if (!selectedSection) {
      toast({
        title: "Error",
        description: "Please select a section first",
        variant: "destructive",
      })
      return
    }

    if (!newLesson.title.trim()) {
      toast({
        title: "Error",
        description: "Lesson title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      const lessonData = {
        title: newLesson.title,
        type: newLesson.type,
        course: courseId,
        section: selectedSection,
        order: (course?.sections?.find(s => s._id === selectedSection)?.lessons?.length || 0) + 1,
        content: newLesson.content,
        videoUrl: newLesson.videoUrl,
        duration: newLesson.duration ? parseInt(newLesson.duration) : 0,
        quizData: newLesson.quizData,
        references: newLesson.references
      }

      console.log('Creating lesson with data:', lessonData)
      
      const response = await api.createLesson(lessonData)

      console.log('Lesson creation response:', response)

      if (response.success) {
        toast({
          title: "Success",
          description: "New lesson has been added successfully",
        })
        setNewLesson({ title: "", type: "video", content: "", videoUrl: "", duration: "" })
        setSelectedSection(null)
        await fetchCourse()
      } else {
        throw new Error(response.error || 'Failed to create lesson')
      }
    } catch (error) {
      console.error('Error creating lesson:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to add lesson'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateLesson = async (lessonId: string, data: any) => {
    try {
      setIsSaving(true)
      setError(null)
      
      console.log('Updating lesson:', lessonId, 'with data:', data)
      
      const response = await api.updateLesson(lessonId, data)

      if (response.success) {
        toast({
          title: "Success",
          description: "Lesson has been updated successfully",
        })
        setEditingLesson(null)
        await fetchCourse()
      } else {
        throw new Error(response.error || 'Failed to update lesson')
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to update lesson'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      console.log('Deleting lesson:', lessonId)
      
      const response = await api.deleteLesson(lessonId)

      if (response.success) {
        toast({
          title: "Success",
          description: "Lesson has been deleted successfully",
        })
        await fetchCourse()
      } else {
        throw new Error(response.error || 'Failed to delete lesson')
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Failed to delete lesson'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'quiz':
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleVideoFileUpload = async (file: File) => {
    try {
      setIsUploadingVideo(true)
      setError(null)
      
      console.log('Uploading video file:', file.name)
      
      const response = await api.uploadFile(file)
      
      if (response.success && response.data) {
        setNewLesson(prev => ({
          ...prev,
          videoUrl: response.data.url,
          videoFile: undefined
        }))
        
        toast({
          title: "Success",
          description: "Video file has been uploaded successfully",
        })
      } else {
        throw new Error(response.error || 'Video upload failed')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      const errorMessage = error instanceof ApiError ? error.message : 
                          error instanceof Error ? error.message : 'Video upload failed'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const clearForm = () => {
    setNewSection({ title: "", description: "" })
    setNewLesson({ 
      title: "", 
      type: "video", 
      content: "", 
      videoUrl: "", 
      duration: "",
      quizData: {
        questions: [],
        timeLimit: 30,
        passingScore: 70,
        allowRetakes: true
      },
      references: []
    })
    setSelectedSection(null)
    setError(null)
  }

  const getTotalLessons = () => {
    return course?.sections?.reduce((total, section) => total + section.lessons?.length, 0) || 0
  }

  const getTotalDuration = () => {
    return course?.sections?.reduce((total, section) => total + (section.lessons?.reduce((total, lesson) => total + (lesson.duration || 0), 0) || 0), 0) || 0
  }

  const handlePreviewLesson = (lesson: Lesson) => {
    setPreviewLesson(lesson)
    setIsPreviewOpen(true)
  }

  const renderLessonContent = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return (
          <div className="space-y-4">
            {lesson.videoUrl && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                ) : lesson.videoUrl.includes('vimeo.com') ? (
                  <iframe
                    src={lesson.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                ) : (
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    title={lesson.title}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
            {lesson.videoUrl && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href={lesson.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open video in new tab
                </a>
              </div>
            )}
            {!lesson.videoUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4" />
                <p>No video URL provided</p>
              </div>
            )}
          </div>
        )
      
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            {lesson.content ? (
              <div className="whitespace-pre-wrap">{lesson.content}</div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No content provided</p>
              </div>
            )}
          </div>
        )
      
      case 'quiz':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4" />
            <p>Quiz content will be available in the full lesson view</p>
            <p className="text-sm">This is a quiz lesson with interactive questions</p>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Content type not supported for preview</p>
          </div>
        )
    }
  }

  if (!courseId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No course ID found...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading course content...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Course not found</h1>
            <Button asChild>
              <Link href="/instructor/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/instructor/courses/${courseId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchCourse}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <h1 className="text-3xl font-bold">Course Content</h1>
              <p className="text-muted-foreground">{course.title}</p>
            </div>
          </div>

          {/* Quick Actions */}
          {course.sections && course.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Quickly add more content to your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => {
                      setNewSection({ title: "", description: "" })
                      // Scroll to section form
                      document.getElementById('section-form')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <Plus className="h-6 w-6" />
                    <span>Add New Section</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      if (course.sections && course.sections.length > 0) {
                        setSelectedSection(course.sections[0]._id)
                        // Scroll to lesson form
                        document.getElementById('lesson-form')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                    disabled={!course.sections || course.sections.length === 0}
                  >
                    <Play className="h-6 w-6" />
                    <span>Add New Lesson</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Scroll to lesson form
                      document.getElementById('lesson-form')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <FileText className="h-6 w-6" />
                    <span>Manage Content</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sections */}
            <div className="lg:col-span-2 space-y-6">
              <Card id="section-form">
                <CardHeader>
                  <CardTitle>Course Sections</CardTitle>
                  <CardDescription>Organize your course content into sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Section Form */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Add New Section</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearForm}
                      >
                        Clear Form
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-title">Section Title *</Label>
                      <Input
                        id="section-title"
                        value={newSection.title}
                        onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter section title"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-description">Description (Optional)</Label>
                      <Textarea
                        id="section-description"
                        value={newSection.description}
                        onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this section"
                        rows={2}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleAddSection} 
                        disabled={!newSection.title.trim() || isSaving}
                        className="flex-1"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add Section
                      </Button>
                      <Button 
                        onClick={() => {
                          handleAddSection()
                          setNewSection({ title: "", description: "" })
                        }}
                        disabled={!newSection.title.trim() || isSaving}
                        variant="outline"
                      >
                        Add & Continue
                      </Button>
                    </div>
                  </div>

                  {/* Sections List */}
                  <div className="space-y-4">
                    {course.sections && course.sections.length > 0 ? (
                      course.sections.map((section, sectionIndex) => (
                        <div key={section._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold">
                                Section {sectionIndex + 1}: {section.title}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSection(editingSection === section._id ? null : section._id)}
                                disabled={isSaving}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSection(section._id)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {editingSection === section._id ? (
                            <div className="space-y-2 mb-4">
                              <Input
                                value={section.title}
                                onChange={(e) => {
                                  const updatedSections = course.sections?.map(s => 
                                    s._id === section._id ? { ...s, title: e.target.value } : s
                                  ) || []
                                  setCourse({ ...course, sections: updatedSections })
                                }}
                                placeholder="Section title"
                                disabled={isSaving}
                              />
                              <Textarea
                                value={section.description}
                                onChange={(e) => {
                                  const updatedSections = course.sections?.map(s => 
                                    s._id === section._id ? { ...s, description: e.target.value } : s
                                  ) || []
                                  setCourse({ ...course, sections: updatedSections })
                                }}
                                placeholder="Section description"
                                rows={2}
                                disabled={isSaving}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateSection(section._id, {
                                    title: section.title,
                                    description: section.description
                                  })}
                                  disabled={isSaving}
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingSection(null)}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-3">
                              {section.description || "No description"}
                            </p>
                          )}

                          {/* Lessons in this section */}
                          <div className="space-y-2">
                            {section.lessons && section.lessons.length > 0 ? (
                              section.lessons.map((lesson, lessonIndex) => (
                                <div key={lesson._id} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center space-x-2">
                                    {getLessonIcon(lesson.type)}
                                    <span className="text-sm">
                                      Lesson {lessonIndex + 1}: {lesson.title}
                                    </span>
                                    {lesson.duration && (
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(lesson.duration / 60)}m
                                      </Badge>
                                    )}
                                    {!lesson.isPublished && (
                                      <Badge variant="secondary" className="text-xs">
                                        Draft
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreviewLesson(lesson)}
                                      title="Preview lesson content"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingLesson(editingLesson === lesson._id ? null : lesson._id)}
                                      disabled={isSaving}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteLesson(lesson._id)}
                                      disabled={isSaving}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                  No lessons in this section yet
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSection(section._id)
                                    document.getElementById('lesson-form')?.scrollIntoView({ behavior: 'smooth' })
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Lesson to This Section
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No sections created yet. Add your first section above.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Lesson Sidebar */}
            <div className="space-y-6">
              <Card id="lesson-form">
                <CardHeader>
                  <CardTitle>Add Lesson</CardTitle>
                  <CardDescription>Add a new lesson to a section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-section">Section *</Label>
                    <Select 
                      value={selectedSection || ""} 
                      onValueChange={setSelectedSection}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {course.sections && course.sections.map((section) => (
                          <SelectItem key={section._id} value={section._id}>
                            {section.title} ({section.lessons?.length || 0} lessons)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {course.sections && course.sections.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No sections available. Please add a section first.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesson-title">Lesson Title *</Label>
                    <Input
                      id="lesson-title"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter lesson title"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesson-type">Lesson Type</Label>
                    <Select 
                      value={newLesson.type} 
                      onValueChange={(value: 'video' | 'text' | 'quiz') => 
                        setNewLesson(prev => ({ ...prev, type: value }))
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newLesson.type === 'video' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="video-url">Video URL (YouTube, Vimeo, etc.)</Label>
                        <Input
                          id="video-url"
                          value={newLesson.videoUrl}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="Enter video URL"
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="video-file">Or Upload Video File</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="video-file"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setNewLesson(prev => ({ ...prev, videoFile: file }))
                                handleVideoFileUpload(file)
                              }
                            }}
                            disabled={isUploadingVideo || isSaving}
                          />
                          {isUploadingVideo && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: MP4, MOV, AVI, WebM (Max 500MB)
                        </p>
                      </div>
                      
                      {newLesson.videoUrl && (
                        <div className="p-2 bg-muted rounded text-sm">
                          <strong>Video URL:</strong> {newLesson.videoUrl}
                        </div>
                      )}
                    </div>
                  )}

                  {newLesson.type === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="lesson-content">Content</Label>
                      <Textarea
                        id="lesson-content"
                        value={newLesson.content}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter lesson content"
                        rows={6}
                        disabled={isSaving}
                      />
                    </div>
                  )}

                  {newLesson.type === 'quiz' && (
                    <div className="space-y-6">
                      {/* Quiz Settings */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-semibold">Quiz Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                            <Input
                              id="time-limit"
                              type="number"
                              value={newLesson.quizData?.timeLimit || 30}
                              onChange={(e) => setNewLesson(prev => ({
                                ...prev,
                                quizData: {
                                  ...prev.quizData!,
                                  timeLimit: parseInt(e.target.value) || 30
                                }
                              }))}
                              min="1"
                              max="180"
                              disabled={isSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="passing-score">Passing Score (%)</Label>
                            <Input
                              id="passing-score"
                              type="number"
                              value={newLesson.quizData?.passingScore || 70}
                              onChange={(e) => setNewLesson(prev => ({
                                ...prev,
                                quizData: {
                                  ...prev.quizData!,
                                  passingScore: parseInt(e.target.value) || 70
                                }
                              }))}
                              min="1"
                              max="100"
                              disabled={isSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="allow-retakes">Allow Retakes</Label>
                            <Select
                              value={newLesson.quizData?.allowRetakes ? "true" : "false"}
                              onValueChange={(value) => setNewLesson(prev => ({
                                ...prev,
                                quizData: {
                                  ...prev.quizData!,
                                  allowRetakes: value === "true"
                                }
                              }))}
                              disabled={isSaving}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Questions ({newLesson.quizData?.questions.length || 0})</h4>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const newQuestion = {
                                id: Date.now().toString(),
                                question: "",
                                type: 'multiple-choice' as const,
                                options: ["", "", "", ""],
                                correctAnswer: "",
                                explanation: "",
                                points: 1
                              }
                              setNewLesson(prev => ({
                                ...prev,
                                quizData: {
                                  ...prev.quizData!,
                                  questions: [...(prev.quizData?.questions || []), newQuestion]
                                }
                              }))
                            }}
                            disabled={isSaving}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        </div>

                        {newLesson.quizData?.questions.map((question, index) => (
                          <div key={question.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Question {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNewLesson(prev => ({
                                    ...prev,
                                    quizData: {
                                      ...prev.quizData!,
                                      questions: prev.quizData?.questions.filter(q => q.id !== question.id) || []
                                    }
                                  }))
                                }}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label>Question Type</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value: 'multiple-choice' | 'true-false' | 'short-answer') => {
                                  const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                    q.id === question.id 
                                      ? { ...q, type: value, options: value === 'multiple-choice' ? ["", "", "", ""] : undefined }
                                      : q
                                  ) || []
                                  setNewLesson(prev => ({
                                    ...prev,
                                    quizData: {
                                      ...prev.quizData!,
                                      questions: updatedQuestions
                                    }
                                  }))
                                }}
                                disabled={isSaving}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true-false">True/False</SelectItem>
                                  <SelectItem value="short-answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Question Text</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) => {
                                  const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                    q.id === question.id ? { ...q, question: e.target.value } : q
                                  ) || []
                                  setNewLesson(prev => ({
                                    ...prev,
                                    quizData: {
                                      ...prev.quizData!,
                                      questions: updatedQuestions
                                    }
                                  }))
                                }}
                                placeholder="Enter your question"
                                rows={2}
                                disabled={isSaving}
                              />
                            </div>

                            {question.type === 'multiple-choice' && (
                              <div className="space-y-2">
                                <Label>Options</Label>
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center space-x-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => {
                                        const updatedOptions = question.options?.map((opt, idx) => 
                                          idx === optionIndex ? e.target.value : opt
                                        ) || []
                                        const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                          q.id === question.id ? { ...q, options: updatedOptions } : q
                                        ) || []
                                        setNewLesson(prev => ({
                                          ...prev,
                                          quizData: {
                                            ...prev.quizData!,
                                            questions: updatedQuestions
                                          }
                                        }))
                                      }}
                                      placeholder={`Option ${optionIndex + 1}`}
                                      disabled={isSaving}
                                    />
                                    <Button
                                      type="button"
                                      variant={question.correctAnswer === option ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                          q.id === question.id ? { ...q, correctAnswer: option } : q
                                        ) || []
                                        setNewLesson(prev => ({
                                          ...prev,
                                          quizData: {
                                            ...prev.quizData!,
                                            questions: updatedQuestions
                                          }
                                        }))
                                      }}
                                      disabled={isSaving}
                                    >
                                      Correct
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.type === 'true-false' && (
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Select
                                  value={question.correctAnswer}
                                  onValueChange={(value) => {
                                    const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                      q.id === question.id ? { ...q, correctAnswer: value } : q
                                    ) || []
                                    setNewLesson(prev => ({
                                      ...prev,
                                      quizData: {
                                        ...prev.quizData!,
                                        questions: updatedQuestions
                                      }
                                    }))
                                  }}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">True</SelectItem>
                                    <SelectItem value="false">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {question.type === 'short-answer' && (
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Input
                                  value={question.correctAnswer}
                                  onChange={(e) => {
                                    const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                      q.id === question.id ? { ...q, correctAnswer: e.target.value } : q
                                    ) || []
                                    setNewLesson(prev => ({
                                      ...prev,
                                      quizData: {
                                        ...prev.quizData!,
                                        questions: updatedQuestions
                                      }
                                    }))
                                  }}
                                  placeholder="Enter the correct answer"
                                  disabled={isSaving}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Points</Label>
                                <Input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => {
                                    const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                      q.id === question.id ? { ...q, points: parseInt(e.target.value) || 1 } : q
                                    ) || []
                                    setNewLesson(prev => ({
                                      ...prev,
                                      quizData: {
                                        ...prev.quizData!,
                                        questions: updatedQuestions
                                      }
                                    }))
                                  }}
                                  min="1"
                                  max="10"
                                  disabled={isSaving}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Explanation (Optional)</Label>
                                <Textarea
                                  value={question.explanation || ""}
                                  onChange={(e) => {
                                    const updatedQuestions = newLesson.quizData?.questions.map(q => 
                                      q.id === question.id ? { ...q, explanation: e.target.value } : q
                                    ) || []
                                    setNewLesson(prev => ({
                                      ...prev,
                                      quizData: {
                                        ...prev.quizData!,
                                        questions: updatedQuestions
                                      }
                                    }))
                                  }}
                                  placeholder="Explain why this is the correct answer"
                                  rows={2}
                                  disabled={isSaving}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!newLesson.quizData?.questions || newLesson.quizData.questions.length === 0) && (
                          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-2">No questions added yet</p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const newQuestion = {
                                  id: Date.now().toString(),
                                  question: "",
                                  type: 'multiple-choice' as const,
                                  options: ["", "", "", ""],
                                  correctAnswer: "",
                                  explanation: "",
                                  points: 1
                                }
                                setNewLesson(prev => ({
                                  ...prev,
                                  quizData: {
                                    ...prev.quizData!,
                                    questions: [...(prev.quizData?.questions || []), newQuestion]
                                  }
                                }))
                              }}
                              disabled={isSaving}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Question
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reference Materials */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Reference Materials</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newReference = {
                            id: Date.now().toString(),
                            title: "",
                            type: 'book' as const,
                            url: "",
                            description: "",
                            isRequired: false
                          }
                          setNewLesson(prev => ({
                            ...prev,
                            references: [...(prev.references || []), newReference]
                          }))
                        }}
                        disabled={isSaving}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reference
                      </Button>
                    </div>

                    {newLesson.references?.map((reference, index) => (
                      <div key={reference.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Reference {index + 1}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewLesson(prev => ({
                                ...prev,
                                references: prev.references?.filter(r => r.id !== reference.id) || []
                              }))
                            }}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={reference.title}
                              onChange={(e) => {
                                const updatedReferences = newLesson.references?.map(r => 
                                  r.id === reference.id ? { ...r, title: e.target.value } : r
                                ) || []
                                setNewLesson(prev => ({
                                  ...prev,
                                  references: updatedReferences
                                }))
                              }}
                              placeholder="Reference title"
                              disabled={isSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={reference.type}
                              onValueChange={(value: 'book' | 'pdf' | 'article' | 'link' | 'video') => {
                                const updatedReferences = newLesson.references?.map(r => 
                                  r.id === reference.id ? { ...r, type: value } : r
                                ) || []
                                setNewLesson(prev => ({
                                  ...prev,
                                  references: updatedReferences
                                }))
                              }}
                              disabled={isSaving}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="book">Book</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="article">Article</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>URL (Optional)</Label>
                          <Input
                            value={reference.url || ""}
                            onChange={(e) => {
                              const updatedReferences = newLesson.references?.map(r => 
                                r.id === reference.id ? { ...r, url: e.target.value } : r
                              ) || []
                              setNewLesson(prev => ({
                                ...prev,
                                references: updatedReferences
                              }))
                            }}
                            placeholder="https://example.com"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={reference.description || ""}
                            onChange={(e) => {
                              const updatedReferences = newLesson.references?.map(r => 
                                r.id === reference.id ? { ...r, description: e.target.value } : r
                              ) || []
                              setNewLesson(prev => ({
                                ...prev,
                                references: updatedReferences
                              }))
                            }}
                            placeholder="Brief description of this reference"
                            rows={2}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${reference.id}`}
                            checked={reference.isRequired}
                            onChange={(e) => {
                              const updatedReferences = newLesson.references?.map(r => 
                                r.id === reference.id ? { ...r, isRequired: e.target.checked } : r
                              ) || []
                              setNewLesson(prev => ({
                                ...prev,
                                references: updatedReferences
                              }))
                            }}
                            disabled={isSaving}
                          />
                          <Label htmlFor={`required-${reference.id}`}>Required reading</Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Duration Field */}
                  <div className="space-y-2">
                    <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      value={newLesson.duration}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Estimated duration in minutes"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleAddLesson} 
                      disabled={!selectedSection || !newLesson.title.trim() || isSaving}
                      className="flex-1"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Lesson
                    </Button>
                    <Button 
                      onClick={() => {
                        handleAddLesson()
                        setNewLesson({ 
                          title: "", 
                          type: "video", 
                          content: "", 
                          videoUrl: "", 
                          duration: "", 
                          quizData: { 
                            questions: [], 
                            timeLimit: 30, 
                            passingScore: 70, 
                            allowRetakes: true 
                          }, 
                          references: [] 
                        })
                      }}
                      disabled={!selectedSection || !newLesson.title.trim() || isSaving}
                      variant="outline"
                    >
                      Add & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Sections</span>
                    <span className="font-semibold">{course.sections?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Lessons</span>
                    <span className="font-semibold">{getTotalLessons()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Duration</span>
                    <span className="font-semibold">{Math.round(getTotalDuration() / 60)}h {getTotalDuration() % 60}m</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-2">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => {
              if (course.sections && course.sections.length > 0) {
                setSelectedSection(course.sections[0]._id)
                document.getElementById('lesson-form')?.scrollIntoView({ behavior: 'smooth' })
              } else {
                document.getElementById('section-form')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Lesson Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {previewLesson && getLessonIcon(previewLesson.type)}
              <span>{previewLesson?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {previewLesson && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Type: {previewLesson.type}</span>
                    {previewLesson.duration && (
                      <span>Duration: {Math.round(previewLesson.duration / 60)} minutes</span>
                    )}
                    <Badge variant={previewLesson.isPublished ? "default" : "secondary"}>
                      {previewLesson.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {renderLessonContent(previewLesson)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {previewLesson && (
              <Button asChild>
                <Link href={`/instructor/courses/${courseId}/content`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lesson
                </Link>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}