interface FilterChipsProps {
  filters: string[]
  active: string
  onSelect: (f: string) => void
}

export default function FilterChips({ filters, active, onSelect }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all ${
            active === f ? 'bg-primary text-white' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
