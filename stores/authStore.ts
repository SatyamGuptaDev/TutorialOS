'use client'

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const supabase = getSupabaseBrowserClient()

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    set({
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
      isLoading: false,
    })

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({
        user: newSession?.user ?? null,
        isAuthenticated: !!newSession?.user,
        isLoading: false,
      })
    })
  },

  signIn: async (email, password) => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ isLoading: false })
      // Translate Supabase errors to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Incorrect email or password. Please try again.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please confirm your email before signing in.' }
      }
      return { error: error.message }
    }

    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    })

    return { error: null }
  },

  signUp: async (email, password, name) => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, display_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    set({ isLoading: false })

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists.' }
      }
      return { error: error.message }
    }

    return { error: null }
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },

  sendMagicLink: async (email) => {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) return { error: error.message }
    return { error: null }
  },

  signInWithGoogle: async () => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) return { error: error.message }
    return { error: null }
  },
}))
