
import React, { useEffect } from 'react';
import type { ToastData } from '../../types';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  const baseClasses = "flex items-center w-full max-w-xs p-4 space-x-4 text-slate-500 bg-white divide-x divide-slate-200 rounded-lg shadow-lg dark:text-slate-400 dark:divide-slate-700 dark:bg-slate-800";
  const typeClasses = {
    success: 'border-l-4 border-green-500',
    danger: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500',
  };

  const iconClasses = {
    success: 'text-green-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };

  const Icon = () => (
      <svg className={`w-5 h-5 ${iconClasses[toast.type]}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          {toast.type === 'success' && <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>}
          {toast.type === 'danger' && <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>}
          {toast.type === 'info' && <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>}
      </svg>
  );

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]} animate-toast-in`}>
      <Icon/>
      <div className="pl-4 text-sm font-normal">{toast.message}</div>
    </div>
  );
};


interface ToastContainerProps {
    toasts: ToastData[];
    setToasts: React.Dispatch<React.SetStateAction<ToastData[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
  const handleDismiss = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ToastContainer;
