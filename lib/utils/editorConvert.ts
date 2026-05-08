/**
 * Editor conversion utilities for TutorialOS.
 *
 * Source of truth: richContent (TipTap JSON).
 *
 * markdownToTipTapContent  — for loading Write-mode text into TipTap
 * tipTapContentToMarkdown  — proper markdown serialization from TipTap JSON
 *   (replaces the broken editor.getText() approach which loses all formatting)
 */

import type { JSONContent } from '@tiptap/core'

// ── TipTap JSON → Markdown ────────────────────────────────────

function marksToMarkdown(text: string, marks?: JSONContent['marks']): string {
  if (!marks || marks.length === 0) return text
  let result = text
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result = `**${result}**`
        break
      case 'italic':
        result = `_${result}_`
        break
      case 'strike':
        result = `~~${result}~~`
        break
      case 'code':
        result = `\`${result}\``
        break
      case 'underline':
        // No native markdown underline; use HTML
        result = `<u>${result}</u>`
        break
      case 'link':
        result = `[${result}](${mark.attrs?.href ?? ''})`
        break
      case 'highlight':
        result = `==${result}==`
        break
      default:
        break
    }
  }
  return result
}

function nodeToMarkdown(node: JSONContent, depth = 0): string {
  const indent = '  '.repeat(depth)

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('\n')

    case 'paragraph':
      if (!node.content || node.content.length === 0) return ''
      return (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('')

    case 'text':
      return marksToMarkdown(node.text ?? '', node.marks)

    case 'hardBreak':
      return '  \n'

    case 'heading': {
      const level = node.attrs?.level ?? 1
      const prefix = '#'.repeat(level) + ' '
      return prefix + (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('')
    }

    case 'bulletList':
      return (node.content ?? [])
        .map((item) => `${indent}- ${nodeToMarkdown(item, depth + 1).trim()}`)
        .join('\n')

    case 'orderedList': {
      return (node.content ?? [])
        .map((item, i) => `${indent}${i + 1}. ${nodeToMarkdown(item, depth + 1).trim()}`)
        .join('\n')
    }

    case 'taskList':
      return (node.content ?? [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' '
          return `${indent}- [${checked}] ${(item.content ?? []).map((n) => nodeToMarkdown(n, depth + 1)).join('').trim()}`
        })
        .join('\n')

    case 'taskItem':
    case 'listItem':
      return (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('\n').trim()

    case 'blockquote': {
      const inner = (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('\n')
      return inner
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    }

    case 'codeBlock': {
      const lang = node.attrs?.language ?? ''
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }

    case 'horizontalRule':
      return '---'

    case 'image':
      return `![${node.attrs?.alt ?? ''}](${node.attrs?.src ?? ''})`

    case 'table': {
      const rows = node.content ?? []
      if (rows.length === 0) return ''
      const headerRow = rows[0]!
      const headerCells = (headerRow.content ?? []).map((cell) =>
        (cell.content ?? []).map((n) => nodeToMarkdown(n)).join('').trim()
      )
      const separator = headerCells.map(() => '---').join(' | ')
      const header = headerCells.join(' | ')
      const bodyRows = rows.slice(1).map((row) =>
        (row.content ?? [])
          .map((cell) => (cell.content ?? []).map((n) => nodeToMarkdown(n)).join('').trim())
          .join(' | ')
      )
      return [header, separator, ...bodyRows].join('\n')
    }

    case 'timestamp': {
      const secs = node.attrs?.timeSeconds ?? 0
      const mm = Math.floor(secs / 60).toString().padStart(2, '0')
      const ss = (secs % 60).toString().padStart(2, '0')
      return `[${mm}:${ss}]`
    }

    case 'callout':
      return `> **${node.attrs?.type ?? 'info'}**: ${(node.content ?? []).map((n) => nodeToMarkdown(n)).join('')}`

    case 'doubt':
      return `> ❓ ${node.attrs?.text ?? ''}`

    case 'commandBlock': {
      const lang = node.attrs?.language ?? 'bash'
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }

    default:
      // Fallback: render children
      return (node.content ?? []).map((n) => nodeToMarkdown(n, depth)).join('')
  }
}

/**
 * Converts a TipTap JSON document to Markdown string.
 * This is the canonical serializer — replaces editor.getText().
 */
export function tipTapContentToMarkdown(doc: JSONContent | null | undefined): string {
  if (!doc) return ''
  const lines = nodeToMarkdown(doc)
    .split('\n')
    .reduce<string[]>((acc, line, i, arr) => {
      // Collapse more than 2 consecutive blank lines
      if (line === '' && arr[i - 1] === '' && arr[i - 2] === '') return acc
      acc.push(line)
      return acc
    }, [])
  return lines.join('\n').trim()
}

// ── Markdown → TipTap JSON ────────────────────────────────────

/**
 * Parse a markdown string into a TipTap-compatible JSON structure.
 * This is a lightweight parser suitable for initial hydration.
 * Complex nested structures (tables, etc.) fall back to paragraphs.
 */
export function markdownToTipTapContent(markdown: string): JSONContent {
  if (!markdown.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }

  const lines = markdown.split('\n')
  const nodes: JSONContent[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1]!.length as 1 | 2 | 3 | 4 | 5 | 6
      nodes.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarkdown(headingMatch[2]!),
      })
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: 'horizontalRule' })
      i++
      continue
    }

    // Fenced code block
    const codeMatch = line.match(/^```(\w*)/)
    if (codeMatch) {
      const lang = codeMatch[1] ?? ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        codeLines.push(lines[i]!)
        i++
      }
      i++ // consume closing ```
      nodes.push({
        type: 'codeBlock',
        attrs: { language: lang || null },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1]!.startsWith('> ')) {
        i++
        quoteLines.push(lines[i]!.slice(2))
      }
      nodes.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInlineMarkdown(quoteLines.join(' ')) }],
      })
      i++
      continue
    }

    // Bullet list item
    const bulletMatch = line.match(/^[-*+]\s+(.+)/)
    if (bulletMatch) {
      const listItems: JSONContent[] = []
      while (i < lines.length) {
        const bm = lines[i]!.match(/^[-*+]\s+(.+)/)
        if (!bm) break
        listItems.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(bm[1]!) }],
        })
        i++
      }
      nodes.push({ type: 'bulletList', content: listItems })
      continue
    }

    // Task list item
    const taskMatch = line.match(/^- \[([ x])\]\s+(.+)/)
    if (taskMatch) {
      const taskItems: JSONContent[] = []
      while (i < lines.length) {
        const tm = lines[i]!.match(/^- \[([ x])\]\s+(.+)/)
        if (!tm) break
        taskItems.push({
          type: 'taskItem',
          attrs: { checked: tm[1] === 'x' },
          content: [{ type: 'paragraph', content: parseInlineMarkdown(tm[2]!) }],
        })
        i++
      }
      nodes.push({ type: 'taskList', content: taskItems })
      continue
    }

    // Ordered list item
    const orderedMatch = line.match(/^\d+\.\s+(.+)/)
    if (orderedMatch) {
      const olItems: JSONContent[] = []
      while (i < lines.length) {
        const om = lines[i]!.match(/^\d+\.\s+(.+)/)
        if (!om) break
        olItems.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(om[1]!) }],
        })
        i++
      }
      nodes.push({ type: 'orderedList', content: olItems })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular paragraph
    nodes.push({
      type: 'paragraph',
      content: parseInlineMarkdown(line),
    })
    i++
  }

  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'paragraph' }],
  }
}

/** Parse inline markdown (bold, italic, code, links) into TipTap text nodes. */
function parseInlineMarkdown(text: string): JSONContent[] {
  const nodes: JSONContent[] = []

  // Simple regex-based parser for common inline marks
  const regex = /(\*\*(.+?)\*\*|_(.+?)_|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)|~~(.+?)~~)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[2] !== undefined) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    } else if (match[3] !== undefined) {
      nodes.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] })
    } else if (match[4] !== undefined) {
      nodes.push({ type: 'text', text: match[4], marks: [{ type: 'italic' }] })
    } else if (match[5] !== undefined) {
      nodes.push({ type: 'text', text: match[5], marks: [{ type: 'code' }] })
    } else if (match[6] !== undefined && match[7] !== undefined) {
      nodes.push({ type: 'text', text: match[6], marks: [{ type: 'link', attrs: { href: match[7] } }] })
    } else if (match[8] !== undefined) {
      nodes.push({ type: 'text', text: match[8], marks: [{ type: 'strike' }] })
    }

    lastIndex = regex.lastIndex
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }]
}
