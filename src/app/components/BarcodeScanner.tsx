"use client";

import { useState, useEffect, useRef } from "react";

interface BarcodeEntry {
  barcode: string;
  quantity: number;
  lastScanned: string;
  firstScanned: string;
}

interface BarcodeScannerProps {
  userName: string;
}

export default function BarcodeScanner({ userName }: BarcodeScannerProps) {
  const [currentBarcode, setCurrentBarcode] = useState<BarcodeEntry | null>(
    null,
  );
  const [scannedBarcodes, setScannedBarcodes] = useState<{
    [key: string]: BarcodeEntry;
  }>({});
  const [scanInput, setScanInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessBlink, setShowSuccessBlink] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScannedRef = useRef<{ barcode: string; time: number } | null>(null);

  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();

    // Ensure input stays focused even if user clicks elsewhere
    const handleFocusLoss = () => {
      setTimeout(focusInput, 10);
    };

    // Re-focus when component mounts or updates
    const intervalId = setInterval(() => {
      if (document.activeElement !== inputRef.current && !isLoading) {
        focusInput();
      }
    }, 100);

    // Listen for window focus to refocus input
    window.addEventListener("focus", focusInput);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", focusInput);
    };
  }, [isLoading]);

  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    // Prevent duplicate scans within 500ms
    const now = Date.now();
    if (
      lastScannedRef.current &&
      lastScannedRef.current.barcode === barcode.trim() &&
      now - lastScannedRef.current.time < 500
    ) {
      setScanInput("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    lastScannedRef.current = { barcode: barcode.trim(), time: now };
    setIsLoading(true);

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: barcode.trim(), responsible: userName }),
      });

      if (response.ok) {
        const barcodeEntry = await response.json();
        setCurrentBarcode(barcodeEntry);

        // Update local state
        setScannedBarcodes((prev) => ({
          ...prev,
          [barcode.trim()]: barcodeEntry,
        }));

        // Show success blink
        setShowSuccessBlink(true);
        setTimeout(() => setShowSuccessBlink(false), 500);
      } else {
        alert("Error al procesar el código de barras");
      }
    } catch (error) {
      alert("Error al procesar el código de barras");
    } finally {
      setIsLoading(false);
      setScanInput("");
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScanInput(value);
    // Removed auto-processing to prevent premature triggers
    // Will only process on Enter/Tab key from barcode scanner
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key (common with barcode scanners)
    if (e.key === "Enter" && scanInput.trim()) {
      e.preventDefault();
      handleScan(scanInput.trim());
    }

    // Handle Tab key (some scanners use this)
    if (e.key === "Tab" && scanInput.trim()) {
      e.preventDefault();
      handleScan(scanInput.trim());
    }
  };

  const handleQuantityChange = async (increment: number) => {
    if (!currentBarcode) return;

    const newQuantity = currentBarcode.quantity + increment;
    if (newQuantity < 0) return;

    if (increment > 0) {
      await handleScan(currentBarcode.barcode);
    } else {
      // For decrement, we'll manually update the quantity
      const updatedEntry = {
        ...currentBarcode,
        quantity: newQuantity,
        lastScanned: new Date().toISOString(),
      };

      setCurrentBarcode(updatedEntry);
      setScannedBarcodes((prev) => ({
        ...prev,
        [currentBarcode.barcode]: updatedEntry,
      }));
    }
  };

  const resetSession = () => {
    setCurrentBarcode(null);
    setScannedBarcodes({});
    setScanInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F2F2] via-[#F2F2F2] to-[#F2F2F2] p-4 relative">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0D0D0D]">
              Sistema de Registro de Códigos
            </h1>
            <p className="text-[#0D0D0D]/70 mt-2 text-lg">
              Operador:{" "}
              <span className="font-bold text-[#038C33]">{userName}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#0D0D0D]/60 font-medium">
              Total de Códigos
            </p>
            <p className="text-4xl font-bold text-[#038C33]">
              {Object.keys(scannedBarcodes).length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Códigos Registrados - Lado Izquierdo */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#0D0D0D]">
              Códigos Registrados
            </h2>
            <button
              onClick={resetSession}
              className="px-4 py-2 text-sm bg-[#BF0404] text-white rounded-xl hover:bg-[#BF0404]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Reiniciar
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.keys(scannedBarcodes).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#0D0D0D]/30 mb-3">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-[#0D0D0D]/60 font-medium">
                  No hay códigos escaneados aún
                </p>
                <p className="text-[#0D0D0D]/40 text-sm">
                  Escanea tu primer código para comenzar
                </p>
              </div>
            ) : (
              Object.values(scannedBarcodes).map((item) => (
                <div
                  key={item.barcode}
                  className="p-4 bg-gradient-to-r from-[#F2F2F2] to-white rounded-xl border border-[#0D0D0D]/10 hover:border-[#038C33]/30 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0D0D0D] text-sm leading-tight">
                      {item.barcode}
                    </span>
                    <span className="bg-[#038C33] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-[#0D0D0D]/60 font-medium">
                    Último escaneo:{" "}
                    {new Date(item.lastScanned).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Código Actual - Centro */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-8">
            <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6">
              Escanear Código de Barras
            </h2>

            <div className="space-y-6 mb-8">
              <div>
                <label
                  htmlFor="barcodeInput"
                  className="block text-sm font-semibold text-[#0D0D0D]/80 mb-3"
                >
                  Código de Barras
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="barcodeInput"
                  value={scanInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyPress}
                  className="w-full px-6 py-4 text-xl border-2 border-[#0D0D0D]/20 rounded-xl focus:ring-4 focus:ring-[#038C33]/20 focus:border-[#038C33] transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Listo para escanear..."
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
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
                  "Procesar Escaneo"
                )}
              </button>
            </div>

            {/* Código Actual */}
            {currentBarcode ? (
              <div className="text-center p-10 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2] rounded-3xl border-2 border-[#0D0D0D]/20 shadow-2xl">
                <div className="mb-8">
                  <div className="w-56 h-56 mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl flex items-center justify-center border-2 border-[#0D0D0D]/20">
                    <div className="text-6xl text-[#038C33]">📦</div>
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-[#0D0D0D] mb-6 leading-tight">
                  {currentBarcode.barcode}
                </h3>

                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">
                      Primer Escaneo
                    </p>
                    <p className="text-lg font-bold text-[#038C33]">
                      {new Date(currentBarcode.firstScanned).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#0D0D0D]/20">
                    <p className="text-sm text-[#0D0D0D]/70 font-semibold mb-2">
                      Último Escaneo
                    </p>
                    <p className="text-lg font-bold text-[#038C33]">
                      {new Date(currentBarcode.lastScanned).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">
                    Cantidad Total Registrada
                  </p>

                  {/* Controles de cantidad manual */}
                  <div className="flex items-center justify-center space-x-6">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-16 h-16 bg-[#BF0404] text-white rounded-2xl hover:bg-[#BF0404]/90 focus:ring-4 focus:ring-[#BF0404]/30 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed"
                      disabled={!currentBarcode || currentBarcode.quantity <= 0}
                    >
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <div className="text-center">
                      <div className="w-24 h-16 text-center text-3xl font-bold text-[#038C33] border-2 border-[#038C33]/30 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        {currentBarcode.quantity}
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-16 h-16 bg-[#038C33] text-white rounded-2xl hover:bg-[#038C33]/90 focus:ring-4 focus:ring-[#038C33]/30 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed"
                      disabled={!currentBarcode}
                    >
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 4v16m8-8H4"
                        />
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
                  <svg
                    className="w-32 h-32 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0D0D0D]/70 mb-3">
                  Escanea un código para comenzar
                </h3>
                <p className="text-[#0D0D0D]/50 text-lg">
                  Coloca el cursor en el campo de arriba y escanea el código de
                  barras
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-8 bg-gradient-to-r from-[#F2F2F2] via-white to-[#F2F2F2] rounded-2xl p-6 border border-[#0D0D0D]/20 shadow-lg">
        <h3 className="font-bold text-[#0D0D0D] mb-4 text-lg flex items-center">
          <svg
            className="w-6 h-6 text-[#038C33] mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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
            Escanea el código con tu lector de código de barras
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            El código se registrará automáticamente en el sistema
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Cada escaneo del mismo código suma +1 a la cantidad
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Los códigos nuevos se crean automáticamente
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Usa los botones + y - para ajustar la cantidad manualmente
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Todos los datos se guardan localmente en un archivo JSON
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-[#038C33] rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Sistema rápido y simple para registro de códigos
          </li>
        </ul>
      </div>

      {/* Success Overlay */}
      {showSuccessBlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/30 backdrop-blur-sm animate-pulse">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-green-500 p-12 text-center transform scale-110 animate-bounce">
            <div className="text-8xl text-green-500 mb-4">✓</div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">¡Éxito!</h2>
            <p className="text-lg text-gray-700">Código registrado correctamente</p>
          </div>
        </div>
      )}
    </div>
  );
}
