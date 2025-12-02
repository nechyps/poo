import { useState, useEffect, useCallback, useRef } from 'react'
import { useStats } from '../../hooks/useStats'
import { useCharacter } from '../../hooks/useCharacter'
import { useCoins } from '../../hooks/useCoins'
import { usePet } from '../../hooks/usePetSupabase'
import Character from '../Character/Character'
import Stats from '../Stats/Stats'
import ActionButtons from '../ActionButtons/ActionButtons'
import Menu from '../Menu/Menu'
import Food from '../Food/Food'
import Message from '../Message/Message'
import PlayButton from '../miniGame/PlayButton'
import CatchFoodGame from '../miniGame/CatchFoodGame'
import ClickFoodGame from '../miniGame/ClickFoodGame'
import GameSelector from '../miniGame/GameSelector'
import './Game.css'
import gameBackground from '../../assets/rooms/background.png'
import nightBackground from '../../assets/rooms/night_background.PNG'
import buttonBurger from '../../assets/hud/buttons/button_burger.PNG'
import candies from '../../assets/meal/candies.png'
import dimsam from '../../assets/meal/dimsam.png'
import onigiri from '../../assets/meal/onigiri.png'
import riceWithOmelette from '../../assets/meal/rice_with_omelette.png'

const MEALS = [
  { id: 1, image: candies, name: 'candies' },
  { id: 2, image: dimsam, name: 'dimsam' },
  { id: 3, image: onigiri, name: 'onigiri' },
  { id: 4, image: riceWithOmelette, name: 'rice_with_omelette' }
]

const MESSAGES = {
  feed: [
    'Вкусно!', 'Вкуснятина!', 'Спасибо!', 'Ммм...', 
    'Объедение!', 'Так вкусно!', 'Ням-ням!', 'Спасибо за еду!',
    'Это моё любимое!', 'Как аппетитно!', 'Восхитительно!', 'Обожаю!'
  ],
  sleep: [
    'Спокойной ночи...', 'Хррр...', 'Сонно...', 
    'Хочу спать...', 'Устал...', 'Пора отдохнуть...',
    'Сладких снов...', 'Зевает...', 'Глазки закрываются...', 'Так устал...'
  ],
  play: [
    'Ура!', 'Весело!', 'Уиии!', 
    'Как здорово!', 'Это весело!', 'Давай ещё!', 'Круто!',
    'Обожаю играть!', 'Вот это да!', 'Невероятно!', 'Супер!'
  ],
  clean: [
    'Свежо!', 'Чисто!', 'Ах...', 
    'Как приятно!', 'Спасибо!', 'Теперь хорошо!', 'Чистенько!',
    'Блестит!', 'Ароматно!', 'Так свежо!', 'Отлично!'
  ],
  hungry: [
    'Я голоден!', 'Покорми меня!', 'Голодный...', 
    'Хочу есть!', 'Живот урчит...', 'Очень голоден!', 'Нужна еда!',
    'Покорми, пожалуйста!', 'Голод как волк!', 'Есть хочу!', 'Жрать охота!'
  ],
  tired: [
    'Я устал!', 'Нужен сон...', 'Сонный...', 
    'Силы на исходе...', 'Хочу спать!', 'Очень устал...', 'Нет сил...',
    'Глаза слипаются...', 'Нужен отдых...', 'Усталость...', 'Пора в кровать...'
  ],
  sad: [
    'Мне грустно...', 'Помоги мне...', 'Плохо себя чувствую...', 
    'Не очень хорошо...', 'Грустно...', 'Плохое настроение...', 'Тоскливо...',
    'Нужна помощь...', 'Не весело...', 'Печально...', 'Хочется внимания...'
  ],
  happy: [
    'Счастлив!', 'Отлично!', 'Замечательно!', 
    'Прекрасно!', 'Всё супер!', 'Жизнь удалась!', 'Как хорошо!',
    'Всё отлично!', 'Настроение на высоте!', 'Радостно!', 'Всё замечательно!'
  ]
}

