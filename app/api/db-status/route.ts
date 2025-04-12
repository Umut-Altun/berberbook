import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/db-status"

export async function GET() {
  try {
    const status = await checkDatabaseConnection()

    if (status.connected) {
      return NextResponse.json({ status: "ok", message: status.message })
    } else {
      // Return 200 even for errors to avoid HTTP error handling issues
      return NextResponse.json({ status: "error", message: status.message }, { status: 200 })
    }
  } catch (error) {
    console.error("Error in DB status API:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to check database status"

    // Always return a 200 response with error details in the JSON
    return NextResponse.json({ status: "error", message: errorMessage }, { status: 200 })
  }
}

