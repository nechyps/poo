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
    
    // 1. Инициализация
    const initializeAuth = async () => {
      try {
        console.log('🔍 Auth Init: Проверка сессии...')
        
        // ПРОВЕРКА ХЕША ВРУЧНУЮ (фикс для localhost)
        // Иногда Supabase auto-detect не срабатывает корректно при редиректах
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
           console.log('🔐 Нашел токены в URL вручную, устанавливаю сессию...')
           const { data, error } = await supabase.auth.setSession({
             access_token: accessToken,
             refresh_token: refreshToken
           })
           
           if (error) {
             console.error('❌ Ошибка ручной установки сессии:', error)
           } else if (data.session) {
             console.log('✅ Сессия установлена вручную:', data.session.user.email)
             if (mounted) {
                setSession(data.session)
                setUser(data.session.user)
             }
           }
           
           // Очищаем URL
           window.history.replaceState(null, '', window.location.pathname)
        } else {
           // Стандартная проверка, если токенов в URL нет
           const { data: { session }, error } = await supabase.auth.getSession()
           
           if (error) {
             console.error('❌ Ошибка получения сессии:', error)
           } else if (session) {
             console.log('✅ Сессия найдена (из хранилища):', session.user.email)
             if (mounted) {
               setSession(session)
               setUser(session.user)
             }
           } else {
             console.log('ℹ️ Сессии нет')
           }
        }

      } catch (err) {
        console.error('❌ Критическая ошибка auth:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    initializeAuth()

    // 2. Слушаем изменения состояния
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event)
      
      if (!mounted) return

      if (session) {
        setSession(session)
        setUser(session.user)
        setError(null)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Вход через Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Формируем правильный redirect URL
      // Важно: этот URL должен быть добавлен в Allow List в настройках Supabase (Authentication -> URL Configuration)
      const redirectTo = window.location.origin
      console.log('🔐 Начинаем вход через Google, redirectTo:', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Ошибка signInWithOAuth:', error)
        throw error
      }
      
      console.log('✅ signInWithOAuth успешно, произойдет редирект')
      // Редирект произойдет автоматически, не сбрасываем loading здесь
      return { success: true, data }
    } catch (err) {
      console.error('❌ Ошибка входа через Google:', err)
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
    // Не устанавливаем loading в false здесь, так как произойдет редирект
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
  
  // Отладка: логируем изменения состояния
  useEffect(() => {
    console.log('🔐 AuthContext state:', {
      user: user?.email || 'null',
      isAuthenticated: !!user,
      loading,
      hasSession: !!session
    })
  }, [user, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

