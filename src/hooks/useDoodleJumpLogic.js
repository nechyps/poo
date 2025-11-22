/**
 * Хук для логики игры Doodle Jump
 * Персонаж прыгает по платформам из еды
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const GRAVITY = 0.5
const JUMP_STRENGTH = -12
const PLATFORM_WIDTH = 80
const PLATFORM_HEIGHT = 20
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 50
const INITIAL_LIVES = 3
const PLATFORM_SPAWN_DISTANCE = 150 // Расстояние между платформами

export function useDoodleJumpLogic({ isActive, onGameEnd, onCoinsEarned }) {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [playerY, setPlayerY] = useState(0)
  const [playerVelocity, setPlayerVelocity] = useState(0)
  const [platforms, setPlatforms] = useState([])
  const [cameraY, setCameraY] = useState(0)
  const [jumpCount, setJumpCount] = useState(0) // Счетчик прыжков для монеток
  
  const animationFrameRef = useRef(null)
  const gameStartTimeRef = useRef(0)
  const lastPlatformYRef = useRef(0)
  const playerYRef = useRef(0)
  const velocityRef = useRef(0)

  // Reset game state
  const resetGame = useCallback(() => {
    setScore(0)
    setLives(INITIAL_LIVES)
    setPlatforms([])
    setPlayerY(300) // Начальная позиция игрока
    setPlayerVelocity(0)
    setCameraY(0)
    setJumpCount(0)
    lastPlatformYRef.current = 300
    playerYRef.current = 300
    velocityRef.current = 0
    setIsGameRunning(false)
  }, [])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    setIsGameRunning(true)
    gameStartTimeRef.current = Date.now()
    lastPlatformYRef.current = 300
    
    // Создаем начальные платформы
    const initialPlatforms = []
    for (let i = 0; i < 5; i++) {
      initialPlatforms.push({
        x: Math.random() * (400 - PLATFORM_WIDTH),
        y: 300 - i * PLATFORM_SPAWN_DISTANCE,
        type: Math.floor(Math.random() * 4) // 0-3 для разных типов еды
      })
    }
    setPlatforms(initialPlatforms)
    lastPlatformYRef.current = 300 - 4 * PLATFORM_SPAWN_DISTANCE
  }, [resetGame])

  // Game loop
  useEffect(() => {
    if (!isGameRunning || !isActive) return

    const gameLoop = () => {
      // Обновляем физику
      velocityRef.current += GRAVITY
      playerYRef.current += velocityRef.current

      // Проверяем столкновения с платформами
      const playerBottom = playerYRef.current + PLAYER_HEIGHT
      const playerCenterX = 200 // Центр экрана

      platforms.forEach((platform, index) => {
        const platformTop = platform.y
        const platformBottom = platform.y + PLATFORM_HEIGHT
        const platformLeft = platform.x
        const platformRight = platform.x + PLATFORM_WIDTH

        // Если игрок падает и находится над платформой
        if (
          velocityRef.current > 0 &&
          playerBottom >= platformTop &&
          playerBottom <= platformBottom + 10 &&
          playerCenterX >= platformLeft &&
          playerCenterX <= platformRight
        ) {
          // Прыжок с платформы
          velocityRef.current = JUMP_STRENGTH
          playerYRef.current = platformTop - PLAYER_HEIGHT
          
          // Увеличиваем счетчик прыжков
          const newJumpCount = jumpCount + 1
          setJumpCount(newJumpCount)
          
          // Каждый второй прыжок дает 2 монетки
          if (newJumpCount % 2 === 0) {
            onCoinsEarned?.(2)
            setScore(prev => prev + 10) // Бонус к счету
          } else {
            setScore(prev => prev + 5) // Обычный прыжок
          }
        }
      })

      // Обновляем камеру (следует за игроком вверх)
      if (playerYRef.current < cameraY + 200) {
        setCameraY(playerYRef.current - 200)
      }

      // Генерируем новые платформы
      const highestPlatform = Math.min(...platforms.map(p => p.y))
      if (cameraY - highestPlatform < 500) {
        const newPlatform = {
          x: Math.random() * (400 - PLATFORM_WIDTH),
          y: highestPlatform - PLATFORM_SPAWN_DISTANCE,
          type: Math.floor(Math.random() * 4)
        }
        setPlatforms(prev => [...prev, newPlatform])
      }

      // Удаляем платформы ниже экрана
      setPlatforms(prev => prev.filter(p => p.y < cameraY + 600))

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
  }, [isGameRunning, isActive, platforms, cameraY, lives, score, jumpCount, onGameEnd, onCoinsEarned])

  // Управление (наклон влево/вправо)
  const handleKeyDown = useCallback((e) => {
    if (!isGameRunning) return
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // Движение влево (через изменение позиции платформ относительно игрока)
      setPlatforms(prev => prev.map(p => ({ ...p, x: Math.max(0, p.x - 5) })))
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      // Движение вправо
      setPlatforms(prev => prev.map(p => ({ ...p, x: Math.min(400 - PLATFORM_WIDTH, p.x + 5) })))
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
    platforms,
    cameraY,
    startGame,
    resetGame,
  }
}

