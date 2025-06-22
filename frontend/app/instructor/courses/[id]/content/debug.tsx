"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPage() {
  const params = useParams()
  const courseId = params?.id as string
  const { user } = useAuthStore()
  
  const [courseData, setCourseData] = useState<any>(null)
  const [sectionsData, setSectionsData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Check authentication
      results.auth = {
        user: user,
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : null
      }

      // Test 2: Fetch course
      try {
        const courseResponse = await api.getCourse(courseId)
        results.course = {
          success: courseResponse.success,
          data: courseResponse.data,
          error: courseResponse.error
        }
        setCourseData(courseResponse.data)
      } catch (error) {
        results.course = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test 3: Fetch sections
      try {
        const sectionsResponse = await api.request<any[]>(`/sections/course/${courseId}`)
        results.sections = {
          success: sectionsResponse.success,
          data: sectionsResponse.data,
          error: sectionsResponse.error
        }
        setSectionsData(sectionsResponse.data)
      } catch (error) {
        results.sections = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test 4: Test section creation
      try {
        const testSectionData = {
          title: "Test Section",
          description: "Test Description",
          course: courseId,
          order: 0
        }
        const createSectionResponse = await api.createSection(testSectionData)
        results.createSection = {
          success: createSectionResponse.success,
          data: createSectionResponse.data,
          error: createSectionResponse.error
        }
      } catch (error) {
        results.createSection = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

    } catch (error) {
      results.general = {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    setTestResults(results)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Debug Page</h1>
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? "Running Tests..." : "Run Tests"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {courseData && (
          <Card>
            <CardHeader>
              <CardTitle>Course Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Course ID:</strong> {courseData._id}
                </div>
                <div>
                  <strong>Title:</strong> {courseData.title}
                </div>
                <div>
                  <strong>Sections Count:</strong> {courseData.sections?.length || 0}
                </div>
                {courseData.sections && courseData.sections.length > 0 && (
                  <div>
                    <strong>Sections:</strong>
                    <div className="ml-4 space-y-2">
                      {courseData.sections.map((section: any, index: number) => (
                        <div key={section._id} className="border-l-2 pl-4">
                          <div className="font-medium">
                            Section {index + 1}: {section.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Lessons: {section.lessons?.length || 0}
                          </div>
                          {section.lessons && section.lessons.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {section.lessons.map((lesson: any, lessonIndex: number) => (
                                <div key={lesson._id} className="text-xs">
                                  Lesson {lessonIndex + 1}: {lesson.title} ({lesson.type})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {sectionsData && (
          <Card>
            <CardHeader>
              <CardTitle>Sections Data (Direct API)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(sectionsData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 