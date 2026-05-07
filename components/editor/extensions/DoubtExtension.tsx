'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React from 'react'

function DoubtNodeView({ node }: NodeViewProps) {
  const text = node.attrs['text'] as string ?? ''

  return (
    <NodeViewWrapper as="span" className="inline-block select-none">
      <span
        contentEditable={false}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5"
        style={{
          background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
          color: 'var(--color-warning)',
          border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)',
        }}
      >
        ❓ {text}
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
