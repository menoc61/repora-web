import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { suggestionRenderer } from './slash-suggestion-renderer'
import { slashMenuItems } from './slash-menu-items'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        items: ({ query }: { query: string }) => {
          return slashMenuItems.filter((item) => {
            if (!query) return true
            return item.label.toLowerCase().includes(query.toLowerCase())
          })
        },
        command: ({ editor, props }: any) => {
          props.command(editor)
        },
        render: () => suggestionRenderer,
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
