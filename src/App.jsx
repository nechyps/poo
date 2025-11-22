import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useAudio } from './hooks/useAudio'
import Game from './components/Game/Game'
import { AuthScreen } from './components/Auth/AuthScreen'
import './App.css'
import menuBackground from './assets/rooms/menu_background.PNG'
import startButton from './assets/hud/buttons/button_start.PNG'

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [isGameStarted, setIsGameStarted] = useState(false)
  const audio = useAudio()

  // Обработка OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      if (hashParams.get('access_token')) {
        // OAuth callback обрабатывается автоматически Supabase
        // Очищаем hash из URL
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    handleAuthCallback()
  }, [])

  const handleStartClick = () => {
    audio.playClickSound()
    setIsGameStarted(true)
  }

  const handleLogout = () => {
    audio.playClickSound()
    setIsGameStarted(false)
  }

  // Показываем загрузку при проверке аутентификации
  if (authLoading) {
    return (
      <div className="app-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                fontSize: '24px',
                color: '#333'
              }}>Загрузка...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Показываем экран авторизации (опционально, можно убрать для гостевого режима)
  // Для гостевого режима закомментируйте эту проверку
  // if (!isAuthenticated) {
  //   return <AuthScreen />
  // }

  if (isGameStarted) {
    return <Game onLogout={handleLogout} />
  }

  return (
    <div className="app-container">
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="content">
            <img 
              src={menuBackground} 
              alt="Menu Background" 
              className="menu-background" 
            />
            <div className="buttons-container">
              <img 
                src={startButton} 
                alt="Start Game" 
                className="start-button"
                onClick={handleStartClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
