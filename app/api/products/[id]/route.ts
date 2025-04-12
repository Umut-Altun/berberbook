import { type NextRequest, NextResponse } from "next/server"
import { getProductById, updateProduct, deleteProduct } from "@/lib/actions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
          message: "Product ID must be a number",
        },
        { status: 400 }
      )
    }
    
    const product = await getProductById(productId)
    
    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
          message: `No product found with ID ${productId}`,
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
          message: "Product ID must be a number",
        },
        { status: 400 }
      )
    }
    
    // Parse the request body
    const data = await request.json()
    
    // Update the product
    const result = await updateProduct(productId, data)
    
    if (result.success === false) {
      return NextResponse.json(
        {
          error: "Failed to update product",
          message: result.message,
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      {
        error: "Failed to update product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
          message: "Product ID must be a number",
        },
        { status: 400 }
      )
    }
    
    // Delete the product
    const result = await deleteProduct(productId)
    
    if (result.success === false) {
      return NextResponse.json(
        {
          error: "Failed to delete product",
          message: result.message,
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      {
        error: "Failed to delete product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
} 