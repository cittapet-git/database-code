import { NextResponse } from 'next/server';

/**
 * Handles GET requests to /api/products
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A JSON response with a list of sample products following the Saprod structure.
 */
export async function GET(request: Request) {
  // Provisional data for a list of products with the specified structure
  const sampleProducts = [
    {
      CodProd: 'LP-PRO-01',
      Marca: 'TechBrand',
      Descrip: 'Laptop Pro 15 inch',
      PrecioUsd: 1500.00,
      PrecioUsd2: 1450.00,
      Existen: 50,
    },
    {
      CodProd: 'MS-WL-02',
      Marca: 'TechBrand',
      Descrip: 'Wireless Mouse',
      PrecioUsd: 40.00,
      PrecioUsd2: 35.00,
      Existen: 200,
    },
    {
      CodProd: 'KB-MECH-03',
      Marca: 'KeyMaster',
      Descrip: 'Mechanical Keyboard RGB',
      PrecioUsd: 120.00,
      PrecioUsd2: 110.00,
      Existen: 100,
    },
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
    // The incoming data should follow the Saprod structure.
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
