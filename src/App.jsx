import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useAudio } from './hooks/useAudio'
import Game from './components/Game/Game'
import { AuthScreen } from './components/Auth/AuthScreen'
import './App.css'
import menuBackground from './assets/rooms/menu_background.PNG'
import startButton from './assets/hud/buttons/button_start.PNG'

function App() {
  const { isAuthenticated, loading: authLoading, error: authError } = useAuth()
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const audio = useAudio()

  // Если критическая ошибка авторизации, показываем предупреждение но продолжаем работу
  useEffect(() => {
    if (authError) {
      console.warn('⚠️ Ошибка авторизации:', authError)
      console.warn('⚠️ Игра работает в гостевом режиме.')
    }
  }, [authError])

  // Обработка OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      if (hashParams.get('access_token')) {
        // OAuth callback обрабатывается автоматически Supabase
        // После успешной авторизации запускаем игру
        setTimeout(() => {
          setShowAuthScreen(false)
          setIsGameStarted(true)
        }, 1000)
        // Очищаем hash из URL
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    handleAuthCallback()
  }, [])

  const handleStartClick = () => {
    audio.playClickSound()
    
    // Запускаем музыку при нажатии кнопки старт
    if (audio.startMusic) {
      audio.startMusic()
    }
    
    // Если пользователь не авторизован, показываем экран авторизации
    if (!isAuthenticated && !authLoading) {
      setShowAuthScreen(true)
    } else {
      // Если авторизован, сразу запускаем игру
      setIsGameStarted(true)
    }
  }

  const handleLogout = () => {
    audio.playClickSound()
    // Останавливаем музыку при выходе из игры (но не меняем настройку)
    if (audio.stopMusic) {
      audio.stopMusic()
    }
    setIsGameStarted(false)
    setShowAuthScreen(false)
  }

  const handleAuthSuccess = () => {
    // После успешной авторизации запускаем игру
    audio.playClickSound()
    // Запускаем музыку при старте игры
    if (audio.startMusic) {
      audio.startMusic()
    }
    setShowAuthScreen(false)
    setIsGameStarted(true)
  }

  const handleSkipAuth = () => {
    // Пропускаем авторизацию и запускаем игру в гостевом режиме
    audio.playClickSound()
    // Запускаем музыку при старте игры
    if (audio.startMusic) {
      audio.startMusic()
    }
    setShowAuthScreen(false)
    setIsGameStarted(true)
  }

  // Показываем загрузку только при первой проверке аутентификации
  if (authLoading && !isGameStarted && !showAuthScreen) {
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

  // Показываем экран авторизации после нажатия Start, если не авторизован
  if (showAuthScreen && !isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} onSkip={handleSkipAuth} />
  }

  // Показываем игру если начата
  if (isGameStarted) {
    return <Game onLogout={handleLogout} audio={audio} />
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
