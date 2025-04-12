import { type NextRequest, NextResponse } from "next/server"
import { getProducts, createProduct } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    // Add a delay to simulate network latency and ensure proper loading states
    await new Promise((resolve) => setTimeout(resolve, 300))

    const products = await getProducts()

    // Log the response for debugging
    console.log(`Returning ${products.length} products from API`)

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: "Failed to fetch products",
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

    // Create the product
    const product = await createProduct({
      name: data.name,
      category: data.category || "Diğer",
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      description: data.description || "",
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      {
        error: "Failed to create product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

