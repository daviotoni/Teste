
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
        onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${maxWidth} m-auto flex flex-col my-8`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
          {children}
        </main>
        {footer && (
          <footer className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl flex justify-end items-center gap-3 flex-wrap">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
