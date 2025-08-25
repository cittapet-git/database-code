"use client";

import { useState, useEffect, useCallback } from "react";

interface ScanLog {
  id: number;
  barcode: string;
  delta: number;
  quantity_after: number;
  actor_name: string;
  created_at: string;
}

interface ScanLogsProps {
  barcode: string | null;
  isDbConnected: boolean;
  refreshTrigger: number; // Used to trigger refresh when new scans happen
}

export default function ScanLogs({ barcode, isDbConnected, refreshTrigger }: ScanLogsProps) {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLogs = logs.slice(startIndex, endIndex);

  // Reset to page 1 when logs change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [logs.length, currentPage, totalPages]);

  const fetchLogs = useCallback(async () => {
    if (!barcode || !isDbConnected) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/scans/logs?barcode=${encodeURIComponent(barcode)}`);
      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      } else {
        console.error("Failed to fetch logs:", response.status);
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [barcode, isDbConnected]);

  useEffect(() => {
    fetchLogs();
  }, [barcode, isDbConnected, refreshTrigger, fetchLogs]);

  const formatDelta = (delta: number) => {
    return delta > 0 ? `+${delta}` : `${delta}`;
  };

  const getDeltaColor = (delta: number) => {
    return delta > 0 ? "text-green-600" : "text-red-600";
  };

  const getDeltaIcon = (delta: number) => {
    return delta > 0 ? "📈" : "📉";
  };

  if (!barcode) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-6">
        <h2 className="text-xl font-bold text-[#0D0D0D] mb-4">
          Historial de Movimientos
        </h2>
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
            Selecciona un código de barras
          </p>
          <p className="text-[#0D0D0D]/40 text-sm">
            Para ver su historial de movimientos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#0D0D0D]/10 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0D0D0D]">
            Historial de Movimientos
          </h2>
          <p className="text-sm text-[#0D0D0D]/60 mt-1">
            Código: <span className="font-mono font-semibold">{barcode}</span> | 
            Total: {logs.length} movimientos | Página {currentPage} de {totalPages || 1}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading || !isDbConnected}
            className="px-3 py-2 text-sm bg-[#038C33] text-white rounded-xl hover:bg-[#038C33]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:bg-[#0D0D0D]/30"
          >
            {isLoading ? "..." : "🔄"}
          </button>
        </div>
      </div>

      <div className="space-y-3" style={{ minHeight: "320px" }}>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-[#038C33]/30 border-t-[#038C33] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#0D0D0D]/60 text-sm">Cargando historial...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[#0D0D0D]/30 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-[#0D0D0D]/60 font-medium text-sm">
              No hay movimientos registrados
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentPageLogs.map((log, index) => {
                const globalIndex = startIndex + index;
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      globalIndex === 0
                        ? "bg-gradient-to-r from-[#038C33]/10 to-white border-[#038C33]/30 shadow-sm"
                        : "bg-gradient-to-r from-[#F2F2F2] to-white border-[#0D0D0D]/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getDeltaIcon(log.delta)}</span>
                        <span className={`font-bold text-lg ${getDeltaColor(log.delta)}`}>
                          {formatDelta(log.delta)}
                        </span>
                        {globalIndex === 0 && (
                          <span className="bg-[#038C33] text-white text-xs font-bold px-2 py-1 rounded-full">
                            RECIENTE
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="bg-[#0D0D0D]/10 text-[#0D0D0D] text-xs font-bold px-2 py-1 rounded-full">
                          Total: {log.quantity_after}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs text-[#0D0D0D]/60">
                      <div>
                        <p className="font-semibold mb-1">Operador:</p>
                        <p className="font-mono bg-[#F2F2F2] px-2 py-1 rounded">
                          {log.actor_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Fecha y Hora:</p>
                        <p className="font-mono bg-[#F2F2F2] px-2 py-1 rounded">
                          {new Date(log.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-[#0D0D0D]/10 mt-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-[#0D0D0D]/10 text-[#0D0D0D] rounded-lg hover:bg-[#0D0D0D]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Anterior</span>
                </button>

                <div className="flex space-x-2">
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      const pageNumber =
                        totalPages <= 5
                          ? i + 1
                          : currentPage <= 3
                            ? i + 1
                            : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-8 h-8 text-xs rounded-lg transition-all duration-200 ${
                            currentPage === pageNumber
                              ? "bg-[#038C33] text-white shadow-lg"
                              : "bg-[#0D0D0D]/10 text-[#0D0D0D] hover:bg-[#0D0D0D]/20"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-[#0D0D0D]/10 text-[#0D0D0D] rounded-lg hover:bg-[#0D0D0D]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Siguiente</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#0D0D0D]/10">
          <p className="text-xs text-[#0D0D0D]/50 text-center">
            Mostrando los últimos {logs.length} movimientos
          </p>
        </div>
      )} */}
    </div>
  );
}