"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Play, CheckCircle, Clock, BookOpen, Lock } from "lucide-react"
import { useState } from "react"

interface CourseContentPreviewProps {
  sections: Array<{
    _id: string
    title: string
    lessons: Array<{
      _id: string
      title: string
      type: string
      duration: number
      isPreview: boolean
    }>
  }>
  isEnrolled: boolean
}

export function CourseContentPreview({ sections, isEnrolled }: CourseContentPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const totalLessons = (sections || []).reduce((acc, section) => acc + (section.lessons || []).length, 0)
  const totalDuration = (sections || []).reduce((acc, section) => 
    acc + (section.lessons || []).reduce((sectionAcc, lesson) => sectionAcc + lesson.duration, 0), 0
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <div className="text-sm text-muted-foreground">
          {sections.length} sections • {totalLessons} lessons • {Math.round(totalDuration / 60)}h total
        </div>
      </div>

      <div className="space-y-2">
        {(sections || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2" />
            <p>No course content available yet.</p>
          </div>
        ) : (
          (sections || []).map((section, sectionIndex) => (
            <Collapsible
              key={section._id}
              open={expandedSections.includes(section._id)}
              onOpenChange={() => toggleSection(section._id)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {expandedSections.includes(section._id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {sectionIndex + 1}. {section.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{(section.lessons || []).length} lessons</p>
                    </div>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1 ml-4">
                {(section.lessons || []).map((lesson, lessonIndex) => (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {lesson.isPreview || isEnrolled ? (
                          lesson.type === "video" ? (
                            <Play className="w-4 h-4" />
                          ) : lesson.type === "quiz" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          )
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{Math.round(lesson.duration / 60)}m</span>
                          <Badge variant="outline" className="text-xs">
                            {lesson.type}
                          </Badge>
                          {lesson.isPreview && (
                            <Badge variant="secondary" className="text-xs">
                              Preview
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  )
} 