function Game({ onLogout, audio }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentBackground, setCurrentBackground] = useState(gameBackground)
  const [backgroundKey, setBackgroundKey] = useState(0) // Ключ для принудительного обновления
  const [selectedFood, setSelectedFood] = useState(null)
  const [isFoodFlying, setIsFoodFlying] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('') // Отдельное состояние для ошибок
  const [isNightMode, setIsNightMode] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true) // Всегда показываем кнопку
  const [isMiniGameActive, setIsMiniGameActive] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null) // 'catch-food' or 'click-food'
  const [showGameSelector, setShowGameSelector] = useState(false)

  const { stats, performAction, getMood, getHealthLevel, isLoading: statsLoading, error: statsError } = useStats()
  const { currentImage, currentState, isAnimating, setMood, performAction: performCharacterAction, resetToNormal } = useCharacter()
  const { coins, addCoins, spendCoins } = useCoins()
  const { manualSave, manualLoad, formatLastSaveTime, error: petError, isLoading: petLoading, savePetStats, pet } = usePet()
  const [saveMessage, setSaveMessage] = useState('')

  const showMessage = useCallback((text) => {
    setMessage(text)
    setTimeout(() => {
      setMessage('')
    }, 3000)
  }, [])

  const showErrorMessage = useCallback((text) => {
    setErrorMessage(text)
    setTimeout(() => {
      setErrorMessage('')
    }, 4000) // Ошибки показываются чуть дольше
  }, [])

  const handleSave = useCallback(async () => {
    const result = await manualSave()
    if (result.success) {
      setSaveMessage(result.message)
      setTimeout(() => setSaveMessage(''), 2000)
    } else {
      setSaveMessage(result.message || 'Ошибка сохранения')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }, [manualSave])

  const handleLoad = useCallback(async () => {
    const result = await manualLoad()
    if (result.success) {
      setSaveMessage(result.message)
      setTimeout(() => setSaveMessage(''), 2000)
      // Перезагружаем страницу для применения изменений
      window.location.reload()
    } else {
      setSaveMessage(result.message || 'Ошибка загрузки')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }, [manualLoad])

  // Update character mood based on stats (freeze when mini-game is active)
  useEffect(() => {
    if (!isAnimating && !isMiniGameActive) {
      const mood = getMood()
      setMood(mood)
    }
  }, [stats, getMood, setMood, isAnimating, isMiniGameActive])

  // Show messages based on stats (less frequently, freeze when mini-game is active)
  useEffect(() => {
    if (isAnimating || isMiniGameActive) return

    const mood = getMood()
    const { hunger, energy, happiness } = stats

    // Only show messages occasionally, not on every stat change
    const shouldShowMessage = Math.random() < 0.1 // 10% chance

    if (shouldShowMessage) {
      if (hunger < 20) {
        showMessage(MESSAGES.hungry[Math.floor(Math.random() * MESSAGES.hungry.length)])
      } else if (energy < 20) {
        showMessage(MESSAGES.tired[Math.floor(Math.random() * MESSAGES.tired.length)])
      } else if (happiness < 20) {
        showMessage(MESSAGES.sad[Math.floor(Math.random() * MESSAGES.sad.length)])
      } else if (mood === 'happy' && Math.random() < 0.3) {
        const happyMessages = MESSAGES.happy
        showMessage(happyMessages[Math.floor(Math.random() * happyMessages.length)])
      }
    }
  }, [stats, getMood, isAnimating, showMessage, isMiniGameActive])

  const handleBurgerClick = () => {
    audio.playClickSound()
    setIsMenuOpen(true)
  }

  const handleCloseMenu = () => {
    audio.playClickSound()
    setIsMenuOpen(false)
  }

  // Обертка для onLogout с сохранением данных
  const handleLogoutWithSave = async () => {
    // Сохраняем данные перед выходом
    if (pet && savePetStats) {
      try {
        console.log('💾 Сохранение данных перед выходом...')
        await savePetStats({
          hunger: stats.hunger,
          happiness: stats.happiness,
          energy: stats.energy,
          cleanliness: stats.cleanliness,
          health: stats.health,
          coins: coins,
          catchFoodBestScore: pet.catchFoodBestScore || 0,
          clickFoodBestScore: pet.clickFoodBestScore || 0,
        })
        console.log('✅ Данные сохранены перед выходом')
      } catch (err) {
        console.error('❌ Ошибка сохранения при выходе:', err)
      }
    }
    // Вызываем оригинальный onLogout
    onLogout()
  }

  const handleHouseClick = () => {
    audio.playClickSound()
    if (isMiniGameActive) {
      // If mini-game is active, just reset background
      setCurrentBackground(gameBackground)
      setIsNightMode(false)
      setBackgroundKey(prev => prev + 1) // Принудительное обновление изображения
      return
    }
    // Reset to day background
    setCurrentBackground(gameBackground)
    setIsNightMode(false)
    setBackgroundKey(prev => prev + 1) // Принудительное обновление изображения
    resetToNormal()
  }

  const handlePlayButtonClick = () => {
    audio.playClickSound()
    setShowGameSelector(true)
  }

  const handleSelectGame = (gameId) => {
    audio.playClickSound()
    setShowGameSelector(false)
    setSelectedGame(gameId)
    setIsMiniGameActive(true)
  }

  const handleMiniGameEnd = useCallback((finalScore) => {
    setIsMiniGameActive(false)
    setSelectedGame(null)
    // Optionally reward player based on score
    if (finalScore > 0) {
      performAction('play') // Increase happiness
      showMessage(`Отлично! Счёт: ${finalScore}`)
    }
  }, [performAction, showMessage])

  const handleMealClick = () => {
    if (isAnimating) return
    
    audio.playClickSound()
    
    // Check if player has enough coins
    if (coins < 20) {
      showErrorMessage("Недостаточно денег! Нужно 20 денег для кормления.")
      return
    }
    
    // Spend coins
    spendCoins(20)
    
    // Select random meal
    const randomMeal = MEALS[Math.floor(Math.random() * MEALS.length)]
    setSelectedFood(randomMeal)
    setIsFoodFlying(true)
    
    // Update stats immediately to ensure they are saved even if user exits
    performAction('feed')
    showMessage(MESSAGES.feed[Math.floor(Math.random() * MESSAGES.feed.length)])
    
    // Perform character animation
    performCharacterAction('feed', () => {
      // Animation complete
    })
    
    // Reset food after animation
    setTimeout(() => {
      setIsFoodFlying(false)
      setTimeout(() => {
        setSelectedFood(null)
      }, 500)
    }, 1800)
  }

  const handleToiletClick = () => {
    if (isAnimating) return
    
    audio.playClickSound()
    
    // Update stats immediately
    performAction('clean')
    showMessage(MESSAGES.clean[Math.floor(Math.random() * MESSAGES.clean.length)])
    
    performCharacterAction('clean', () => {
      // Animation complete
    })
  }

  const handleSleepClick = () => {
    if (isAnimating) return
    
    audio.playClickSound()
    
    // Сначала меняем фон, затем выполняем действие
    setCurrentBackground(nightBackground)
    setIsNightMode(true)
    setBackgroundKey(prev => prev + 1) // Принудительное обновление изображения
    
    // Update stats immediately
    performAction('sleep')
    showMessage(MESSAGES.sleep[Math.floor(Math.random() * MESSAGES.sleep.length)])
    
    performCharacterAction('sleep', () => {
      // Auto wake up after 5 seconds
      setTimeout(() => {
        setCurrentBackground(gameBackground)
        setIsNightMode(false)
        setBackgroundKey(prev => prev + 1) // Принудительное обновление изображения
        resetToNormal()
      }, 5000)
    })
  }

  // Не рендерим игру до загрузки данных
  if (statsLoading || petLoading) {
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
              }}>Загрузка игры...</div>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="content">
            <img 
              key={`bg-${backgroundKey}-${isNightMode ? 'night' : 'day'}`}
              src={currentBackground} 
              alt={isNightMode ? "Night Background" : "Game Background"} 
              className="game-background" 
            />
            
            {/* Burger Menu Button */}
            <button 
              className="burger-button" 
              onClick={handleBurgerClick}
              aria-label="Menu"
            >
              <img 
                src={buttonBurger} 
                alt="" 
              />
            </button>
            
            {/* Menu */}
            {isMenuOpen && (
              <Menu 
                onClose={handleCloseMenu} 
                onLogout={handleLogoutWithSave}
                isMusicOn={audio.isMusicOn}
                isSfxOn={audio.isSfxOn}
                musicVolume={audio.musicVolume}
                sfxVolume={audio.sfxVolume}
                onMusicToggle={audio.toggleMusic}
                onSfxToggle={audio.toggleSfx}
                onMusicVolumeChange={audio.setMusicVolume}
                onSfxVolumeChange={audio.setSfxVolume}
                playClickSound={audio.playClickSound}
                onSave={handleSave}
                onLoad={handleLoad}
                lastSaveTime={formatLastSaveTime()}
              />
            )}
            
            {/* Stats Bar */}
            <Stats
              stats={stats}
              healthLevel={getHealthLevel()}
              coins={coins}
            />

            {/* Character */}
            <Character 
              image={currentImage} 
              state={currentState}
              isAnimating={isAnimating}
            />

            {/* Food */}
            <Food image={selectedFood?.image} isFlying={isFoodFlying} />

            {/* Message */}
            <Message text={message} visible={!!message} />
            
            {/* Error Message - поверх всего */}
            <Message text={errorMessage} visible={!!errorMessage} isError={true} />
            
            {/* Save/Load Message */}
            {saveMessage && (
              <Message text={saveMessage} visible={!!saveMessage} />
            )}

            {/* Loading indicator */}
            {(statsLoading || petLoading) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                zIndex: 100
              }}>
                Загрузка игры...
              </div>
            )}

            {/* Error indicator */}
            {(petError || statsError) && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 0, 0, 0.8)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '10px',
                zIndex: 100,
                fontSize: '12px',
                maxWidth: '90%',
                textAlign: 'center'
              }}>
                Ошибка: {petError || statsError}
              </div>
            )}

            {/* Action Buttons */}
            <ActionButtons
              onHouseClick={handleHouseClick}
              onMealClick={handleMealClick}
              onToiletClick={handleToiletClick}
              onSleepClick={handleSleepClick}
              disabled={isAnimating || isMiniGameActive}
            />

            {/* Play Button for Mini-Game */}
            <PlayButton 
              onClick={handlePlayButtonClick}
              visible={showPlayButton && !isMiniGameActive}
            />

            {/* Game Selector */}
            <GameSelector
              visible={showGameSelector}
              onSelectGame={handleSelectGame}
              onClose={() => setShowGameSelector(false)}
            />

            {/* Mini-Games */}
            <CatchFoodGame
              isActive={isMiniGameActive && selectedGame === 'catch-food'}
              onGameEnd={handleMiniGameEnd}
              onCoinsEarned={addCoins}
            />
            
            <ClickFoodGame
              isActive={isMiniGameActive && selectedGame === 'click-food'}
              onGameEnd={handleMiniGameEnd}
              onCoinsEarned={addCoins}
              onCoinsSpend={spendCoins}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game

