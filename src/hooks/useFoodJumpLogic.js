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
  const foodsRef = useRef([]) // Ref для актуальных foods
  const coinsRef = useRef([]) // Ref для актуальных coins
  const cameraYRef = useRef(0) // Ref для актуальной cameraY
  const livesRef = useRef(INITIAL_LIVES) // Ref для актуальных lives
  const scoreRef = useRef(0) // Ref для актуального score

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
    foodsRef.current = []
    coinsRef.current = []
    cameraYRef.current = 0
    livesRef.current = INITIAL_LIVES
    scoreRef.current = 0
    setIsGameRunning(false)
  }, [])

  // Start game
  const startGame = useCallback(() => {
    // Сбрасываем состояние игры
    setScore(0)
    setLives(INITIAL_LIVES)
    setFoods([])
    setCoins([])
    setPlayerY(300)
    setPlayerVelocity(0)
    setCameraY(0)
    setJumpCount(0)
    lastFoodYRef.current = 300
    playerYRef.current = 300
    velocityRef.current = 0
    jumpCountRef.current = 0
    lastPlatformIdRef.current = null
    foodsRef.current = []
    coinsRef.current = []
    cameraYRef.current = 0
    livesRef.current = INITIAL_LIVES
    scoreRef.current = 0
    
    setIsGameRunning(true)
    gameStartTimeRef.current = Date.now()
    
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
    foodsRef.current = initialFoods
    lastFoodYRef.current = 300 - 4 * FOOD_SPAWN_DISTANCE
  }, [])

  // Синхронизируем refs с state
  useEffect(() => {
    foodsRef.current = foods
  }, [foods])
  
  useEffect(() => {
    coinsRef.current = coins
  }, [coins])
  
  useEffect(() => {
    cameraYRef.current = cameraY
  }, [cameraY])
  
  useEffect(() => {
    livesRef.current = lives
  }, [lives])
  
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  // Game loop
  useEffect(() => {
    if (!isGameRunning || !isActive) return

    const gameLoop = () => {
      // Получаем актуальные значения из refs
      const currentFoods = foodsRef.current
      const currentCoins = coinsRef.current
      const currentCameraY = cameraYRef.current
      const currentLives = livesRef.current
      const currentScore = scoreRef.current
      
      // Обновляем физику
      velocityRef.current += GRAVITY
      playerYRef.current += velocityRef.current
      
      // Сбрасываем ID платформы, если игрок упал ниже всех платформ
      if (currentFoods && currentFoods.length > 0) {
        const lowestFood = Math.max(...currentFoods.map(f => f.y))
        if (playerYRef.current > lowestFood + FOOD_HEIGHT + 50) {
          lastPlatformIdRef.current = null
        }
      }

      // Проверяем столкновения с едой (платформами)
      const playerBottom = playerYRef.current + PLAYER_HEIGHT
      const playerCenterX = 200 // Центр экрана
      const playerLeft = playerCenterX - PLAYER_WIDTH / 2
      const playerRight = playerCenterX + PLAYER_WIDTH / 2

      if (currentFoods && Array.isArray(currentFoods)) {
        currentFoods.forEach((food) => {
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
            const newCoins = [...coinsRef.current, newCoin]
            coinsRef.current = newCoins
            setCoins(newCoins)
            
            scoreRef.current += 10
            setScore(scoreRef.current) // Бонус к счету
          } else {
            scoreRef.current += 5
            setScore(scoreRef.current) // Обычный прыжок
          }
        }
      })
      }

      // Проверяем сбор монеток
      const coinsToRemove = []
      if (currentCoins && Array.isArray(currentCoins)) {
        currentCoins.forEach((coin) => {
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
            scoreRef.current += 20
            setScore(scoreRef.current) // Бонус за монетку
          }
          }
        })
      }
      
      if (coinsToRemove.length > 0) {
        const newCoins = coinsRef.current.filter(c => !coinsToRemove.includes(c.id))
        coinsRef.current = newCoins
        setCoins(newCoins)
      }

      // Обновляем камеру (следует за игроком вверх)
      if (playerYRef.current < currentCameraY + 200) {
        cameraYRef.current = playerYRef.current - 200
        setCameraY(cameraYRef.current)
      }

      // Генерируем новые платформы из еды
      if (currentFoods && currentFoods.length > 0) {
        const highestFood = Math.min(...currentFoods.map(f => f.y))
        if (currentCameraY - highestFood < 500) {
          const newFood = {
            id: Date.now(),
            x: Math.random() * (400 - FOOD_WIDTH),
            y: highestFood - FOOD_SPAWN_DISTANCE,
            type: Math.floor(Math.random() * 4)
          }
          const newFoods = [...currentFoods, newFood]
          foodsRef.current = newFoods
          setFoods(newFoods)
        }
      }

      // Удаляем еду и монетки ниже экрана
      if (currentFoods && Array.isArray(currentFoods)) {
        const filteredFoods = currentFoods.filter(f => f.y < currentCameraY + 600)
        if (filteredFoods.length !== currentFoods.length) {
          foodsRef.current = filteredFoods
          setFoods(filteredFoods)
        }
      }
      
      if (currentCoins && Array.isArray(currentCoins)) {
        const filteredCoins = currentCoins.filter(c => c.y < currentCameraY + 600)
        if (filteredCoins.length !== currentCoins.length) {
          coinsRef.current = filteredCoins
          setCoins(filteredCoins)
        }
      }

      // Проверяем проигрыш (игрок упал слишком низко)
      if (playerYRef.current > currentCameraY + 500) {
        livesRef.current -= 1
        const newLives = livesRef.current
        setLives(newLives)
        
        if (newLives <= 0) {
          // Игра окончена
          setIsGameRunning(false)
          onGameEnd?.(scoreRef.current)
        } else {
          // Возвращаем игрока выше
          playerYRef.current = currentCameraY + 100
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
  }, [isGameRunning, isActive, onGameEnd, onCoinsEarned])

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

