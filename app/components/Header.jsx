'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../api/ApiWrapper.jsx';

export default function Header({ user, activeTab, setActiveTab }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <nav className="flex gap-12">
            <button
              onClick={() => setActiveTab('aktuell')}
              className={`text-lg font-medium transition-colors ${
                activeTab === 'aktuell'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Aktuell
            </button>
            <button
              onClick={() => setActiveTab('projekte')}
              className={`text-lg font-medium transition-colors ${
                activeTab === 'projekte'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Projekte
            </button>
            
            {(user?.is_creator || user?.is_admin) && (
              <Link 
                href="/users"
                className="text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Benutzerverwaltung
              </Link>
            )}
          </nav>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {user?.hex_color && (
                <div 
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: `#${user.hex_color}` }}
                />
              )}
              
              <div className="flex flex-col gap-1">
                <div className="w-5 h-0.5 bg-gray-700"></div>
                <div className="w-5 h-0.5 bg-gray-700"></div>
                <div className="w-5 h-0.5 bg-gray-700"></div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium">{user?.username}</p>
                {user?.firm && (
                  <p className="text-xs text-gray-500">{user.firm.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  {user?.is_creator ? 'Ersteller' : user?.is_firm_admin ? 'Admin' : 'Benutzer'}
                </p>
              </div>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                ></div>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {user?.hex_color && (
                        <div 
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: `#${user.hex_color}` }}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    {user?.firm && (
                      <p className="text-xs text-gray-500 mt-1">
                        Firma: {user.firm.name}
                      </p>
                    )}
                  </div>
                  
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Profil
                  </Link>
                  
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Einstellungen
                  </Link>
                  
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Abmelden
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}