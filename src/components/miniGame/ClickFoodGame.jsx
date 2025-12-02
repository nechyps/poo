import { useState, useEffect, useRef } from 'react'
import { useAudio } from '../../hooks/useAudio'
import { usePet } from '../../hooks/usePetSupabase'
import GameOverModal from './GameOverModal'
import './ClickFoodGame.css'
import candies from '../../assets/meal/candies.png'
import dimsam from '../../assets/meal/dimsam.png'
import onigiri from '../../assets/meal/onigiri.png'
import riceWithOmelette from '../../assets/meal/rice_with_omelette.png'
import moneyIcon from '../../assets/hud/money.png'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'

const FOOD_DATA = [
  { image: candies, name: 'Конфетки' },
  { image: dimsam, name: 'Димсам' },
  { image: onigiri, name: 'Онигири' },
  { image: riceWithOmelette, name: 'Рис с омлетом' }
]

const FOOD_IMAGES = FOOD_DATA.map(f => f.image)
const GAME_DURATION = 30000 // 30 seconds
const INITIAL_SPAWN_INTERVAL = 1500
const MIN_SPAWN_INTERVAL = 500
const MAX_LIVES = 3
const INITIAL_FOOD_LIFETIME = 2000 // 2 seconds
const MIN_FOOD_LIFETIME = 500 // minimum 0.5 seconds
const FOOD_LIFETIME_DECREASE = 300 // decrease by 300ms every 7 seconds
const SPEEDUP_INTERVAL = 7000 // every 7 seconds

