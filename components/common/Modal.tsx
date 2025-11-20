
import React from 'react';
// Fix: Import 'X' icon from lucide-react to fix 'LucideReact' not existing on window.
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div 
        className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md m-4 p-6 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-gold-400">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
            {/* Fix: Use imported X component */}
            <X size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation-name: fade-in-scale;
          animation-duration: 0.3s;
        }
      `}</style>
    </div>
  );
};
