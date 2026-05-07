'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React, { useState } from 'react'
import { Terminal, Copy, Check } from 'lucide-react'

function CommandBlockNodeView({ node, getPos, editor }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const language = node.attrs['language'] as string ?? 'bash'

  const handleCopy = async () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    const nodeAtPos = editor.state.doc.nodeAt(pos)
    const text = nodeAtPos?.textContent ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper>
      <div
        className="relative rounded-[var(--radius-md)] my-2 overflow-hidden"
        style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {language}
            </span>
          </div>
          <button
            onClick={handleCopy}
            contentEditable={false}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {copied
              ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
              : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Code content */}
        <NodeViewContent
          className="p-3 text-sm font-mono leading-relaxed focus:outline-none overflow-x-auto"
          style={{ color: 'var(--color-text)', margin: 0, display: 'block', whiteSpace: 'pre' }}
        />
      </div>
    </NodeViewWrapper>
  )
}

export const CommandBlockExtension = Node.create({
  name: 'commandBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  code: true,

  addAttributes() {
    return {
      language: { default: 'bash' },
    }
  },

  parseHTML() {
    return [{ tag: 'pre[data-command-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(HTMLAttributes, { 'data-command-block': '' }), ['code', 0]]
  },

  renderText({ node }) {
    return `\`\`\`${node.attrs['language']}\n${node.textContent}\n\`\`\``
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.exitCode(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommandBlockNodeView)
  },
})
