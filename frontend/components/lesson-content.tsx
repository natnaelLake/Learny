"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface LessonContentProps {
  content: string
  onComplete?: () => void
}

export function LessonContent({ content, onComplete }: LessonContentProps) {
  const [isCompleted, setIsCompleted] = useState(false)

  const handleMarkComplete = () => {
    setIsCompleted(true)
    onComplete?.()
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>

          <div className="flex justify-center">
            <Button onClick={handleMarkComplete} disabled={isCompleted} className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleted ? "Completed" : "Mark as Complete"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
