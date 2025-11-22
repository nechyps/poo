/**
 * Хук для логики игры Food Jump
 * Персонаж прыгает по платформам из еды, собирает монетки
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const GRAVITY = 0.5
const JUMP_STRENGTH = -12
const FOOD_WIDTH = 80
const FOOD_HEIGHT = 80
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 50
const INITIAL_LIVES = 3
const FOOD_SPAWN_DISTANCE = 150 // Расстояние между платформами
const COIN_SIZE = 30

export function useFoodJumpLogic({ isActive, onGameEnd, onCoinsEarned }) {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [playerY, setPlayerY] = useState(0)
  const [playerVelocity, setPlayerVelocity] = useState(0)
  const [foods, setFoods] = useState([]) // Платформы из еды
  const [coins, setCoins] = useState([]) // Монетки
  const [cameraY, setCameraY] = useState(0)
  const [jumpCount, setJumpCount] = useState(0) // Счетчик прыжков для монеток
  
  const animationFrameRef = useRef(null)
  const gameStartTimeRef = useRef(0)
  const lastFoodYRef = useRef(0)
  const playerYRef = useRef(0)
  const velocityRef = useRef(0)
  const jumpCountRef = useRef(0)
  const lastPlatformIdRef = useRef(null) // ID последней платформы, с которой прыгнули

  // Reset game state
  const resetGame = useCallback(() => {
    setScore(0)
    setLives(INITIAL_LIVES)
    setFoods([])
    setCoins([])
    setPlayerY(300) // Начальная позиция игрока
    setPlayerVelocity(0)
    setCameraY(0)
    setJumpCount(0)
    lastFoodYRef.current = 300
    playerYRef.current = 300
    velocityRef.current = 0
    jumpCountRef.current = 0
    lastPlatformIdRef.current = null
    setIsGameRunning(false)
  }, [])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    setIsGameRunning(true)
    gameStartTimeRef.current = Date.now()
    lastFoodYRef.current = 300
    
    // Создаем начальные платформы из еды
    const initialFoods = []
    for (let i = 0; i < 5; i++) {
      initialFoods.push({
        id: i,
        x: Math.random() * (400 - FOOD_WIDTH),
        y: 300 - i * FOOD_SPAWN_DISTANCE,
        type: Math.floor(Math.random() * 4) // 0-3 для разных типов еды
      })
    }
    setFoods(initialFoods)
    lastFoodYRef.current = 300 - 4 * FOOD_SPAWN_DISTANCE
  }, [resetGame])

  // Game loop
  useEffect(() => {
    if (!isGameRunning || !isActive) return

    const gameLoop = () => {
      // Обновляем физику
      velocityRef.current += GRAVITY
      playerYRef.current += velocityRef.current
      
      // Сбрасываем ID платформы, если игрок упал ниже всех платформ
      if (foods.length > 0) {
        const lowestFood = Math.max(...foods.map(f => f.y))
        if (playerYRef.current > lowestFood + FOOD_HEIGHT + 50) {
          lastPlatformIdRef.current = null
        }
      }

      // Проверяем столкновения с едой (платформами)
      const playerBottom = playerYRef.current + PLAYER_HEIGHT
      const playerCenterX = 200 // Центр экрана
      const playerLeft = playerCenterX - PLAYER_WIDTH / 2
      const playerRight = playerCenterX + PLAYER_WIDTH / 2

      foods.forEach((food) => {
        const foodTop = food.y
        const foodBottom = food.y + FOOD_HEIGHT
        const foodLeft = food.x
        const foodRight = food.x + FOOD_WIDTH

        // Если игрок падает и находится над платформой
        if (
          velocityRef.current > 0 &&
          playerBottom >= foodTop &&
          playerBottom <= foodTop + 20 &&
          playerRight >= foodLeft &&
          playerLeft <= foodRight &&
          lastPlatformIdRef.current !== food.id // Не прыгаем повторно с той же платформы
        ) {
          // Прыжок с платформы
          velocityRef.current = JUMP_STRENGTH
          playerYRef.current = foodTop - PLAYER_HEIGHT
          lastPlatformIdRef.current = food.id
          
          // Увеличиваем счетчик прыжков
          jumpCountRef.current += 1
          setJumpCount(jumpCountRef.current)
          
          // Каждый второй прыжок создает монетку (но визуально одна, а дает 2 монетки)
          if (jumpCountRef.current % 2 === 0) {
            // Создаем монетку на платформе
            const newCoin = {
              id: Date.now() + Math.random(),
              x: food.x + FOOD_WIDTH / 2 - COIN_SIZE / 2,
              y: food.y - COIN_SIZE - 10,
              collected: false
            }
            setCoins(prev => [...prev, newCoin])
            
            setScore(prev => prev + 10) // Бонус к счету
          } else {
            setScore(prev => prev + 5) // Обычный прыжок
          }
        }
      })

      // Проверяем сбор монеток
      const coinsToRemove = []
      coins.forEach((coin) => {
        if (!coin.collected) {
          const coinCenterX = coin.x + COIN_SIZE / 2
          const coinCenterY = coin.y + COIN_SIZE / 2
          const playerCenterY = playerYRef.current + PLAYER_HEIGHT / 2
          
          const distanceX = Math.abs(playerCenterX - coinCenterX)
          const distanceY = Math.abs(playerCenterY - coinCenterY)
          
          if (distanceX < (PLAYER_WIDTH / 2 + COIN_SIZE / 2) && 
              distanceY < (PLAYER_HEIGHT / 2 + COIN_SIZE / 2)) {
            // Монетка собрана - даем 2 монетки
            coinsToRemove.push(coin.id)
            onCoinsEarned?.(2)
            setScore(prev => prev + 20) // Бонус за монетку
          }
        }
      })
      
      if (coinsToRemove.length > 0) {
        setCoins(prev => prev.filter(c => !coinsToRemove.includes(c.id)))
      }

      // Обновляем камеру (следует за игроком вверх)
      if (playerYRef.current < cameraY + 200) {
        setCameraY(playerYRef.current - 200)
      }

      // Генерируем новые платформы из еды
      const highestFood = Math.min(...foods.map(f => f.y))
      if (cameraY - highestFood < 500) {
        const newFood = {
          id: Date.now(),
          x: Math.random() * (400 - FOOD_WIDTH),
          y: highestFood - FOOD_SPAWN_DISTANCE,
          type: Math.floor(Math.random() * 4)
        }
        setFoods(prev => [...prev, newFood])
      }

      // Удаляем еду и монетки ниже экрана
      setFoods(prev => prev.filter(f => f.y < cameraY + 600))
      setCoins(prev => prev.filter(c => c.y < cameraY + 600))

      // Проверяем проигрыш (игрок упал слишком низко)
      if (playerYRef.current > cameraY + 500) {
        const newLives = lives - 1
        setLives(newLives)
        
        if (newLives <= 0) {
          // Игра окончена
          setIsGameRunning(false)
          onGameEnd?.(score)
        } else {
          // Возвращаем игрока выше
          playerYRef.current = cameraY + 100
          velocityRef.current = 0
        }
      }

      setPlayerY(playerYRef.current)
      setPlayerVelocity(velocityRef.current)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isGameRunning, isActive, foods, coins, cameraY, lives, score, onGameEnd, onCoinsEarned])

  // Управление (наклон влево/вправо)
  const handleKeyDown = useCallback((e) => {
    if (!isGameRunning) return
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // Движение влево (через изменение позиции платформ относительно игрока)
      setFoods(prev => prev.map(f => ({ ...f, x: Math.max(0, f.x - 5) })))
      setCoins(prev => prev.map(c => ({ ...c, x: Math.max(0, c.x - 5) })))
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      // Движение вправо
      setFoods(prev => prev.map(f => ({ ...f, x: Math.min(400 - FOOD_WIDTH, f.x + 5) })))
      setCoins(prev => prev.map(c => ({ ...c, x: Math.min(400 - COIN_SIZE, c.x + 5) })))
    }
  }, [isGameRunning])

  useEffect(() => {
    if (isActive && isGameRunning) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, isGameRunning, handleKeyDown])

  return {
    score,
    lives,
    isGameRunning,
    playerY,
    playerVelocity,
    foods,
    coins,
    cameraY,
    startGame,
    resetGame,
  }
}

