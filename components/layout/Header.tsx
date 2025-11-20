
import React, { useState, useRef, useEffect } from 'react';
// Fix: Import icons from lucide-react to fix 'LucideReact' not existing on window.
import { Store, Moon, Sun, Printer, FileText, ReceiptText, Receipt, History, LogOut } from 'lucide-react';
import type { Theme } from '../../types';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  onGenerateReport: (type: 'complete' | 'short') => void;
  onPrintReceipt: () => void;
  onShowHistory: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGenerateReport, onPrintReceipt, onShowHistory, onLogout, isLoggedIn }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-sm p-4 shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
           <Store size={32} className="text-gold-500 flex-shrink-0" />
           <div>
             <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy-800 to-navy-700 dark:from-gold-400 dark:to-gold-500 leading-tight">
              UNI BRILINK
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aplikasi pengelola stok dan laporan voucher Internet</p>
           </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gold-500 bg-navy-800 dark:bg-gold-500 dark:text-navy-900 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
           <button
            onClick={onShowHistory}
            className="p-2 rounded-full text-gold-500 bg-navy-800 hover:shadow-soft-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Riwayat Aktivitas"
          >
            <History size={20} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 rounded-full text-gold-500 bg-navy-800 hover:shadow-soft-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label="Cetak Laporan"
            >
              <Printer size={20} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-light-card dark:bg-dark-card rounded-md shadow-lg z-50 overflow-hidden transform transition-all duration-300 origin-top-right animate-scale-down">
                <ul className="py-1">
                  <li>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); onGenerateReport('complete'); setDropdownOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <FileText size={16} />
                      <span>LAPORAN LENGKAP</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); onGenerateReport('short'); setDropdownOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <ReceiptText size={16} />
                      <span>LAPORAN SINGKAT</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); onPrintReceipt(); setDropdownOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <Receipt size={16} />
                      <span>Cetak Resi (Thermal)</span>
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
           {isLoggedIn && (
             <button
                onClick={onLogout}
                className="p-2 rounded-full text-red-500 bg-navy-800 hover:shadow-soft-glow-red transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
           )}
        </div>
      </div>
      <style>{`
        @keyframes scale-down {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-down {
          animation: scale-down 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};
