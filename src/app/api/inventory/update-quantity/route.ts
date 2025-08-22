import { NextResponse } from 'next/server';
import { incrementInventoryQuantity } from '../../products/[sku]/route';

/**
 * Handles POST requests to /api/inventory/update-quantity
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A JSON response confirming the inventory increment.
 */
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const { productId } = await request.json();

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { 
          message: 'Invalid request data. productId is required.',
          error: 'Missing productId field'
        },
        { status: 400 }
      );
    }

    // Increment the inventory in the simulated database by 1
    const incrementSuccess = incrementInventoryQuantity(productId);
    
    if (!incrementSuccess) {
      return NextResponse.json(
        { 
          message: 'Product not found in inventory',
          error: 'Product not found'
        },
        { status: 404 }
      );
    }

    // Log the successful increment
    console.log(`Inventory incremented successfully: Product ${productId} -> +1`);

    // Return success response with updated data
    return NextResponse.json(
      {
        message: 'Inventory incremented successfully',
        data: {
          productId,
          increment: 1,
          updatedAt: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error incrementing inventory:', error);
    return NextResponse.json(
      { 
        message: 'Error processing inventory increment request',
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
