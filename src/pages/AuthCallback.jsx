/**
 * Страница обработки OAuth callback от Google
 * Автоматически обрабатывается Supabase SDK
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../db/supabaseClient'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase автоматически обрабатывает callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Ошибка обработки callback:', error)
          navigate('/?error=auth_failed')
          return
        }

        if (data.session) {
          // Успешная авторизация
          navigate('/')
        } else {
          navigate('/?error=no_session')
        }
      } catch (err) {
        console.error('Ошибка callback:', err)
        navigate('/?error=callback_error')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ fontSize: '24px', color: '#333' }}>Обработка авторизации...</div>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
    </div>
  )
}

