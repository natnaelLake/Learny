"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, BookOpen, Users } from "lucide-react"

interface UserNavProps {
  user: any
}

export function UserNav({ user }: UserNavProps) {
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin"
    if (user?.role === "instructor") return "/instructor"
    return "/student"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(getDashboardPath())}>
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          
          {/* Instructor-specific navigation */}
          {user?.role === "instructor" && (
            <>
              <DropdownMenuItem onClick={() => router.push("/instructor/courses")}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>My Courses</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/instructor/students")}>
                <Users className="mr-2 h-4 w-4" />
                <span>My Students</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
