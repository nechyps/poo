/**
 * Компонент экрана авторизации
 * Показывается когда пользователь не авторизован
 */

import { AuthButton } from './AuthButton'
import './AuthScreen.css'

export function AuthScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-screen-content">
        <h1 className="auth-title">Добро пожаловать!</h1>
        <p className="auth-description">
          Войдите с помощью Google, чтобы сохранять прогресс игры и играть на любом устройстве.
        </p>
        <AuthButton />
        <div className="auth-guest-note">
          <p>💡 Вы можете играть без входа, но прогресс не будет сохраняться</p>
        </div>
      </div>
    </div>
  )
}

