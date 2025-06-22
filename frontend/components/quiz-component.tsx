"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause,
  Award,
  BookOpen,
  Timer,
  Lock,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/store"

interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer: string
  explanation?: string
  points: number
}

interface QuizData {
  questions: QuizQuestion[]
  timeLimit: number // in minutes
  passingScore: number
  allowRetakes: boolean
}

interface QuizComponentProps {
  lessonId?: string
  courseId?: string
  quizData?: QuizData
  onComplete: (results?: QuizResults) => void
  onCancel?: () => void
}

interface QuizResults {
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  answers: Array<{
    questionId: string
    answer: string
    correct: boolean
    points: number
  }>
  timeSpent: number
}

interface QuizAttempt {
  _id: string
  student: string
  course: string
  lesson: string
  attemptNumber: number
  status: 'in_progress' | 'completed' | 'abandoned'
  startedAt: string
  completedAt?: string
  timeSpent?: number
  answers: Array<{
    questionIndex: number
    selectedAnswer: number
    isCorrect: boolean
    answeredAt: string
  }>
  results: {
    totalQuestions: number
    correctAnswers: number
    score: number
    passed: boolean
    passingThreshold: number
  }
}

export function QuizComponent({ lessonId, courseId, quizData, onComplete, onCancel }: QuizComponentProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  
  // Default quiz data if none provided
  const defaultQuizData: QuizData = {
    questions: [
      {
        id: "1",
        question: "This is a sample question for the quiz.",
        type: "multiple-choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: "This is the correct answer because...",
        points: 10
      }
    ],
    timeLimit: 10, // 10 minutes
    passingScore: 70,
    allowRetakes: true
  }

  const finalQuizData = quizData || defaultQuizData
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(finalQuizData.timeLimit * 60) // Convert to seconds
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<QuizResults | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(true)

  const currentQuestion = finalQuizData.questions[currentQuestionIndex]
  const totalQuestions = finalQuizData.questions.length
  const progress = (currentQuestionIndex / totalQuestions) * 100

  // Check for existing quiz attempt on component mount
  useEffect(() => {
    const checkExistingAttempt = async () => {
      if (!lessonId || !user) {
        setIsLoadingAttempt(false)
        return
      }

      try {
        // First check if quiz can be taken
        const canTakeResponse = await api.canTakeQuiz(lessonId)
        if (canTakeResponse.success && canTakeResponse.data) {
          const { canTake, hasInProgress, completedAttempt, inProgressAttempt } = canTakeResponse.data
          
          if (!canTake && completedAttempt) {
            // Quiz already completed and no retakes allowed
            setHasAttempted(true)
            setCurrentAttempt({
              _id: completedAttempt.id,
              student: user.id,
              course: courseId || '',
              lesson: lessonId,
              attemptNumber: 1,
              status: 'completed',
              startedAt: new Date().toISOString(),
              completedAt: completedAttempt.completedAt,
              timeSpent: completedAttempt.timeSpent,
              answers: [],
              results: {
                totalQuestions: 0,
                correctAnswers: completedAttempt.score,
                score: completedAttempt.score,
                passed: completedAttempt.passed,
                passingThreshold: 70
              }
            })
            
            // Load detailed results
            const detailedResponse = await api.getCompletedQuizAttempt(lessonId)
            if (detailedResponse.success && detailedResponse.data?.attempt) {
              const attempt = detailedResponse.data.attempt
              const quizResults: QuizResults = {
                score: attempt.results.correctAnswers,
                totalPoints: attempt.results.totalQuestions,
                percentage: attempt.results.score,
                passed: attempt.results.passed,
                answers: attempt.answers.map((answer: any) => {
                  const question = finalQuizData.questions[answer.questionIndex]
                  return {
                    questionId: question?.id || '',
                    answer: answer.selectedAnswer.toString(),
                    correct: answer.isCorrect,
                    points: answer.isCorrect ? (question?.points || 0) : 0
                  }
                }),
                timeSpent: attempt.timeSpent || 0
              }
              setResults(quizResults)
              setShowResults(true)
            }
            setIsLoadingAttempt(false)
            return
          }
          
          if (hasInProgress && inProgressAttempt) {
            // Resume in-progress attempt
            const response = await api.getCurrentQuizAttempt(lessonId)
            if (response.success && response.data?.attempt) {
              const attempt = response.data.attempt
              setCurrentAttempt(attempt)
              
              // Restore quiz state from backend
              setIsStarted(true)
              setStartTime(new Date(attempt.startedAt))
              
              // Restore answers
              const restoredAnswers: Record<string, string> = {}
              attempt.answers.forEach((answer: any) => {
                const question = finalQuizData.questions[answer.questionIndex]
                if (question) {
                  if (question.type === 'multiple-choice' && question.options) {
                    restoredAnswers[question.id] = question.options[answer.selectedAnswer] || ''
                  } else if (question.type === 'true-false') {
                    restoredAnswers[question.id] = answer.selectedAnswer === 0 ? 'true' : 'false'
                  } else {
                    // For short answer, we'll need to handle differently since we don't store the actual text
                    // For now, we'll leave it empty and let user re-answer
                  }
                }
              })
              setAnswers(restoredAnswers)
              
              // Calculate remaining time
              const elapsedTime = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
              const remainingTime = Math.max(0, (finalQuizData.timeLimit * 60) - elapsedTime)
              setTimeLeft(remainingTime)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load quiz attempt:', error)
        // Continue with fresh start if there's an error
      } finally {
        setIsLoadingAttempt(false)
      }
    }

    checkExistingAttempt()
  }, [lessonId, user, courseId, finalQuizData.allowRetakes, finalQuizData.questions])

  // Check if all questions are answered
  const allQuestionsAnswered = finalQuizData.questions.every(question => 
    answers[question.id] && answers[question.id].trim() !== ''
  )

  // Calculate progress including answered questions
  const answeredQuestions = finalQuizData.questions.filter(question => 
    answers[question.id] && answers[question.id].trim() !== ''
  ).length

  // Timer effect - no pausing allowed once started
  useEffect(() => {
    if (!isStarted || isCompleted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isStarted, isCompleted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartQuiz = async () => {
    if (!lessonId || !courseId) {
      toast({
        title: "Error",
        description: "Missing lesson or course information",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await api.startQuizAttempt({
        courseId,
        lessonId,
        totalQuestions: finalQuizData.questions.length,
        allowRetakes: finalQuizData.allowRetakes
      })

      if (response.success && response.data) {
        setCurrentAttempt(response.data)
        setIsStarted(true)
        setStartTime(new Date())
        setHasAttempted(true)
        
        toast({
          title: "Quiz Started",
          description: "Your quiz attempt has been saved. You can continue even if you close this page.",
        })
      }
    } catch (error) {
      console.error('Failed to start quiz:', error)
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = async (answer: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: answer
    }
    setAnswers(newAnswers)

    // Submit answer to backend if we have an active attempt
    if (currentAttempt && currentAttempt.status === 'in_progress') {
      try {
        // Find the correct answer index
        let correctAnswerIndex = 0
        let selectedAnswerIndex = 0
        let isCorrect = false

        if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
          selectedAnswerIndex = currentQuestion.options.findIndex(option => option === answer)
          correctAnswerIndex = currentQuestion.options.findIndex(option => option === currentQuestion.correctAnswer)
          isCorrect = selectedAnswerIndex === correctAnswerIndex
        } else if (currentQuestion.type === 'true-false') {
          selectedAnswerIndex = answer === 'true' ? 0 : 1
          correctAnswerIndex = currentQuestion.correctAnswer === 'true' ? 0 : 1
          isCorrect = selectedAnswerIndex === correctAnswerIndex
        } else {
          // For short answer, we'll need to implement text comparison logic
          isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()
          selectedAnswerIndex = 0 // Placeholder
        }

        await api.submitQuizAnswer({
          attemptId: currentAttempt._id,
          questionIndex: currentQuestionIndex,
          selectedAnswer: selectedAnswerIndex,
          isCorrect
        })
      } catch (error) {
        console.error('Failed to submit answer:', error)
        // Don't show error to user as it might be distracting during quiz
      }
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    if (!allQuestionsAnswered) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!currentAttempt) {
      toast({
        title: "Error",
        description: "No active quiz attempt found.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Complete the quiz attempt in backend
      const response = await api.completeQuizAttempt(currentAttempt._id)
      
      if (response.success && response.data) {
        const attempt = response.data.attempt
        setIsCompleted(true)
        
        // Calculate results from backend data
        const quizResults: QuizResults = {
          score: attempt.results.correctAnswers,
          totalPoints: attempt.results.totalQuestions,
          percentage: attempt.results.score,
          passed: attempt.results.passed,
          answers: attempt.answers.map((answer: any) => {
            const question = finalQuizData.questions[answer.questionIndex]
            return {
              questionId: question?.id || '',
              answer: answer.selectedAnswer.toString(),
              correct: answer.isCorrect,
              points: answer.isCorrect ? (question?.points || 0) : 0
            }
          }),
          timeSpent: attempt.timeSpent || 0
        }

        setResults(quizResults)
        setShowResults(true)

        // Show appropriate message
        if (timeLeft <= 0) {
          toast({
            title: "Time's up!",
            description: "Quiz submitted automatically due to time limit.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Quiz completed!",
            description: quizResults.passed ? "Congratulations! You passed the quiz." : "You need to review the material and try again.",
          })
        }
      }
    } catch (error) {
      console.error('Failed to complete quiz:', error)
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinishQuiz = () => {
    if (results) {
      onComplete(results)
    } else {
      onComplete()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      // Default behavior if no onCancel provided
      window.history.back()
    }
  }

  // Show loading state while checking for existing attempts
  if (isLoadingAttempt) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading quiz...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show completed quiz results if already attempted and no retakes allowed
  if (hasAttempted && !finalQuizData.allowRetakes && showResults) {
    return renderResults()
  }

  // Show quiz already completed message
  if (hasAttempted && !finalQuizData.allowRetakes && !showResults) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-6 w-6 text-orange-500" />
              <span>Quiz Already Completed</span>
            </CardTitle>
            <CardDescription>
              You have already completed this quiz and cannot retake it. Your results are available below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAttempt && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Score:</span>
                  <Badge variant={currentAttempt.results.passed ? "default" : "destructive"}>
                    {currentAttempt.results.score}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={currentAttempt.results.passed ? "default" : "destructive"}>
                    {currentAttempt.results.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
                {currentAttempt.completedAt && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Completed:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(currentAttempt.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Button onClick={() => onComplete()} className="w-full">
              Continue to Next Lesson
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-6 w-6" />
              <span>Quiz Instructions</span>
            </CardTitle>
            <CardDescription>
              Read the instructions carefully before starting the quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span>Time Limit: {finalQuizData.timeLimit} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>Passing Score: {finalQuizData.passingScore}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Total Questions: {totalQuestions}</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Once you start the quiz, the timer cannot be paused</li>
                  <li>You must answer ALL questions before submitting</li>
                  <li>You can navigate between questions using the Previous/Next buttons</li>
                  <li>The quiz will automatically submit when time runs out</li>
                  <li>Your progress is automatically saved to the server</li>
                  {!finalQuizData.allowRetakes && (
                    <li><strong>You can only take this quiz once - no retakes allowed</strong></li>
                  )}
                  {finalQuizData.allowRetakes && (
                    <li>You can retake this quiz if needed</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center space-x-4">
              <Button 
                onClick={handleStartQuiz} 
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Starting...' : 'Start Quiz'}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    return renderResults()
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {answeredQuestions}/{totalQuestions} answered
            </span>
            <Progress value={(answeredQuestions / totalQuestions) * 100} className="w-20" />
          </div>
        </div>
      </div>

      {/* Question */}
      {renderQuestion()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-2">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button 
              onClick={handleSubmitQuiz} 
              disabled={!allQuestionsAnswered || isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              <span>
                {isLoading ? 'Submitting...' : 
                  allQuestionsAnswered ? 'Submit Quiz' : `Submit Quiz (${totalQuestions - answeredQuestions} unanswered)`
                }
              </span>
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Warning for unanswered questions */}
      {!allQuestionsAnswered && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {totalQuestions - answeredQuestions} unanswered question{totalQuestions - answeredQuestions !== 1 ? 's' : ''}. 
            Please answer all questions before submitting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  function renderQuestion() {
    if (!currentQuestion) return null

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <Badge variant="outline">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'true-false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === 'short-answer' && (
            <div className="space-y-2">
              <Label htmlFor="short-answer">Your Answer</Label>
              <Textarea
                id="short-answer"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Enter your answer..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  function renderResults() {
    if (!results) return null

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {results.passed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span>Quiz Results</span>
            </CardTitle>
            <CardDescription>
              {results.passed ? 'Congratulations! You passed the quiz.' : 'You need to review the material and try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{results.percentage}%</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{results.score}/{results.totalPoints}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{formatTime(results.timeSpent)}</div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Question Review</h3>
              {finalQuizData.questions.map((question, index) => {
                const answer = results.answers.find(a => a.questionId === question.id)
                const isCorrect = answer?.correct || false

                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          {answer?.points || 0}/{question.points} points
                        </span>
                      </div>
                    </div>
                    <p className="mb-2">{question.question}</p>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Your answer:</span> {answer?.answer || 'No answer'}
                      </div>
                      <div>
                        <span className="font-medium">Correct answer:</span> {question.correctAnswer}
                      </div>
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button onClick={handleFinishQuiz} className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Complete Quiz</span>
          </Button>
        </div>
      </div>
    )
  }
}
