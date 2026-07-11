import { forwardRef, useEffect, useState, useCallback, useImperativeHandle } from 'react'
import Icon from '../Icon'
import type { SlashMenuItem } from './extensions/slash-menu-items'

export interface SlashCommandHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SlashCommandMenuProps {
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

const SlashCommandMenu = forwardRef<SlashCommandHandle, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command],
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        if (event.key === 'Escape') {
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div className="bg-white border border-outline-variant rounded-lg shadow-xl overflow-hidden w-72 max-h-80 overflow-y-auto z-50">
        {items.map((item, index) => {
          const isAI = item.icon === 'auto_awesome' || item.icon === 'edit_note'
          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-ai-glow text-ai-vibrant'
                  : 'hover:bg-surface-studio text-on-surface-variant'
              }`}
              onClick={() => selectItem(index)}
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAI ? 'bg-ai-vibrant text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <Icon name={item.icon} className="text-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-body-sm font-medium truncate">{item.label}</div>
                <div className="text-[11px] text-on-surface-variant/70 truncate">{item.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    )
  },
)

SlashCommandMenu.displayName = 'SlashCommandMenu'
export default SlashCommandMenu
