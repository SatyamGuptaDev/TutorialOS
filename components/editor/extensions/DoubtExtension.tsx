'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React from 'react'

import { HelpCircle } from 'lucide-react'

function DoubtNodeView({ node, updateAttributes }: NodeViewProps) {
  const text = node.attrs['text'] as string ?? ''

  const handleEdit = () => {
    const newText = window.prompt('Edit your doubt:', text)
    if (newText !== null) updateAttributes({ text: newText })
  }

  return (
    <NodeViewWrapper as="span" className="inline-block select-none">
      <span
        onClick={handleEdit}
        contentEditable={false}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5 cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--color-warning)_25%,transparent)]"
        style={{
          background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
          color: 'var(--color-warning)',
          border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)',
        }}
        title="Click to edit doubt"
      >
        <HelpCircle className="h-3 w-3" /> {text || 'Doubt'}
      </span>
    </NodeViewWrapper>
  )
}

export const DoubtExtension = Node.create({
  name: 'doubt',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: { default: '' },
      timestampSeconds: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-doubt]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-doubt': '' }), 0]
  },

  renderText({ node }) {
    return `:::doubt\n${node.attrs['text']}\n:::`
  },

  addNodeView() {
    return ReactNodeViewRenderer(DoubtNodeView)
  },
})
