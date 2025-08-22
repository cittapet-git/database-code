'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, ScannedProduct, BarcodeScannerProps } from '../types';
import { getProductByBarcode, getProductImage, updateProductQuantity, incrementProductQuantity, decrementProductQuantity } from '../services/api';

export default function BarcodeScanner({ userName }: BarcodeScannerProps) {
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [scanInput, setScanInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Obtener datos del producto desde el API real
      const product = await getProductByBarcode(barcode);
      
      if (product) {
        // Obtener la imagen del producto
        const imageUrl = await getProductImage(product.sku);
        const productWithImage = { ...product, image: imageUrl };
        
        // Verificar si ya existe en la lista de productos escaneados
        const existingProductIndex = scannedProducts.findIndex(
          sp => sp.productId === product.id
        );
        
        if (existingProductIndex >= 0) {
          // Producto existente: incrementar cantidad
          const updatedProducts = [...scannedProducts];
          updatedProducts[existingProductIndex].quantity += 1;
          updatedProducts[existingProductIndex].lastScanned = new Date();
          
          setScannedProducts(updatedProducts);
          
          // Actualizar cantidad en el API (+1)
          await updateProductQuantity(product.sku, 1, userName);
          
          // Actualizar el producto actual con las nuevas existencias
          const updatedProduct = await getProductByBarcode(barcode);
          if (updatedProduct) {
            const updatedImageUrl = await getProductImage(updatedProduct.sku);
            setCurrentProduct({ ...updatedProduct, image: updatedImageUrl });
          }
        } else {
          // Nuevo producto: agregar a la lista
          const newScannedProduct: ScannedProduct = {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            lastScanned: new Date()
          };
          
          setScannedProducts(prev => [...prev, newScannedProduct]);
          
          // Actualizar cantidad en el API (+1)
          await updateProductQuantity(product.sku, 1, userName);
          
          // Actualizar el producto actual con las nuevas existencias
          const updatedProduct = await getProductByBarcode(barcode);
          if (updatedProduct) {
            const updatedImageUrl = await getProductImage(updatedProduct.sku);
            setCurrentProduct({ ...updatedProduct, image: updatedImageUrl });
          }
        }
        
        // Establecer el producto actual con imagen
        setCurrentProduct(productWithImage);
      } else {
        // Producto no encontrado
        alert('Producto no encontrado en la base de datos');
      }
    } catch (error) {
      alert('Error al procesar el producto');
    } finally {
      setIsLoading(false);
      // Limpiar input y enfocar para siguiente escaneo
      setScanInput('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanInput(e.target.value);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      handleScan(scanInput.trim());
    }
  };

  const handleQuantityChange = async (increment: number) => {
    if (!currentProduct) return;

    const productId = currentProduct.id;
    const currentQuantity = scannedProducts.find(sp => sp.productId === productId)?.quantity || 0;
    const newQuantity = currentQuantity + increment;

    if (newQuantity < 0) return; // No permitir cantidades negativas

    const updatedProducts = scannedProducts.map(sp =>
      sp.productId === productId ? { ...sp, quantity: newQuantity } : sp
    );
    setScannedProducts(updatedProducts);

    // Llamar a la API correspondiente según el incremento
    if (increment > 0) {
      await incrementProductQuantity(currentProduct.sku, userName);
    } else if (increment < 0) {
      await decrementProductQuantity(currentProduct.sku, userName);
    }

    // Actualizar el producto actual con las nuevas existencias
    const updatedProduct = await getProductByBarcode(currentProduct.sku);
    if (updatedProduct) {
      const updatedImageUrl = await getProductImage(updatedProduct.sku);
      setCurrentProduct({ ...updatedProduct, image: updatedImageUrl });
    }
  };

  const resetSession = () => {
    setCurrentProduct(null);
    setScannedProducts([]);
    setScanInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F2F2] via-[#F2F2F2] to-[#F2F2F2] p-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0D0D0D]">
              Sistema de Carga de Productos
            </h1>
            <p className="text-[#0D0D0D]/70 mt-2 text-lg">
              Operador: <span className="font-bold text-[#038C33]">{userName}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#0D0D0D]/60 font-medium">Total de Productos</p>
            <p className="text-4xl font-bold text-[#038C33]">
              {scannedProducts.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historial de Productos - Lado Izquierdo */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#0D0D0D]">
              Historial de Productos
            </h2>
            <button
              onClick={resetSession}
              className="px-4 py-2 text-sm bg-[#BF0404] text-white rounded-xl hover:bg-[#BF0404]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Reiniciar
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scannedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#0D0D0D]/30 mb-3">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-[#0D0D0D]/60 font-medium">No hay productos escaneados aún</p>
                <p className="text-[#0D0D0D]/40 text-sm">Escanea tu primer producto para comenzar</p>
              </div>
            ) : (
              scannedProducts.map((item) => (
                <div key={item.productId} className="p-4 bg-gradient-to-r from-[#F2F2F2] to-white rounded-xl border border-[#0D0D0D]/10 hover:border-[#038C33]/30 transition-all duration-200 hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0D0D0D] text-sm leading-tight">
                      {item.productName}
                    </span>
                    <span className="bg-[#038C33] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-[#0D0D0D]/60 font-medium">
                    Último escaneo: {item.lastScanned.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Producto Actual - Centro */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-8">
            <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6">
              Escanear Producto
            </h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label htmlFor="barcodeInput" className="block text-sm font-semibold text-[#0D0D0D]/80 mb-3">
                  Código de Barras (SKU)
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="barcodeInput"
                  value={scanInput}
                  onChange={handleInputChange}
                  onKeyPress={handleInputKeyPress}
                  className="w-full px-6 py-4 text-xl border-2 border-[#0D0D0D]/20 rounded-xl focus:ring-4 focus:ring-[#038C33]/20 focus:border-[#038C33] transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Escanear código de barras..."
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              <button
                onClick={() => handleScan(scanInput)}
                disabled={!scanInput.trim() || isLoading}
                className="w-full bg-[#038C33] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#038C33]/90 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  'Procesar Escaneo'
                )}
              </button>
            </div>

            {/* Producto Actual Grande */}
            {currentProduct ? (
              <div className="text-center p-10 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2] rounded-3xl border-2 border-[#0D0D0D]/20 shadow-2xl">
                <div className="mb-8">
                  <div className="w-56 h-56 mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl flex items-center justify-center border-2 border-[#0D0D0D]/20">
                    <img 
                      src={currentProduct.image} 
                      alt={currentProduct.name}
                      className="w-48 h-48 object-contain drop-shadow-lg"
                    />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-[#0D0D0D] mb-6 leading-tight">
                  {currentProduct.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">ID del Producto</p>
                    <p className="text-xl font-bold text-[#038C33]">{currentProduct.id}</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">SKU</p>
                    <p className="text-xl font-bold text-[#038C33]">{currentProduct.sku}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">Marca</p>
                    <p className="text-lg font-bold text-[#0D0D0D]">{currentProduct.marca}</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">Precio USD</p>
                    <p className="text-lg font-bold text-[#038C33]">${currentProduct.precio}</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">Existencias en BD</p>
                    <p className="text-lg font-bold text-[#BF0404]">{currentProduct.existencias}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">Cantidad Escaneada en esta Sesión</p>
                  
                  {/* Controles de cantidad manual */}
                  <div className="flex items-center justify-center space-x-6">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-16 h-16 bg-[#BF0404] text-white rounded-2xl hover:bg-[#BF0404]/90 focus:ring-4 focus:ring-[#BF0404]/30 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed"
                      disabled={!currentProduct}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <div className="text-center">
                      <div className="w-24 h-16 text-center text-3xl font-bold text-[#038C33] border-2 border-[#038C33]/30 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        {scannedProducts.find(sp => sp.productId === currentProduct.id)?.quantity || 0}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-16 h-16 bg-[#038C33] text-white rounded-2xl hover:bg-[#038C33]/90 focus:ring-4 focus:ring-[#038C33]/30 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed"
                      disabled={!currentProduct}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-sm text-[#0D0D0D]/70 mt-4 font-medium">
                    Usa los botones + y - para ajustar la cantidad manualmente
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gradient-to-br from-[#F2F2F2] to-white rounded-3xl border-2 border-dashed border-[#0D0D0D]/30">
                <div className="text-[#0D0D0D]/30 mb-6">
                  <svg className="w-32 h-32 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0D0D0D]/70 mb-3">
                  Escanea un producto para comenzar
                </h3>
                <p className="text-[#0D0D0D]/50 text-lg">
                  Coloca el cursor en el campo de arriba y escanea el código de barras
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-8 bg-gradient-to-r from-[#F2F2F2] via-white to-[#F2F2F2] rounded-2xl p-6 border border-[#0D0D0D]/20 shadow-lg">
        <h3 className="font-bold text-[#0D0D0D] mb-4 text-lg flex items-center">
          <svg className="w-6 h-6 text-[#038C33] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Instrucciones de Uso
        </h3>
        <ul className="text-sm text-[#0D0D0D]/80 space-y-2">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Coloca el cursor en el campo de código de barras
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Escanea el producto con tu lector de código de barras
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            El producto se mostrará automáticamente en pantalla
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Cada escaneo del mismo producto suma +1 a la cantidad
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Al escanear un producto diferente, se cambia automáticamente
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Usa los botones + y - para ajustar la cantidad manualmente
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Las existencias se incrementan automáticamente en +1 en la base de datos
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Sistema compatible con múltiples sesiones simultáneas
          </li>
        </ul>
      </div>
    </div>
  );
}
