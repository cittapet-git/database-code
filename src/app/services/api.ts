import { Product, ApiProductResponse, ApiImageResponse } from '../types';

const BASE_URL = 'http://192.168.2.137:8888';

// GET: Obtener producto por código de barras
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await fetch(`${BASE_URL}/wp-json/barcode/v1/product/${barcode}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponse: ApiProductResponse = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      return null;
    }
    
    // Mapear la respuesta del API a nuestro tipo Product
    const product: Product = {
      id: apiResponse.data.CodProd,
      name: apiResponse.data.Descrip,
      image: '', // Se obtendrá por separado
      sku: apiResponse.data.CodProd,
      marca: apiResponse.data.Marca,
      precio: parseFloat(apiResponse.data.PrecioUsd),
      existencias: parseFloat(apiResponse.data.Existen)
    };
    
    return product;
    
  } catch (error) {
    return null;
  }
};

// GET: Obtener imagen del producto por SKU
export const getProductImage = async (sku: string): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/wp-json/barcode/v1/image/${sku}`);
    
    if (!response.ok) {
      return '';
    }
    
    const apiResponse: ApiImageResponse = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      return '';
    }
    
    return apiResponse.data.image_url;
    
  } catch (error) {
    return '';
  }
};

// PUT: Actualizar cantidad del producto (para escaneo de código de barras)
export const updateProductQuantity = async (sku: string, quantity: number, responsable: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/wp-json/barcode/v1/products/${sku}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Quantity: quantity.toString(),
        Responsable: responsable
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
    
  } catch (error) {
    return false;
  }
};

// PUT: Incrementar cantidad en +1 (para botones + y -)
export const incrementProductQuantity = async (sku: string, responsable: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/wp-json/barcode/v1/products/${sku}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Quantity: "1",
        Responsable: responsable
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
    
  } catch (error) {
    return false;
  }
};

// PUT: Decrementar cantidad en -1 (para botones + y -)
export const decrementProductQuantity = async (sku: string, responsable: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/wp-json/barcode/v1/products/${sku}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Quantity: "-1",
        Responsable: responsable
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
    
  } catch (error) {
    return false;
  }
};
