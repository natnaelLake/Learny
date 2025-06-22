"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useState } from "react"

interface CourseSidebarProps {
  course: {
    id: string
    title: string
    progress: number
    curriculum: Array<{
      id: string
      title: string
      lessons: Array<{
        id: string
        title: string
        duration: string
        type: string
        completed: boolean
      }>
    }>
  }
  currentLesson: string
  onLessonSelect: (lessonId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function CourseSidebar({ course, currentLesson, onLessonSelect, isOpen, onToggle }: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0)
  const completedLessons = course.curriculum.reduce(
    (acc, section) => acc + section.lessons.filter((lesson) => lesson.completed).length,
    0,
  )

  if (!isOpen) {
    return (
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm truncate">{course.title}</h2>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {completedLessons}/{totalLessons} lessons
            </span>
            <span>{course.progress}% complete</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {course.curriculum.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.lessons.length} lessons</p>
                    </div>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1 ml-4">
                {section.lessons.map((lesson) => (
                  <Button
                    key={lesson.id}
                    variant={currentLesson === lesson.id ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto text-left"
                    onClick={() => onLessonSelect(lesson.id)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : lesson.type === "video" ? (
                          <Play className="w-4 h-4" />
                        ) : lesson.type === "quiz" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.duration}</span>
                          <Badge variant="outline" className="text-xs">
                            {lesson.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
