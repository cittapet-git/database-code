import { Product } from '../types';

// Endpoint real para obtener datos del producto por SKU
export const getProductBySku = async (sku: string): Promise<Product | null> => {
  try {
    const response = await fetch(`/api/products/${sku}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Producto no encontrado para SKU: ${sku}`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const product = await response.json();
    console.log(`Producto encontrado:`, product);
    return product;
    
  } catch (error) {
    console.error('Error al obtener producto por SKU:', error);
    return null;
  }
};

// Endpoint real para INCREMENTAR existencias en +1 en la base de datos
export const incrementProductQuantity = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/inventory/update-quantity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }), // Solo enviamos productId, la cantidad siempre será +1
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Existencias incrementadas exitosamente:`, result);
    return true;
    
  } catch (error) {
    console.error('Error al incrementar existencias:', error);
    return false;
  }
};
