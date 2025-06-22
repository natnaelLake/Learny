import { type NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/frontend/lib/auth"
import dbConnect from "@/frontend/lib/db"
import User from "@/models/User"
import Course from "@/models/Course"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { courseId, amount, paymentMethod } = await request.json()

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    // Find the user
    const user = await User.findById(authUser.userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.includes(courseId)) {
      return NextResponse.json({ message: "Already enrolled in this course" }, { status: 400 })
    }

    // In a real application, you would integrate with Stripe or another payment processor here
    // For demo purposes, we'll simulate a successful payment

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Enroll user in course
    user.enrolledCourses.push(courseId)
    course.enrolledStudents.push(user._id)

    await user.save()
    await course.save()

    return NextResponse.json({
      message: "Payment successful",
      enrollment: {
        courseId,
        userId: user._id,
        enrolledAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 })
  }
}
