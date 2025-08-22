import { Product, ProductImage, Saprod } from '../types';

// Endpoint falso para obtener datos del producto por SKU
export const getProductBySku = async (sku: string): Promise<Product | null> => {
  try {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular llamada a la tabla Saprod
    const mockSaprod: Saprod[] = [
      {
        CodProd: '1',
        Marca: 'HP',
        Descrip: 'Laptop HP Pavilion 15" Intel i7 16GB RAM 512GB SSD',
        PrecioUsd: 899.99,
        PrecioUsd2: 849.99,
        Existen: 25
      },
      {
        CodProd: '2',
        Marca: 'Logitech',
        Descrip: 'Mouse Inalámbrico Logitech MX Master 3S',
        PrecioUsd: 99.99,
        PrecioUsd2: 89.99,
        Existen: 150
      },
      {
        CodProd: '3',
        Marca: 'Corsair',
        Descrip: 'Teclado Mecánico RGB Corsair K95 Platinum XT',
        PrecioUsd: 199.99,
        PrecioUsd2: 179.99,
        Existen: 45
      },
      {
        CodProd: '4',
        Marca: 'Samsung',
        Descrip: 'Monitor Samsung 27" 4K Ultra HD 144Hz Gaming',
        PrecioUsd: 399.99,
        PrecioUsd2: 349.99,
        Existen: 30
      }
    ];
    
    // Simular llamada a la tabla product_images
    const mockProductImages: ProductImage[] = [
      {
        SKU: '123456789',
        Imagen_URL: '/next.svg', // Placeholder - reemplazar con imagen real
        Peso: 2.5
      },
      {
        SKU: '987654321',
        Imagen_URL: '/vercel.svg', // Placeholder - reemplazar con imagen real
        Peso: 0.15
      },
      {
        SKU: '456789123',
        Imagen_URL: '/globe.svg', // Placeholder - reemplazar con imagen real
        Peso: 1.2
      },
      {
        SKU: '789123456',
        Imagen_URL: '/window.svg', // Placeholder - reemplazar con imagen real
        Peso: 8.5
      }
    ];
    
    // Buscar en product_images por SKU
    const productImage = mockProductImages.find(img => img.SKU === sku);
    if (!productImage) {
      console.log(`Imagen no encontrada para SKU: ${sku}`);
      return null;
    }
    
    // Buscar en Saprod por SKU (asumiendo que SKU corresponde a CodProd)
    const saprod = mockSaprod.find(prod => prod.CodProd === sku);
    if (!saprod) {
      console.log(`Producto no encontrado en Saprod para SKU: ${sku}`);
      return null;
    }
    
    // Combinar datos de ambas tablas
    const product: Product = {
      id: saprod.CodProd,
      name: saprod.Descrip,
      image: productImage.Imagen_URL,
      sku: sku,
      marca: saprod.Marca,
      precio: saprod.PrecioUsd,
      existencias: saprod.Existen
    };
    
    console.log(`Producto encontrado:`, product);
    return product;
    
  } catch (error) {
    console.error('Error al obtener producto por SKU:', error);
    return null;
  }
};

// Endpoint falso para actualizar cantidad en la base de datos
export const updateProductQuantity = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simular POST a la base de datos
    console.log(`POST: Actualizando producto ${productId} con cantidad ${quantity}`);
    console.log(`Endpoint: /api/inventory/update-quantity`);
    console.log(`Body: { productId: "${productId}", quantity: ${quantity} }`);
    
    // Simular éxito
    return true;
    
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    return false;
  }
};
