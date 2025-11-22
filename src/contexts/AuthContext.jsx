/**
 * Контекст аутентификации для работы с Google OAuth через Supabase
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../db/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Проверка текущей сессии при загрузке
  useEffect(() => {
    let mounted = true
    
    // Получаем текущую сессию
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return
        
        if (error) {
          console.error('Ошибка получения сессии:', error)
          setError(error.message)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        console.error('Критическая ошибка при получении сессии:', err)
        setError('Не удалось подключиться к серверу авторизации')
        setLoading(false)
      })

    // Слушаем изменения состояния аутентификации
    let subscription = null
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      subscription = sub
    } catch (err) {
      console.error('Ошибка подписки на изменения auth:', err)
      setLoading(false)
    }

    return () => {
      mounted = false
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (err) {
          console.error('Ошибка отписки:', err)
        }
      }
    }
  }, [])

  // Вход через Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
      
      // Редирект произойдет автоматически
      return { success: true, data }
    } catch (err) {
      console.error('Ошибка входа через Google:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Выход
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      
      return { success: true }
    } catch (err) {
      console.error('Ошибка выхода:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.full_name || user?.email?.split('@')[0],
    userAvatar: user?.user_metadata?.avatar_url,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

