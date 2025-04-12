import { type NextRequest, NextResponse } from "next/server"
import { getReportData } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    const reportData = await getReportData()
    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch report data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
} 