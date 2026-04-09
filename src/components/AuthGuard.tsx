"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { getDefaultRouteForRole } from "@/lib/constants"

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: string[]
  fallback?: ReactNode
}

export default function AuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth")
      return
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push(getDefaultRouteForRole(session.user.role))
      return
    }
  }, [session, status, router, allowedRoles])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return fallback || null
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
