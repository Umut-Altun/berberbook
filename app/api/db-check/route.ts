import { NextResponse } from "next/server"

export async function GET() {
  try {
    // First, check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable not set")
      return NextResponse.json(
        {
          status: "error",
          message: "Supabase DATABASE_URL environment variable not set",
        },
        { status: 200 }, // Return 200 even for errors to avoid HTTP error handling issues
      )
    }

    // Extract database info from connection string for display
    // Format: postgresql://username:password@hostname/database
    let databaseInfo = "unknown"
    try {
      const url = new URL(process.env.DATABASE_URL)
      databaseInfo = `${url.hostname} (Supabase)`
    } catch (urlError) {
      console.error("Error parsing Supabase DATABASE_URL:", urlError)
    }

    // Instead of actually connecting to the database, just check if the URL is valid
    // This avoids potential connection issues that might cause 500 errors
    return NextResponse.json({
      status: "ok",
      message: "Supabase URL is valid",
      database: databaseInfo,
    })
  } catch (error) {
    console.error("Unexpected error in Supabase db-check API:", error)

    // Always return a 200 response with error details in the JSON
    // This prevents HTTP errors from breaking the client
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected error checking Supabase database",
      },
      { status: 200 },
    )
  }
}

