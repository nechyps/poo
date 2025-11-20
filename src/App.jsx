import { useState } from 'react'
import { useAudio } from './hooks/useAudio'
import Game from './components/Game/Game'
import './App.css'
import menuBackground from './assets/rooms/menu_background.PNG'
import startButton from './assets/hud/buttons/button_start.PNG'

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false)
  const audio = useAudio()

  const handleStartClick = () => {
    audio.playClickSound()
    setIsGameStarted(true)
  }

  const handleLogout = () => {
    audio.playClickSound()
    setIsGameStarted(false)
  }

  if (isGameStarted) {
    return <Game onLogout={handleLogout} />
  }

  return (
    <div className="app-container">
      <div className="phone-frame">
        <div className="phone-notch"></div>
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
        <div className="phone-bottom-bar"></div>
      </div>
    </div>
  )
}

export default App
