"use client";

import { useState, useEffect, useRef } from "react";
import { testDatabaseConnection } from "../services/api";
import ScanLogs from "./ScanLogs";

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
  const [allBarcodeRecords, setAllBarcodeRecords] = useState<BarcodeEntry[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState<number>(0);
  const [scanInput, setScanInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessBlink, setShowSuccessBlink] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isCheckingConnection, setIsCheckingConnection] =
    useState<boolean>(true);
  const [showErrorAlert, setShowErrorAlert] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScannedRef = useRef<{ barcode: string; time: number } | null>(null);

  // Calcular total de productos escaneados
  const totalProductsScanned = allBarcodeRecords.reduce((sum, item) => sum + item.quantity, 0);

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.6,
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorAlert(true);
    playErrorSound();
    setTimeout(() => setShowErrorAlert(false), 4000);
  };

  const fetchBarcodeRecords = async () => {
    if (!isDbConnected) return;
    
    setIsLoadingRecords(true);
    try {
      const response = await fetch('/api/scans');
      if (response.ok) {
        const recordsData = await response.json();
        
        // Check if response has error property
        if (recordsData.error) {
          console.error('API error:', recordsData.error);
          setAllBarcodeRecords([]);
          return;
        }
        
        // Convert object to array and sort by lastScanned in descending order (newest first)
        const recordsArray = Object.values(recordsData) as BarcodeEntry[];
        const sortedRecords = recordsArray.sort((a: BarcodeEntry, b: BarcodeEntry) => 
          new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime()
        );
        setAllBarcodeRecords(sortedRecords);
      } else {
        console.error('Failed to fetch barcode records:', response.status);
        setAllBarcodeRecords([]);
      }
    } catch (error) {
      console.error('Error fetching barcode records:', error);
      setAllBarcodeRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    const checkDbConnection = async () => {
      setIsCheckingConnection(true);
      const connected = await testDatabaseConnection();
      setIsDbConnected(connected);
      setIsCheckingConnection(false);
      
      if (connected) {
        fetchBarcodeRecords();
      }
    };

    checkDbConnection();
    const connectionCheckInterval = setInterval(checkDbConnection, 30000);

    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, []);

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
    if (!barcode.trim() || !isDbConnected) return;

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
        body: JSON.stringify({
          barcode: barcode.trim(),
          responsible: userName,
        }),
      });

      if (response.ok) {
        const barcodeEntry = await response.json();
        setCurrentBarcode(barcodeEntry);

        // Update local state
        setScannedBarcodes((prev) => ({
          ...prev,
          [barcode.trim()]: barcodeEntry,
        }));

        // Refresh the records from database
        fetchBarcodeRecords();
        
        // Trigger logs refresh
        setLogsRefreshTrigger(prev => prev + 1);

        // Show success blink
        setShowSuccessBlink(true);
        setTimeout(() => setShowSuccessBlink(false), 500);
      } else {
        showError(`Error al procesar el código de barras: ${response.status}`);
      }
    } catch (error) {
      showError("Error de conexión al procesar el código de barras");
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
    if (!currentBarcode || !isDbConnected) return;

    const newQuantity = currentBarcode.quantity + increment;
    if (newQuantity < 0) return;

    if (increment > 0) {
      await handleScan(currentBarcode.barcode);
    } else {
      // For decrement, we need to call the API with -1 increment
      try {
        const response = await fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode: currentBarcode.barcode,
            responsible: userName,
            increment: -1,
          }),
        });

        if (response.ok) {
          const barcodeEntry = await response.json();
          setCurrentBarcode(barcodeEntry);

          setScannedBarcodes((prev) => ({
            ...prev,
            [currentBarcode.barcode]: barcodeEntry,
          }));

          // Refresh the records from database
          fetchBarcodeRecords();
          
          // Trigger logs refresh
          setLogsRefreshTrigger(prev => prev + 1);
        } else {
          showError(`Error al actualizar cantidad: ${response.status}`);
        }
      } catch (error) {
        showError("Error de conexión al actualizar cantidad");
      }
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
            <div className="flex space-x-8">
              <div>
                <p className="text-sm text-[#0D0D0D]/60 font-medium">
                  Total de Códigos
                </p>
                <p className="text-4xl font-bold text-[#038C33]">
                  {Object.keys(scannedBarcodes).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#0D0D0D]/60 font-medium">
                  Total Productos Escaneados
                </p>
                <p className="text-4xl font-bold text-[#038C33]">
                  {totalProductsScanned}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="mt-6 p-4 rounded-xl border-2 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${isCheckingConnection ? "bg-yellow-500 animate-pulse" : isDbConnected ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-sm font-semibold text-[#0D0D0D]/80">
                Estado de Base de Datos:
              </span>
            </div>
            <span
              className={`text-sm font-bold ${isCheckingConnection ? "text-yellow-600" : isDbConnected ? "text-green-600" : "text-red-600"}`}
            >
              {isCheckingConnection
                ? "Verificando..."
                : isDbConnected
                  ? "Conectado"
                  : "Sin Conexión"}
            </span>
          </div>
          {!isDbConnected && !isCheckingConnection && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Sin conexión a la base de datos. No se pueden realizar
                cambios ni registrar productos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Códigos Registrados - Lado Izquierdo */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0D0D0D]">
                Códigos Registrados
              </h2>
              <p className="text-sm text-[#0D0D0D]/60 mt-1">
                Total: {allBarcodeRecords.length} registros
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchBarcodeRecords}
                disabled={isLoadingRecords || !isDbConnected}
                className="px-3 py-2 text-sm bg-[#038C33] text-white rounded-xl hover:bg-[#038C33]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:bg-[#0D0D0D]/30"
              >
                {isLoadingRecords ? "..." : "🔄"}
              </button>
              <button
                onClick={resetSession}
                className="px-4 py-2 text-sm bg-[#BF0404] text-white rounded-xl hover:bg-[#BF0404]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Reiniciar
              </button>
            </div>
          </div>

          <div className="space-y-3 h-full">
            {isLoadingRecords ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#038C33]/30 border-t-[#038C33] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#0D0D0D]/60 font-medium">Cargando registros...</p>
              </div>
            ) : allBarcodeRecords.length === 0 ? (
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
                  No hay códigos registrados
                </p>
                <p className="text-[#0D0D0D]/40 text-sm">
                  Escanea tu primer código para comenzar
                </p>
              </div>
            ) : (
              allBarcodeRecords.map((item) => (
                <div
                  key={item.barcode}
                  onClick={() => setCurrentBarcode(item)}
                  className="p-4 bg-gradient-to-r from-[#F2F2F2] to-white rounded-xl border border-[#0D0D0D]/10 hover:border-[#038C33]/50 transition-all duration-200 hover:shadow-md cursor-pointer hover:bg-gradient-to-r hover:from-[#038C33]/5 hover:to-white transform hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0D0D0D] text-sm leading-tight">
                      {item.barcode}
                    </span>
                    <span className="bg-[#038C33] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-[#0D0D0D]/60 font-medium space-y-1">
                    <p>
                      Último: {new Date(item.lastScanned).toLocaleString()}
                    </p>
                    <p>
                      Primer: {new Date(item.firstScanned).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-[#038C33] font-medium">
                    Click para seleccionar
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Código Actual - Lado Derecho */}
        <div>
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
                  disabled={isLoading || !isDbConnected}
                />
              </div>

              <button
                onClick={() => handleScan(scanInput)}
                disabled={!scanInput.trim() || isLoading || !isDbConnected}
                className="w-full bg-[#038C33] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#038C33]/90 disabled:bg-[#0D0D0D]/30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : !isDbConnected ? (
                  "Sin conexión a BD"
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
                      disabled={
                        !currentBarcode ||
                        currentBarcode.quantity <= 0 ||
                        !isDbConnected
                      }
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
                      disabled={!currentBarcode || !isDbConnected}
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

      {/* Bottom Section - Full Width Logs */}
      <div>
        <ScanLogs 
          barcode={currentBarcode?.barcode || null} 
          isDbConnected={isDbConnected}
          refreshTrigger={logsRefreshTrigger}
        />
      </div>

      {/* Success Overlay */}
      {showSuccessBlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/30 backdrop-blur-sm animate-pulse">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-green-500 p-12 text-center transform scale-110 animate-bounce">
            <div className="text-8xl text-green-500 mb-4">✓</div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">¡Éxito!</h2>
            <p className="text-lg text-gray-700">
              Código registrado correctamente
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {showErrorAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-500/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-500 p-12 text-center transform scale-110 animate-pulse">
            <div className="text-8xl text-red-500 mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-red-600 mb-2">¡Error!</h2>
            <p className="text-lg text-gray-700">{errorMessage}</p>
            <button
              onClick={() => setShowErrorAlert(false)}
              className="mt-6 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
