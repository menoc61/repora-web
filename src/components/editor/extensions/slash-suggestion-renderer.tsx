import { ReactRenderer } from '@tiptap/react'
import SlashCommandMenu, { type SlashCommandHandle } from '../SlashCommandMenu'
import type { SlashMenuItem } from './slash-menu-items'

let component: ReactRenderer<SlashCommandHandle> | null = null
let menuEl: HTMLDivElement | null = null

function mountMenu(editorElement: HTMLElement, clientRect: () => DOMRect | null) {
  if (menuEl) return
  menuEl = document.createElement('div')
  menuEl.className = 'slash-suggestion-anchor'
  const rect = clientRect()
  if (rect) {
    menuEl.style.position = 'fixed'
    menuEl.style.left = `${rect.left}px`
    menuEl.style.top = `${rect.bottom + 4}px`
    menuEl.style.zIndex = '50'
  }
  editorElement.closest('.tiptap')?.appendChild(menuEl) ?? document.body.appendChild(menuEl)
}

function unmountMenu() {
  if (menuEl) {
    menuEl.remove()
    menuEl = null
  }
}

export const suggestionRenderer = {
  onStart: (props: any) => {
    component = new ReactRenderer(SlashCommandMenu, {
      props: { items: props.items as SlashMenuItem[], command: props.command },
      editor: props.editor,
    })

    const rect = props.clientRect?.()
    if (rect) {
      menuEl = document.createElement('div')
      menuEl.style.position = 'fixed'
      menuEl.style.left = `${rect.left}px`
      menuEl.style.top = `${rect.bottom + 4}px`
      menuEl.style.zIndex = '50'
      menuEl.appendChild(component.element)
      document.body.appendChild(menuEl)
    }
  },

  onUpdate: (props: any) => {
    component?.updateProps({
      items: props.items as SlashMenuItem[],
      command: props.command,
    })

    if (menuEl) {
      const rect = props.clientRect?.()
      if (rect) {
        menuEl.style.left = `${rect.left}px`
        menuEl.style.top = `${rect.bottom + 4}px`
      }
    }
  },

  onKeyDown: (props: { event: KeyboardEvent }) => {
    if (props.event.key === 'Escape') {
      unmountMenu()
      return true
    }
    return component?.ref?.onKeyDown(props) ?? false
  },

  onExit: () => {
    component?.destroy()
    component = null
    unmountMenu()
  },
}