function ClickFoodGame({ isActive, onGameEnd, onCoinsEarned, onCoinsSpend }) {
  const { pet, savePetStats } = usePet()
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [foods, setFoods] = useState([])
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [forbiddenFood, setForbiddenFood] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const [foodLifetime, setFoodLifetime] = useState(INITIAL_FOOD_LIFETIME)
  const audio = useAudio()
  const gameTimerRef = useRef(null)
  const spawnTimerRef = useRef(null)
  const containerRef = useRef(null)
  const isGameRunningRef = useRef(false)
  const timeLeftRef = useRef(GAME_DURATION / 1000)
  const foodLifetimeRef = useRef(INITIAL_FOOD_LIFETIME)
  const elapsedTimeRef = useRef(0)

  // Load best score from pet data
  useEffect(() => {
    if (pet && pet.clickFoodBestScore !== undefined) {
      const petBestScore = pet.clickFoodBestScore || 0
      if (petBestScore > bestScore) {
        setBestScore(petBestScore)
      }
    }
  }, [pet])

  // Сохраняем best score в Supabase при изменении
  useEffect(() => {
    if (bestScore > 0 && savePetStats && pet) {
      // Проверяем, что это действительно новый рекорд
      const currentBest = pet.clickFoodBestScore || 0
      if (bestScore > currentBest) {
        console.log('💾 Сохранение нового рекорда Click Food:', bestScore)
        savePetStats({ clickFoodBestScore: bestScore }).catch(err => {
          console.error('❌ Ошибка сохранения рекорда:', err)
        })
      }
    }
  }, [bestScore, savePetStats, pet])

  // Sync refs with state
  useEffect(() => {
    isGameRunningRef.current = isGameRunning
  }, [isGameRunning])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    foodLifetimeRef.current = foodLifetime
  }, [foodLifetime])

  // Start game
  const startGame = () => {
    // Выбираем случайную запрещенную еду
    const randomIndex = Math.floor(Math.random() * FOOD_DATA.length)
    setForbiddenFood(FOOD_DATA[randomIndex])
    setScore(0)
    setTimeLeft(GAME_DURATION / 1000)
    setLives(MAX_LIVES)
    setFoods([])
    setFoodLifetime(INITIAL_FOOD_LIFETIME)
    foodLifetimeRef.current = INITIAL_FOOD_LIFETIME
    elapsedTimeRef.current = 0
    setShowWarning(true)
    
    // Показываем предупреждение 3 секунды, затем начинаем игру
    setTimeout(() => {
      setShowWarning(false)
      setIsGameRunning(true)
    }, 3000)
  }

  // Spawn food effect
  useEffect(() => {
    if (!isGameRunning) {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
        spawnTimerRef.current = null
      }
      return
    }

    const spawnFood = () => {
      if (!isGameRunningRef.current) return

      const progress = 1 - (timeLeftRef.current / (GAME_DURATION / 1000))
      const spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        INITIAL_SPAWN_INTERVAL - (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * progress
      )

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const randomFoodIndex = Math.floor(Math.random() * FOOD_DATA.length)
      const newFood = {
        id: Date.now() + Math.random(),
        x: Math.random() * (rect.width - 100),
        y: Math.random() * (rect.height - 200) + 100,
        image: FOOD_DATA[randomFoodIndex].image,
        name: FOOD_DATA[randomFoodIndex].name,
        clicked: false
      }

      setFoods(prev => [...prev, newFood])

      // Remove food after timeout (ускоряется каждые 7 секунд)
      const currentLifetime = foodLifetimeRef.current
      setTimeout(() => {
        setFoods(prev => prev.filter(f => f.id !== newFood.id))
      }, currentLifetime)

      // Schedule next spawn
      spawnTimerRef.current = setTimeout(spawnFood, spawnInterval)
    }

    // Start spawning immediately
    spawnFood()

    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
        spawnTimerRef.current = null
      }
    }
  }, [isGameRunning])

  // Handle food click
  const handleFoodClick = (foodId) => {
    if (!isGameRunning) return

    const clickedFood = foods.find(f => f.id === foodId)
    if (!clickedFood) return

    setFoods(prev => prev.map(f => 
      f.id === foodId ? { ...f, clicked: true } : f
    ))

    // Проверяем, является ли это запрещенной едой
    if (forbiddenFood && clickedFood.name === forbiddenFood.name) {
      // Запрещенная еда - отнимаем деньги и жизнь (БЕЗ ЗВУКА)
      if (onCoinsSpend) {
        onCoinsSpend(2)
      }
      
      setLives(prev => {
        const newLives = prev - 1
        
        if (newLives <= 0) {
          // Игра окончена - потеряны все жизни
          setIsGameRunning(false)
          isGameRunningRef.current = false
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current)
            gameTimerRef.current = null
          }
          if (spawnTimerRef.current) {
            clearTimeout(spawnTimerRef.current)
            spawnTimerRef.current = null
          }
          setScore(currentScore => {
            onGameEnd(currentScore)
            return currentScore
          })
        }
        
        return newLives
      })
      // НЕ играем звук при клике на запрещенную еду
    } else {
      // Правильная еда - добавляем очки и деньги
      setScore(prev => {
        const newScore = prev + 1
        onCoinsEarned(1)
        // Звук играет только один раз при клике на правильную еду
        audio.playClickSound()
        
        if (newScore > bestScore) {
          setBestScore(newScore)
        }
        
        return newScore
      })
    }

    // Remove food
    setTimeout(() => {
      setFoods(prev => prev.filter(f => f.id !== foodId))
    }, 200)
  }

  // Game timer and speedup timer
  useEffect(() => {
    if (!isGameRunning) return

    // Main game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameRunning(false)
          isGameRunningRef.current = false
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current)
            gameTimerRef.current = null
          }
          if (spawnTimerRef.current) {
            clearTimeout(spawnTimerRef.current)
            spawnTimerRef.current = null
          }
          setScore(currentScore => {
            onGameEnd(currentScore)
            return currentScore
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Speedup timer - каждые 7 секунд ускоряем исчезновение еды
    const speedupTimer = setInterval(() => {
      elapsedTimeRef.current += SPEEDUP_INTERVAL
      setFoodLifetime(prev => {
        const newLifetime = Math.max(
          MIN_FOOD_LIFETIME,
          prev - FOOD_LIFETIME_DECREASE
        )
        foodLifetimeRef.current = newLifetime
        return newLifetime
      })
    }, SPEEDUP_INTERVAL)

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (speedupTimer) clearInterval(speedupTimer)
    }
  }, [isGameRunning, score, onGameEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    }
  }, [])

  if (!isActive) return null

  return (
    <div className="click-food-game-container" ref={containerRef}>
      <div className="click-food-game-ui">
        <button className="click-food-close" onClick={() => {
          setIsGameRunning(false)
          isGameRunningRef.current = false
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current)
            gameTimerRef.current = null
          }
          if (spawnTimerRef.current) {
            clearTimeout(spawnTimerRef.current)
            spawnTimerRef.current = null
          }
          onGameEnd(score)
        }}>
          <img src={buttonCross} alt="Закрыть" />
        </button>

        <div className="click-food-stats">
          <div className="click-food-stat">
            <span className="click-food-stat-label">Счёт:</span>
            <span className="click-food-stat-value">{score}</span>
          </div>
          <div className="click-food-stat">
            <span className="click-food-stat-label">Время:</span>
            <span className="click-food-stat-value">{timeLeft}</span>
          </div>
          <div className="click-food-stat">
            <span className="click-food-stat-label">Жизни:</span>
            <span className="click-food-stat-value lives">{lives}</span>
          </div>
          <div className="click-food-stat">
            <span className="click-food-stat-label">Рекорд:</span>
            <span className="click-food-stat-value best">{bestScore}</span>
          </div>
        </div>
      </div>

      <div className="click-food-game-area">
        {showWarning && forbiddenFood && (
          <div className="click-food-warning">
            <h2>⚠️ Внимание!</h2>
            <p className="click-food-warning-text">
              Не нажимай на <strong>{forbiddenFood.name}</strong>!
            </p>
            <div className="click-food-warning-image">
              <img src={forbiddenFood.image} alt={forbiddenFood.name} />
            </div>
            <p className="click-food-warning-desc">
              Если нажмёшь - потеряешь 2 деньги и 1 жизнь
            </p>
            <div className="click-food-warning-lives">
              У тебя {MAX_LIVES} жизни ❤️❤️❤️
            </div>
          </div>
        )}

        {!isGameRunning && !showWarning && (
          <div className="click-food-start">
            <h2>Кликер еды!</h2>
            <p>Кликай на еду как можно быстрее</p>
            <p style={{ fontSize: '14px', color: 'rgba(31, 29, 71, 0.6)', marginTop: '8px' }}>
              Но помни - есть запрещенная еда!
            </p>
            <button className="click-food-start-btn" onClick={startGame}>
              Начать игру
            </button>
          </div>
        )}

        {foods.map((food) => (
          <img
            key={food.id}
            src={food.image}
            alt="Food"
            className={`click-food-item ${food.clicked ? 'clicked' : ''}`}
            style={{
              left: `${food.x}px`,
              top: `${food.y}px`
            }}
            onClick={() => handleFoodClick(food.id)}
          />
        ))}
      </div>

      {!isGameRunning && !showWarning && (score > 0 || lives <= 0) && (
        <GameOverModal
          visible={true}
          score={score}
          bestScore={bestScore}
          onPlayAgain={startGame}
          onExit={() => onGameEnd(score)}
        />
      )}
    </div>
  )
}

export default ClickFoodGame

