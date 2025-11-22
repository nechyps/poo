/**
 * Компонент экрана авторизации
 * Показывается когда пользователь не авторизован
 */

import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AuthButton } from './AuthButton'
import './AuthScreen.css'

export function AuthScreen({ onAuthSuccess, onSkip }) {
  const { isAuthenticated, userId, user, loading: authLoading } = useAuth()

  // Если пользователь авторизовался, вызываем callback
  useEffect(() => {
    console.log('AuthScreen: Auth state', { isAuthenticated, userId, user: user?.email, authLoading })
    if (!authLoading && isAuthenticated && userId && onAuthSuccess) {
      console.log('AuthScreen: User authenticated, calling onAuthSuccess')
      // Небольшая задержка чтобы убедиться что состояние обновилось везде
      setTimeout(() => {
        onAuthSuccess()
      }, 500)
    }
  }, [isAuthenticated, userId, user, authLoading, onAuthSuccess])

  return (
    <div className="auth-screen">
      <div className="auth-screen-content">
        <h1 className="auth-title">Добро пожаловать!</h1>
        <p className="auth-description">
          Войдите с помощью Google, чтобы сохранять прогресс игры и играть на любом устройстве.
        </p>
        <AuthButton />
        {onSkip && (
          <button 
            className="auth-skip-button"
            onClick={onSkip}
          >
            Пропустить и играть без сохранения
          </button>
        )}
        <div className="auth-guest-note">
          <p>💡 Вы можете играть без входа, но прогресс не будет сохраняться</p>
        </div>
      </div>
    </div>
  )
}

