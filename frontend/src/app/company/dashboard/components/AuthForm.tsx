"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthFormProps {
  children: React.ReactNode
}

export default function AuthForm({ children }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for the company token in localStorage.
    const checkAuth = () => {
      const companyToken = localStorage.getItem("token")
      if (!companyToken) {
        // If token is not found, redirect to the company login page.
        router.push("/company/login")
      } else {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render the child components only when authorized.
  return isAuthenticated ? <>{children}</> : null
}

