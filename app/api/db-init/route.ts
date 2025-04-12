import { type NextRequest, NextResponse } from "next/server"
import { ensureDatabaseConnection, initDatabase, migrateDatabase, seedInitialData } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    const connected = await ensureDatabaseConnection()
    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to database",
        },
        { status: 500 }
      )
    }

    // Initialize database (create tables if they don't exist)
    const initialized = await initDatabase()
    if (!initialized) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize database tables",
        },
        { status: 500 }
      )
    }

    // Run migrations to add any missing columns
    const migrated = await migrateDatabase()
    if (!migrated) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to migrate database schema",
        },
        { status: 500 }
      )
    }

    // Seed initial data if tables are empty
    const seeded = await seedInitialData()

    return NextResponse.json({
      success: true,
      message: "Database initialized, migrated, and seeded successfully",
      seeded,
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error initializing database",
      },
      { status: 500 }
    )
  }
}

