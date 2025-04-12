import { type NextRequest, NextResponse } from "next/server"
import { getCustomers, createCustomer } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    // Add a delay to simulate network latency and ensure proper loading states
    await new Promise((resolve) => setTimeout(resolve, 300))

    const customers = await getCustomers()

    // Log the response for debugging
    console.log(`Returning ${customers.length} customers from API`)

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: "Failed to fetch customers",
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json()

    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "name is required",
        },
        { status: 400 },
      )
    }

    // Create the customer
    const customer = await createCustomer({
      name: data.name,
      phone: data.phone || "",
      email: data.email || "",
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      {
        error: "Failed to create customer",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

