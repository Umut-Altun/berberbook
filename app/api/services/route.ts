import { type NextRequest, NextResponse } from "next/server"
import { getServices } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    // Add a delay to simulate network latency and ensure proper loading states
    await new Promise((resolve) => setTimeout(resolve, 300))

    const services = await getServices()

    // Log the response for debugging
    console.log(`Returning ${services.length} services from API`)

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json({ error: "Failed to fetch services", details: errorMessage }, { status: 500 })
  }
}

