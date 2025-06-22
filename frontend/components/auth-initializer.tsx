"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store"

export function AuthInitializer() {
  const { getCurrentUser } = useAuthStore()

  useEffect(() => {
    // Check for existing token and get current user on app load
    getCurrentUser()
  }, [getCurrentUser])

  return null
} 