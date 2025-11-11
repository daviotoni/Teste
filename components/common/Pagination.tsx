
import React from 'react';
import * as Icons from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Paginação">
      <button 
        onClick={handlePrev} 
        disabled={currentPage === 1}
        className="flex items-center justify-center px-3 h-9 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icons.ChevronLeft className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Anterior</span>
      </button>

      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 px-2">
          Página {currentPage} de {totalPages}
      </span>

      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="flex items-center justify-center px-3 h-9 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="mr-1 hidden sm:inline">Próximo</span>
        <Icons.ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;
