import { useState, useEffect, useRef, useCallback } from 'react'

const INITIAL_FALL_SPEED = 1 // Reduced by 2x (was 2)
const INITIAL_SPAWN_INTERVAL = 1500 // ms
const SPEED_INCREASE = 0.25 // Reduced proportionally (was 0.5)
const SPAWN_RATE_DECREASE = 100 // ms
const INITIAL_LIVES = 3

export function useCatchFoodLogic({ isActive, onGameEnd, onCatch, onCoinsEarned, initialBestScore = 0, onBestScoreUpdate }) {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [playerX, setPlayerX] = useState(50) // percentage
  const [foods, setFoods] = useState([])
  
  const animationFrameRef = useRef(null)
  const lastSpawnRef = useRef(0)
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL)
  const fallSpeedRef = useRef(INITIAL_FALL_SPEED)
  const gameStartTimeRef = useRef(0)
  const playerXRef = useRef(50)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const scoreRef = useRef(0)

  // Load best score from initial value
  const [bestScore, setBestScore] = useState(initialBestScore)
  
  // Обновляем best score при изменении initialBestScore
  useEffect(() => {
    if (initialBestScore > bestScore) {
      setBestScore(initialBestScore)
    }
  }, [initialBestScore])

  // Reset game state
  const resetGame = useCallback(() => {
    setScore(0)
    scoreRef.current = 0
    setLives(INITIAL_LIVES)
    setFoods([])
    setPlayerX(50)
    playerXRef.current = 50
    fallSpeedRef.current = INITIAL_FALL_SPEED
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL
    lastSpawnRef.current = 0
    setIsGameRunning(false)
  }, [])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    setIsGameRunning(true)
    gameStartTimeRef.current = Date.now()
    lastSpawnRef.current = Date.now()
  }, [resetGame])

  // Handle player movement
  const handleMouseDown = useCallback((e) => {
    if (!isGameRunning) return
    isDraggingRef.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    dragStartXRef.current = x - playerXRef.current
  }, [isGameRunning])

  const handleMouseMove = useCallback((e) => {
    if (!isGameRunning || !isDraggingRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const newX = Math.max(5, Math.min(95, x - dragStartXRef.current))
    setPlayerX(newX)
    playerXRef.current = newX
  }, [isGameRunning])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (!isGameRunning) return
    isDraggingRef.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    dragStartXRef.current = x - playerXRef.current
  }, [isGameRunning])

  const handleTouchMove = useCallback((e) => {
    if (!isGameRunning || !isDraggingRef.current) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const newX = Math.max(5, Math.min(95, x - dragStartXRef.current))
    setPlayerX(newX)
    playerXRef.current = newX
  }, [isGameRunning])

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Check collisions
  const checkCollisions = useCallback(() => {
    const playerWidth = 10 // percentage
    const playerLeft = playerXRef.current - playerWidth / 2
    const playerRight = playerXRef.current + playerWidth / 2
    const playerY = 85 // percentage from top

    setFoods(prevFoods => {
      const newFoods = []
      const caughtFoods = []

      for (const food of prevFoods) {
        const foodLeft = food.x - 3
        const foodRight = food.x + 3
        const foodTop = food.y
        const foodBottom = food.y + 6

        // Check collision
        if (
          foodBottom >= playerY &&
          foodTop <= playerY + 5 &&
          foodLeft < playerRight &&
          foodRight > playerLeft
        ) {
          caughtFoods.push(food)
        } else if (food.y < 100) {
          newFoods.push(food)
        }
      }

      // Process caught foods after state update
      if (caughtFoods.length > 0) {
        const coinsToEarn = caughtFoods.length
        
        // Use setTimeout to defer state updates and callbacks to avoid render warnings
        setTimeout(() => {
          setScore(prev => {
            const newScore = prev + coinsToEarn
            scoreRef.current = newScore
            return newScore
          })
          
          if (onCoinsEarned) {
            onCoinsEarned(coinsToEarn)
          }
          if (onCatch) {
            onCatch()
          }
        }, 0)
      }

      return newFoods
    })
  }, [onCatch, onCoinsEarned])

  // Game loop
  useEffect(() => {
    if (!isActive || !isGameRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    let lastTime = Date.now()

    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      // Increase difficulty based on score instead of time
      const difficultyLevel = Math.floor(scoreRef.current / 10)
      fallSpeedRef.current = INITIAL_FALL_SPEED + (difficultyLevel * SPEED_INCREASE)
      spawnIntervalRef.current = Math.max(500, INITIAL_SPAWN_INTERVAL - (difficultyLevel * SPAWN_RATE_DECREASE))

      // Spawn food
      if (now - lastSpawnRef.current >= spawnIntervalRef.current) {
        const newFood = {
          id: Date.now() + Math.random(),
          x: Math.random() * 90 + 5, // 5-95%
          y: 0,
          speed: fallSpeedRef.current
        }
        setFoods(prev => [...prev, newFood])
        lastSpawnRef.current = now
      }

      // Update food positions and check if food fell off screen
      setFoods(prevFoods => {
        const newFoods = []
        let foodsLost = 0

        for (const food of prevFoods) {
          const newY = food.y + food.speed * (deltaTime / 16) // normalize to 60fps
          
          // Check if food fell off screen (lost)
          if (newY >= 100) {
            foodsLost++
          } else {
            newFoods.push({
              ...food,
              y: newY
            })
          }
        }

        // Lose lives for each food that fell off screen (max 1 life per frame)
        if (foodsLost > 0) {
          setLives(prevLives => {
            const newLives = Math.max(0, prevLives - 1) // Lose 1 life per frame max
            if (newLives <= 0) {
              setIsGameRunning(false)
              // Save best score
              const finalScore = scoreRef.current
              setBestScore(prevBest => {
                if (finalScore > prevBest) {
                  // Уведомляем родительский компонент о новом рекорде
                  if (onBestScoreUpdate) {
                    onBestScoreUpdate(finalScore)
                  }
                  return finalScore
                }
                return prevBest
              })
              if (onGameEnd) {
                setTimeout(() => {
                  onGameEnd(finalScore)
                }, 100)
              }
            }
            return newLives
          })
        }

        return newFoods
      })

      // Check collisions
      checkCollisions()

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isActive, isGameRunning, checkCollisions, onGameEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    score,
    lives,
    isGameRunning,
    playerX,
    foods,
    bestScore,
    startGame,
    resetGame,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

