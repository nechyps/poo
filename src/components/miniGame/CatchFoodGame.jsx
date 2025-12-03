import { useRef, useEffect, useState } from 'react'
import { useCatchFoodLogic } from '../../hooks/useCatchFoodLogic'
import { usePet } from '../../hooks/usePetSupabase'
import GameOverModal from './GameOverModal'
import './CatchFoodGame.css'
import candies from '../../assets/meal/candies.png'
import dimsam from '../../assets/meal/dimsam.png'
import onigiri from '../../assets/meal/onigiri.png'
import riceWithOmelette from '../../assets/meal/rice_with_omelette.png'
import eatCharacter from '../../assets/character/eat.PNG'
import jumpCharacter from '../../assets/character/jump.PNG'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'

const FOOD_IMAGES = [candies, dimsam, onigiri, riceWithOmelette]

// Preload food images
const preloadedImages = FOOD_IMAGES.map(src => {
  const img = new Image()
  img.src = src
  return img
})

function CatchFoodGame({ isActive, onGameEnd, onCoinsEarned }) {
  const { pet, savePetStats } = usePet()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const hasStartedRef = useRef(false)
  const [isCatching, setIsCatching] = useState(false)
  const catchTimeoutRef = useRef(null)
  
  // Preload character images
  const eatImgRef = useRef(new Image())
  const jumpImgRef = useRef(new Image())
  eatImgRef.current.src = eatCharacter
  jumpImgRef.current.src = jumpCharacter

  // Получаем начальный best score из pet
  const initialBestScore = pet?.catchFoodBestScore || 0

  // Обработчик обновления best score
  const handleBestScoreUpdate = (newBestScore) => {
    if (savePetStats && newBestScore > initialBestScore) {
      // Используем текущее значение из pet, а не initialBestScore, чтобы всегда сохранять максимальный рекорд
      const currentBest = pet?.catchFoodBestScore || 0
      if (newBestScore > currentBest) {
        savePetStats({ catchFoodBestScore: newBestScore }).catch(err => {
          console.error('Failed to save best score:', err)
        })
      }
    }
  }

  const {
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
  } = useCatchFoodLogic({
    isActive: isActive && hasStartedRef.current,
    initialBestScore: initialBestScore,
    onBestScoreUpdate: handleBestScoreUpdate,
    onGameEnd: (finalScore) => {
      hasStartedRef.current = false
      setIsCatching(false)
      if (catchTimeoutRef.current) {
        clearTimeout(catchTimeoutRef.current)
      }
      if (onGameEnd) {
        onGameEnd(finalScore)
      }
    },
    onCatch: () => {
      // Trigger catch animation
      setIsCatching(true)
      if (catchTimeoutRef.current) {
        clearTimeout(catchTimeoutRef.current)
      }
      catchTimeoutRef.current = setTimeout(() => {
        setIsCatching(false)
      }, 300)
    },
    onCoinsEarned: onCoinsEarned
  })

  // Reset game when component becomes inactive
  useEffect(() => {
    if (!isActive) {
      hasStartedRef.current = false
      resetGame()
    }
  }, [isActive, resetGame])

  // Auto-start game when component becomes active
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true
      setTimeout(() => {
        startGame()
      }, 200)
    }
  }, [isActive, startGame])

  // Draw game
  useEffect(() => {
    if (!isActive || !isGameRunning) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const container = containerRef.current
    if (!container) return

    // Set canvas size
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const draw = () => {
      if (!isGameRunning) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw player (character) - increased size
      const playerY = canvas.height * 0.85
      const playerWidth = canvas.width * 0.25 // Increased from 0.15
      const playerHeight = canvas.width * 0.25 // Increased from 0.15
      const playerXPos = (canvas.width * playerX) / 100 - playerWidth / 2
      const playerCenterX = (canvas.width * playerX) / 100

      // Choose character image based on catch state
      const characterImg = isCatching ? jumpImgRef.current : eatImgRef.current
      
      // Draw character image
      if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
        ctx.drawImage(
          characterImg,
          playerXPos,
          playerY - playerHeight / 2,
          playerWidth,
          playerHeight
        )
      } else {
        // Fallback circle while loading
        ctx.fillStyle = '#ff88b5'
        ctx.beginPath()
        ctx.arc(
          playerCenterX,
          playerY,
          playerWidth / 2,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }

      // Draw player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.beginPath()
      ctx.ellipse(
        playerCenterX,
        playerY + playerWidth / 2 + 5,
        playerWidth / 2,
        playerWidth / 4,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()

      // Draw foods (3x larger)
      foods.forEach(food => {
        const foodX = (canvas.width * food.x) / 100
        const foodY = (canvas.height * food.y) / 100
        const foodSize = canvas.width * 0.18 // Increased 3x (was 0.06)

        // Get random food image
        const foodImageIndex = Math.floor(food.id % preloadedImages.length)
        const img = preloadedImages[foodImageIndex]
        
        // Draw food image if loaded, otherwise draw fallback circle
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, foodX - foodSize / 2, foodY - foodSize / 2, foodSize, foodSize)
        } else {
          // Fallback circle while loading
          ctx.fillStyle = '#ffbbdd'
          ctx.beginPath()
          ctx.arc(foodX, foodY, foodSize / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      requestAnimationFrame(draw)
    }

    draw()
  }, [isActive, isGameRunning, playerX, foods, isCatching])

  if (!isActive) return null

  const showGameOver = !isGameRunning && score > 0

  const handleCloseClick = () => {
    resetGame()
    setIsCatching(false)
    if (catchTimeoutRef.current) {
      clearTimeout(catchTimeoutRef.current)
    }
    if (onGameEnd) {
      onGameEnd(score)
    }
  }

  return (
    <div 
      className="catch-food-game"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button 
        className="mini-game-close-button"
        onClick={handleCloseClick}
        aria-label="Close Mini-Game"
      >
        <img src={buttonCross} alt="Close" />
      </button>

      {/* Game HUD */}
      {isGameRunning && (
        <div className="game-hud">
          <div className="hud-item">
            <span className="hud-label">Lives:</span>
            <span className="hud-value lives">{lives}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Score:</span>
            <span className="hud-value score">{score}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Best:</span>
            <span className="hud-value best">{bestScore}</span>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <canvas 
        ref={canvasRef}
        className="game-canvas"
      />

      {/* Game Over Modal */}
      <GameOverModal
        score={score}
        bestScore={bestScore}
        onPlayAgain={() => {
          resetGame()
          setTimeout(() => startGame(), 100)
        }}
        onExit={() => {
          resetGame()
          if (onGameEnd) {
            onGameEnd(score)
          }
        }}
        visible={showGameOver}
      />
    </div>
  )
}

export default CatchFoodGame

