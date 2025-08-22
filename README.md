# Sistema de Carga con Lector de Código de Barras

Aplicación web desarrollada en Next.js con TypeScript y Tailwind CSS para gestionar la carga de productos mediante un lector de código de barras.

## Características

- **Autenticación de Usuario**: Pantalla de login para identificar al operador
- **Escaneo de Productos**: Interfaz optimizada para lectores de código de barras
- **Producto Actual Grande**: Muestra imagen, nombre, ID y cantidad del producto escaneado
- **Historial Simple**: Lista de productos escaneados con cantidades
- **Suma Automática**: Cada escaneo del mismo producto suma 1 a la cantidad
- **Cambio Automático**: Al escanear un producto diferente, se cambia automáticamente
- **Controles Manuales**: Botones + y - para ajustar cantidades manualmente
- **Campo de Cantidad**: Input numérico para escribir cantidades específicas
- **Diseño Responsivo**: Interfaz adaptada para diferentes tamaños de pantalla

## Tecnologías Utilizadas

- **Next.js 15.5.0** - Framework de React
- **React 19.1.0** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS 4** - Framework de CSS utilitario

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   └── BarcodeScanner.tsx    # Componente principal del escáner
│   ├── services/
│   │   └── api.ts                # Servicios de API (endpoints falsos)
│   ├── types/
│   │   └── index.ts              # Definiciones de tipos TypeScript
│   ├── layout.tsx                # Layout principal de la aplicación
│   └── page.tsx                  # Página principal con autenticación
├── globals.css                   # Estilos globales
└── tsconfig.json                 # Configuración de TypeScript
```

## Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## Flujo de Uso

1. **Login**: El operador ingresa su nombre en la pantalla inicial
2. **Escaneo**: Se coloca el cursor en el campo de código de barras
3. **Procesamiento**: Se escanea el producto y se obtienen los datos de la BD
4. **Visualización**: Se muestra el producto actual grande con imagen y detalles
5. **Suma Automática**: Cada escaneo del mismo producto suma 1
6. **Cambio de Producto**: Al escanear uno diferente, se cambia automáticamente
7. **Ajuste Manual**: Usar botones + y - o campo de texto para corregir cantidades

## Estructura de Base de Datos

### Tabla: product_images
- **SKU**: Código de barras del producto
- **Imagen_URL**: URL de la imagen del producto
- **Peso**: Peso del producto

### Tabla: Saprod
- **CodProd**: Código del producto (corresponde al SKU)
- **Marca**: Marca del producto
- **Descrip**: Descripción completa del producto
- **PrecioUsd**: Precio en USD
- **PrecioUsd2**: Precio alternativo en USD
- **Existen**: Cantidad en existencias

## Endpoints de API

### GET - Obtener Producto por SKU
```typescript
// Endpoint: /api/products/{sku}
// Obtiene: imagen, nombre, id, marca, precio, existencias
getProductBySku(sku: string): Promise<Product | null>
```

### POST - Actualizar Cantidad
```typescript
// Endpoint: /api/inventory/update-quantity
// Actualiza: cantidad del producto en la BD
updateProductQuantity(productId: string, quantity: number): Promise<boolean>
```

## Personalización

### Endpoints Reales

Para integrar con tu base de datos real:

1. **Reemplazar `getProductBySku`** en `src/app/services/api.ts`:
   ```typescript
   export const getProductBySku = async (sku: string): Promise<Product | null> => {
     try {
       // Obtener imagen de product_images
       const imageResponse = await fetch(`/api/product-images/${sku}`);
       if (!imageResponse.ok) return null;
       const productImage = await imageResponse.json();
       
       // Obtener datos de Saprod
       const productResponse = await fetch(`/api/saprod/${sku}`);
       if (!productResponse.ok) return null;
       const saprod = await productResponse.json();
       
       // Combinar datos
       return {
         id: saprod.CodProd,
         name: saprod.Descrip,
         image: productImage.Imagen_URL,
         sku: sku,
         marca: saprod.Marca,
         precio: saprod.PrecioUsd,
         existencias: saprod.Existen
       };
     } catch (error) {
       console.error('Error:', error);
       return null;
     }
   };
   ```

2. **Reemplazar `updateProductQuantity`** en `src/app/services/api.ts`:
   ```typescript
   export const updateProductQuantity = async (productId: string, quantity: number): Promise<boolean> => {
     const response = await fetch(`/api/inventory/update-quantity`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ productId, quantity })
     });
     return response.ok;
   };
   ```

### Imágenes de Productos

Reemplazar las rutas de placeholder (`/next.svg`, `/vercel.svg`, etc.) con las URLs reales de las imágenes de los productos.

## Funcionalidades

- **Escaneo Continuo**: El sistema se prepara automáticamente para el siguiente escaneo
- **Manejo de Errores**: Alerta si el producto no se encuentra en la BD
- **Estado de Carga**: Indicador visual durante el procesamiento
- **Controles de Cantidad**: Botones + y - para ajustar cantidades manualmente
- **Campo de Cantidad**: Input numérico para escribir cantidades específicas
- **Actualización en BD**: Cada cambio de cantidad se postea automáticamente
- **Reinicio de Sesión**: Botón para limpiar el historial y comenzar de nuevo
- **Persistencia Temporal**: Los datos se mantienen durante la sesión (no se pierden al recargar)

## Licencia

Este proyecto es de uso interno para gestión de inventario.
