"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error boundary caught error:", error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Bir şeyler yanlış gitti!</h2>
        <p className="text-muted-foreground">Üzgünüz, bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        {error.message && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}
      </div>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}

