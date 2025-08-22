export interface ProductImage {
  SKU: string;
  Imagen_URL: string;
  Peso: number;
}

export interface Saprod {
  CodProd: string;
  Marca: string;
  Descrip: string;
  PrecioUsd: number;
  PrecioUsd2: number;
  Existen: number;
}

// Estructura real del API
export interface ApiProductResponse {
  success: boolean;
  data: {
    CodProd: string;
    Marca: string;
    Descrip: string;
    PrecioUsd: string;
    PrecioUsd2: string;
    Existen: string;
  };
}

export interface ApiImageResponse {
  success: boolean;
  data: {
    sku: string;
    image_url: string;
  };
}

export interface Product {
  id: string;
  name: string;
  image: string;
  sku: string;
  marca: string;
  precio: number;
  existencias: number;
}

export interface ScannedProduct {
  productId: string;
  productName: string;
  quantity: number;
  lastScanned: Date;
}

export interface BarcodeScannerProps {
  userName: string;
}
