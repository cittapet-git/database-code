// File: app/api/products/route.ts
import { NextResponse } from 'next/server';

/**
 * Handles GET requests to /api/products
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A JSON response with a list of sample products.
 */
export async function GET(request: Request) {
  // Provisional data for a list of products
  const sampleProducts = [
    { id: 1, name: 'Laptop Pro', price: 1500, stock: 50 },
    { id: 2, name: 'Wireless Mouse', price: 40, stock: 200 },
    { id: 3, name: 'Mechanical Keyboard', price: 120, stock: 100 },
  ];

  return NextResponse.json(sampleProducts);
}

/**
 * Handles POST requests to /api/products
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A JSON response confirming the creation of a new product.
 */
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const newProduct = await request.json();

    // Here you would process the data, e.g., save the new product to a database.
    console.log('Received new product:', newProduct);

    // Return a success response with the data received
    return NextResponse.json(
      {
        message: 'Product created successfully!',
        productReceived: newProduct,
      },
      { status: 201 } // 201 Created status
    );
  } catch (error) {
    // Handle potential errors, like invalid JSON
    console.error('Error processing POST request:', error);
    return NextResponse.json(
      { message: 'Error processing request' },
      { status: 400 } // 400 Bad Request status
    );
  }
}
