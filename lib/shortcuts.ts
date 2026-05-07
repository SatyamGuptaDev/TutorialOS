type ShortcutAction = (e: KeyboardEvent) => void

interface Shortcut {
  keys: string[]
  action: ShortcutAction
  preventDefault?: boolean
  description?: string
}

class ShortcutManager {
  private shortcuts: Map<string, Shortcut[]> = new Map()
  private escapeStack: Array<() => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  // Register a global shortcut
  register(combo: string, action: ShortcutAction, preventDefault = true) {
    const keys = combo.toLowerCase().split('+')
    const existing = this.shortcuts.get(combo) || []
    this.shortcuts.set(combo, [...existing, { keys, action, preventDefault }])
    
    return () => {
      const current = this.shortcuts.get(combo) || []
      this.shortcuts.set(combo, current.filter(s => s.action !== action))
    }
  }

  // Push an action to the escape stack (e.g. close modal)
  pushEscapeAction(action: () => void) {
    this.escapeStack.push(action)
    return () => {
      this.escapeStack = this.escapeStack.filter(a => a !== action)
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Handle Escape specifically using the priority stack
    if (e.key === 'Escape' && this.escapeStack.length > 0) {
      e.preventDefault()
      e.stopPropagation()
      const action = this.escapeStack.pop()
      if (action) action()
      return
    }

    // Ignore shortcuts when typing in inputs/textareas, unless it's a meta/ctrl key combo
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (isInput && !e.metaKey && !e.ctrlKey && e.key !== 'Escape') {
      return
    }

    const pressedKeys = new Set<string>()
    if (e.metaKey) pressedKeys.add('meta')
    if (e.ctrlKey) pressedKeys.add('ctrl')
    if (e.altKey) pressedKeys.add('alt')
    if (e.shiftKey) pressedKeys.add('shift')
    
    // Convert e.key to lowercase, handle special cases
    let key = e.key.toLowerCase()
    if (key === 'escape') key = 'esc'
    if (!['meta', 'control', 'alt', 'shift'].includes(key)) {
      pressedKeys.add(key)
    }

    // Find matching shortcuts
    for (const [combo, handlers] of this.shortcuts.entries()) {
      const comboKeys = new Set(combo.toLowerCase().split('+'))
      
      // Check if pressedKeys exactly matches comboKeys
      if (pressedKeys.size === comboKeys.size && [...pressedKeys].every(k => comboKeys.has(k))) {
        for (const handler of handlers) {
          if (handler.preventDefault) e.preventDefault()
          handler.action(e)
        }
      }
    }
  }
}

// Export singleton instance
export const shortcuts = new ShortcutManager()
