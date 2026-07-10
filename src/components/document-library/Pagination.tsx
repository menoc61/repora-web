import Icon from '../Icon'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
      <div className="font-label-sm text-label-sm text-on-surface-variant">Page {currentPage} sur {totalPages}</div>
      <div className="flex items-center gap-1">
        <button className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>
          <Icon name="chevron_left" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4))
          if (pageNum < 1) return null
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded font-label-md text-label-md ${currentPage === pageNum ? 'bg-ai-vibrant text-white' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
            >
              {pageNum}
            </button>
          )
        })}
        {totalPages > 5 && <span className="px-1 text-on-surface-variant">...</span>}
        <button className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30" disabled={currentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  )
}
