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
