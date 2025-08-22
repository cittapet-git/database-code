'use client';

import { useState } from 'react';
import BarcodeScanner from './components/BarcodeScanner';

export default function Home() {
  const [userName, setUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F2F2] via-[#F2F2F2] to-[#F2F2F2] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#0D0D0D]/10 p-10 w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-r from-[#038C33] to-[#038C33] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#0D0D0D] mb-3">
              Sistema de Carga
            </h1>
            <p className="text-[#0D0D0D]/70 text-lg">
              Ingresa tu nombre para comenzar
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label htmlFor="userName" className="block text-sm font-semibold text-[#0D0D0D]/80 mb-3">
                Nombre del Operador
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-[#0D0D0D]/20 rounded-xl focus:ring-4 focus:ring-[#038C33]/20 focus:border-[#038C33] transition-all duration-200 bg-white/90 backdrop-blur-sm"
                placeholder="Ingresa tu nombre completo"
                required
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#038C33] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#038C33]/90 focus:ring-4 focus:ring-[#038C33]/30 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Comenzar Carga
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BarcodeScanner userName={userName} />
    </div>
  );
}
