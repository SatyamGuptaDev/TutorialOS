import type { AIProvider, AIConfig } from '@/types'

interface CompleteParams {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export class AIClient {
  constructor(private config: AIConfig) {}

  async complete(params: CompleteParams): Promise<string> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      let result = ''
      switch (this.config.provider) {
        case 'openai':
          result = await this.callOpenAI(params, controller.signal)
          break
        case 'gemini':
          result = await this.callGemini(params, controller.signal)
          break
        case 'groq':
          result = await this.callGroq(params, controller.signal)
          break
        case 'claude':
          result = await this.callClaude(params, controller.signal)
          break
        case 'mistral':
          result = await this.callMistral(params, controller.signal)
          break
        default:
          throw new Error('Unsupported provider')
      }

      clearTimeout(timeoutId)
      return result
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return 'Error: Request timed out after 30 seconds.'
      }
      if (e.message?.includes('401')) {
        return 'Error: Invalid API key. Please check your settings.'
      }
      if (e.message?.includes('429')) {
        return 'Error: Rate limit exceeded. Please try again later.'
      }
      return `Error: ${e.message}`
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.complete({
        prompt: 'Say OK',
        systemPrompt: 'You are a test bot. Reply with exactly two letters: OK.',
        maxTokens: 5,
        temperature: 0,
      })

      if (result.startsWith('Error:')) {
        return { success: false, error: result }
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  private async callOpenAI(params: CompleteParams, signal: AbortSignal): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: [
          ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
          { role: 'user', content: params.prompt },
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
      }),
      signal,
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.choices[0].message.content
  }

  private async callGemini(params: CompleteParams, signal: AbortSignal): Promise<string> {
    const model = this.config.model || 'gemini-2.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`
    
    const body: any = {
      contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
      generationConfig: {
        maxOutputTokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
      },
    }

    if (params.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: params.systemPrompt }],
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.candidates[0].content.parts[0].text
  }

  private async callGroq(params: CompleteParams, signal: AbortSignal): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'llama-3.3-70b-versatile',
        messages: [
          ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
          { role: 'user', content: params.prompt },
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
      }),
      signal,
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.choices[0].message.content
  }

  private async callClaude(params: CompleteParams, signal: AbortSignal): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature ?? 0.7,
      }),
      signal,
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.content[0].text
  }

  private async callMistral(params: CompleteParams, signal: AbortSignal): Promise<string> {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'mistral-large-latest',
        messages: [
          ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
          { role: 'user', content: params.prompt },
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
      }),
      signal,
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.choices[0].message.content
  }
}
