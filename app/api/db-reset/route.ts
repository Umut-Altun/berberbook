import { NextResponse } from "next/server"
import { resetDatabase, seedInitialData } from "@/lib/db"

export async function GET() {
  try {
    // Reset database (drop and recreate tables)
    const reset = await resetDatabase()
    if (!reset) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to reset Supabase database",
        },
        { status: 200 },
      ) // Use 200 even for errors to avoid HTTP error handling issues
    }

    // Seed initial data
    const seeded = await seedInitialData()
    if (!seeded) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to seed initial data in Supabase",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Supabase database reset and seeded successfully",
    })
  } catch (error) {
    console.error("Error resetting Supabase database:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error resetting Supabase database"

    // Always return a 200 response with error details in the JSON
    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
      },
      { status: 200 },
    )
  }
}

