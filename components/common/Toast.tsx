
import React, { useEffect } from 'react';
// Fix: Import icons from lucide-react to fix 'LucideReact' not existing on window.
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: number) => void;
}

const toastIcons = {
  // Fix: Use imported icon components
  success: <CheckCircle size={24} className="text-green-500" />,
  error: <XCircle size={24} className="text-red-500" />,
  info: <Info size={24} className="text-blue-500" />,
};

const toastColors = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-blue-500',
};

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 15000); // Increased duration for error with link

    return () => {
      clearTimeout(timer);
    };
  }, [message.id, onDismiss]);

  return (
    <div
      className={`max-w-sm w-full bg-light-card dark:bg-dark-card shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${toastColors[message.type]} animate-slide-in-right`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {toastIcons[message.type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {message.message}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(message.id)}
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              {/* Fix: Use imported X component */}
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </div>
  );
};