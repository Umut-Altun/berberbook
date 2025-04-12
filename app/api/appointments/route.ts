import { type NextRequest, NextResponse } from "next/server"
import { getAppointments, getAppointmentsByDate, createAppointment } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")

    // If no date is provided, return all appointments
    if (!date) {
      const allAppointments = await getAppointments()
      return NextResponse.json(allAppointments)
    }

    const appointments = await getAppointmentsByDate(date)
    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // First try to parse the request body
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError)
      return NextResponse.json(
        {
          error: "Invalid request format",
          message: "The request body could not be parsed as JSON",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!data.customer_id || !data.service_id || !data.date || !data.time) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "customer_id, service_id, date, and time are required",
        },
        { status: 400 },
      )
    }

    // Create the appointment
    const appointment = await createAppointment(data)
    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error processing appointment request:", error)
    return NextResponse.json(
      {
        error: "Failed to process appointment request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

