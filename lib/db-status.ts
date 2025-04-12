import { checkDatabaseStatus } from "./db"

export async function checkDatabaseConnection() {
  try {
    const status = await checkDatabaseStatus()
    return status
  } catch (error) {
    console.error("Error checking database connection:", error)
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}

