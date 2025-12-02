/**
 * Компонент для отображения информации о пользователе и выхода
 */

import { useAuth } from '../../contexts/AuthContext'
import './UserProfile.css'

export function UserProfile() {
  const { user, userName, userAvatar, signOut, loading, isAuthenticated } = useAuth()

  // Отладка
  console.log('👤 UserProfile render - user:', user?.email || 'null', 'isAuthenticated:', isAuthenticated)

  if (!user) {
    console.log('👤 UserProfile: user is null, не отображаем профиль')
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        {userAvatar && (
          <img 
            src={userAvatar} 
            alt={userName} 
            className="user-avatar"
          />
        )}
        <div className="user-details">
          <div className="user-name">{userName}</div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>
      <button 
        className="user-signout-button"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? 'Выход...' : 'Выйти'}
      </button>
    </div>
  )
}

