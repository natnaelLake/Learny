import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/frontend/lib/db"
import Course from "@/models/Course"
import { getAuthUser } from "@/frontend/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")

    const query: any = { published: true }

    if (category && category !== "all") {
      query.category = category
    }

    if (level && level !== "all") {
      query.level = level
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    const courses = await Course.find(query)
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Course.countDocuments(query)

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authUser = getAuthUser(request)
    if (!authUser || (authUser.role !== "instructor" && authUser.role !== "admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const courseData = await request.json()

    const course = await Course.create({
      ...courseData,
      instructor: authUser.userId,
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
