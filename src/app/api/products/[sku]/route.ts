import { NextResponse } from 'next/server';

// Simulación de base de datos en memoria (en producción esto sería una BD real)
const inventoryDB = new Map([
  ['LP-PRO-01', { CodProd: 'LP-PRO-01', Marca: 'TechBrand', Descrip: 'Laptop Pro 15 inch', PrecioUsd: 1500.00, PrecioUsd2: 1450.00, Existen: 50 }],
  ['MS-WL-02', { CodProd: 'MS-WL-02', Marca: 'TechBrand', Descrip: 'Wireless Mouse', PrecioUsd: 40.00, PrecioUsd2: 35.00, Existen: 200 }],
  ['KB-MECH-03', { CodProd: 'KB-MECH-03', Marca: 'KeyMaster', Descrip: 'Mechanical Keyboard RGB', PrecioUsd: 120.00, PrecioUsd2: 110.00, Existen: 100 }],
  ['1', { CodProd: '1', Marca: 'HP', Descrip: 'Laptop HP Pavilion 15" Intel i7 16GB RAM 512GB SSD', PrecioUsd: 899.99, PrecioUsd2: 849.99, Existen: 25 }],
  ['2', { CodProd: '2', Marca: 'Logitech', Descrip: 'Mouse Inalámbrico Logitech MX Master 3S', PrecioUsd: 99.99, PrecioUsd2: 89.99, Existen: 150 }],
  ['3', { CodProd: '3', Marca: 'Corsair', Descrip: 'Teclado Mecánico RGB Corsair K95 Platinum XT', PrecioUsd: 199.99, PrecioUsd2: 179.99, Existen: 45 }],
  ['4', { CodProd: '4', Marca: 'Samsung', Descrip: 'Monitor Samsung 27" 4K Ultra HD 144Hz Gaming', PrecioUsd: 399.99, PrecioUsd2: 349.99, Existen: 30 }]
]);

// Función para obtener el inventario actual
export function getInventoryDB() {
  return inventoryDB;
}

// Función para INCREMENTAR existencias en +1 (usada por el endpoint de inventario)
export function incrementInventoryQuantity(productId: string) {
  if (inventoryDB.has(productId)) {
    const product = inventoryDB.get(productId)!;
    product.Existen += 1; // SUMAR +1, no establecer una cantidad absoluta
    inventoryDB.set(productId, product);
    return true;
  }
  return false;
}

/**
 * Handles GET requests to /api/products/[sku]
 * @param {Request} request - The incoming request object.
 * @param {Object} context - Route context containing the params promise.
 * @returns {NextResponse} A JSON response with product data or 404 if not found.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await context.params;

    // Obtener producto del inventario simulado
    const product = inventoryDB.get(sku);
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Provisional data for product images
    const productImages = [
      {
        SKU: '1',
        Imagen_URL: '/next.svg',
        Peso: 2.5
      },
      {
        SKU: '2',
        Imagen_URL: '/vercel.svg',
        Peso: 0.15
      },
      {
        SKU: '3',
        Imagen_URL: '/globe.svg',
        Peso: 1.2
      },
      {
        SKU: '4',
        Imagen_URL: '/window.svg',
        Peso: 8.5
      },
      {
        SKU: 'LP-PRO-01',
        Imagen_URL: '/next.svg',
        Peso: 2.5
      },
      {
        SKU: 'MS-WL-02',
        Imagen_URL: '/vercel.svg',
        Peso: 0.15
      },
      {
        SKU: 'KB-MECH-03',
        Imagen_URL: '/globe.svg',
        Peso: 1.2
      }
    ];

    // Find product image by SKU
    const productImage = productImages.find(img => img.SKU === sku);
    
    // Combine product data with image data and current inventory
    const productWithImage = {
      id: product.CodProd,
      name: product.Descrip,
      image: productImage ? productImage.Imagen_URL : '/next.svg',
      sku: sku,
      marca: product.Marca,
      precio: product.PrecioUsd,
      existencias: product.Existen // Existencias actualizadas desde la BD simulada
    };

    return NextResponse.json(productWithImage);

  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
