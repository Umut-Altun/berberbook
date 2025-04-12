"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw, Database, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DatabaseStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { toast } = useToast()

  const checkConnection = async () => {
    setIsChecking(true)
    setStatus("loading")
    setMessage("Checking Supabase connection...")

    try {
      const timestamp = Date.now() // Add timestamp to bust cache

      // Simple fetch with error handling
      const response = await fetch(`/api/db-check?t=${timestamp}`)

      // Get the response as text first
      const responseText = await response.text()

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", responseText.substring(0, 200))
        throw new Error("Invalid response format")
      }

      // Check the status in the response
      if (data.status === "ok") {
        setStatus("connected")
        setMessage(`Connected to Supabase: ${data.database || "database"}`)

        toast({
          title: "Supabase Connection",
          description: "Supabase connection is valid",
        })
      } else {
        setStatus("error")
        setMessage(data.message || "Unknown Supabase error")

        toast({
          title: "Supabase Connection Issue",
          description: data.message || "There was an issue with the Supabase connection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Supabase check error:", error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unknown error")

      toast({
        title: "Supabase Check Failed",
        description: error instanceof Error ? error.message : "Failed to check Supabase status",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const initializeDatabase = async () => {
    setIsInitializing(true)

    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/db-init?t=${timestamp}`)

      // Get the response as text first
      const responseText = await response.text()

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", responseText.substring(0, 200))
        throw new Error("Invalid response format")
      }

      if (data.status === "success") {
        toast({
          title: "Supabase Initialized",
          description: "Supabase tables and sample data created successfully",
        })

        // Check connection again to update status
        await checkConnection()
      } else {
        toast({
          title: "Supabase Initialization Error",
          description: data.message || "Failed to initialize Supabase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Supabase initialization error:", error)

      toast({
        title: "Supabase Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize Supabase",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const resetDatabase = async () => {
    setIsResetting(true)

    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/db-reset?t=${timestamp}`)

      // Get the response as text first
      const responseText = await response.text()

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", responseText.substring(0, 200))
        throw new Error("Invalid response format")
      }

      if (data.status === "success") {
        toast({
          title: "Supabase Reset",
          description: "Supabase database has been reset and seeded with fresh data",
        })

        // Reload the page to reflect the changes
        window.location.reload()
      } else {
        toast({
          title: "Supabase Reset Error",
          description: data.message || "Failed to reset Supabase database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Supabase reset error:", error)

      toast({
        title: "Supabase Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset Supabase database",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }

  useEffect(() => {
    // Check connection when component mounts
    checkConnection()
  }, [])

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-gray-200 p-2 text-sm bg-white shadow-sm">
        {status === "loading" && (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="text-yellow-500">Checking Supabase connection...</span>
          </>
        )}

        {status === "connected" && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-500">{message}</span>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Connection error: {message}</span>
          </>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-gray-100"
            onClick={checkConnection}
            disabled={isChecking}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-gray-100"
            onClick={initializeDatabase}
            disabled={isInitializing || isChecking}
          >
            <Database className="h-3.5 w-3.5" />
            <span className="sr-only">Initialize</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-gray-100 hover:text-red-500"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isChecking}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Reset</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="border border-gray-200 shadow-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your data (appointments, customers, services) and recreate the database with sample
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-100 hover:text-gray-900">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault()
                resetDatabase()
              }}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset Database"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

