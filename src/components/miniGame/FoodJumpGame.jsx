/**
 * Компонент игры Food Jump
 * Персонаж прыгает по платформам из еды и собирает монетки
 */

import { useRef, useEffect, useState } from 'react'
import { useFoodJumpLogic } from '../../hooks/useFoodJumpLogic'
import GameOverModal from './GameOverModal'
import './FoodJumpGame.css'
import candies from '../../assets/meal/candies.png'
import dimsam from '../../assets/meal/dimsam.png'
import onigiri from '../../assets/meal/onigiri.png'
import riceWithOmelette from '../../assets/meal/rice_with_omelette.png'
import jumpCharacter from '../../assets/character/jump.PNG'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'
import moneyIcon from '../../assets/hud/money.png'

const FOOD_IMAGES = [candies, dimsam, onigiri, riceWithOmelette]

function FoodJumpGame({ isActive, onGameEnd, onCoinsEarned }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const hasStartedRef = useRef(false)
  const jumpImgRef = useRef(new Image())
  const coinImgRef = useRef(new Image())
  jumpImgRef.current.src = jumpCharacter
  coinImgRef.current.src = moneyIcon

  const {
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
  } = useFoodJumpLogic({
    isActive,
    onGameEnd: (finalScore) => {
      onGameEnd?.(finalScore)
    },
    onCoinsEarned,
  })

  // Auto-start when component becomes active
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true
      setTimeout(() => {
        startGame()
      }, 500)
    } else if (!isActive) {
      hasStartedRef.current = false
      resetGame()
    }
  }, [isActive, startGame, resetGame])

  // Render game
  useEffect(() => {
    if (!isActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#87CEEB') // Sky blue
      gradient.addColorStop(1, '#E0F6FF') // Light blue
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw foods (platforms)
      if (foods && foods.length > 0) {
        foods.forEach((food) => {
          if (!food || typeof food.type === 'undefined') return
          const screenY = food.y - cameraY
          if (screenY > -100 && screenY < canvas.height + 100) {
            const foodImage = new Image()
            foodImage.src = FOOD_IMAGES[food.type] || FOOD_IMAGES[0]
            
            // Draw food platform
            if (foodImage.complete) {
              ctx.drawImage(
                foodImage,
                food.x,
                screenY,
                80,
                80
              )
            } else {
              // Fallback rectangle while loading
              ctx.fillStyle = '#ffbbdd'
              ctx.fillRect(food.x, screenY, 80, 80)
            }
          }
        })
      }

      // Draw coins
      if (coins && coins.length > 0) {
        coins.forEach((coin) => {
          if (!coin || coin.collected) return
          const coinScreenY = coin.y - cameraY
          if (coinScreenY > -50 && coinScreenY < canvas.height + 50) {
            if (coinImgRef.current && coinImgRef.current.complete) {
              ctx.drawImage(
                coinImgRef.current,
                coin.x,
                coinScreenY,
                30,
                30
              )
            } else {
              // Fallback circle while loading
              ctx.fillStyle = '#FFD700'
              ctx.beginPath()
              ctx.arc(
                coin.x + 15,
                coinScreenY + 15,
                15,
                0,
                Math.PI * 2
              )
              ctx.fill()
            }
          }
        })
      }

      // Draw player
      const playerScreenY = playerY - cameraY
      if (playerScreenY > -50 && playerScreenY < canvas.height + 50) {
        if (jumpImgRef.current.complete) {
          ctx.drawImage(
            jumpImgRef.current,
            175, // Центр экрана (400/2 - 25)
            playerScreenY,
            50,
            50
          )
        } else {
          // Fallback circle while loading
          ctx.fillStyle = '#ff88b5'
          ctx.beginPath()
          ctx.arc(200, playerScreenY + 25, 25, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (isGameRunning) {
        requestAnimationFrame(render)
      }
    }

    render()
  }, [isActive, foods, coins, playerY, cameraY, isGameRunning])

  const handleClose = () => {
    resetGame()
    onGameEnd?.(score)
  }

  if (!isActive) return null

  return (
    <div className="food-jump-game" ref={containerRef}>
      <button className="mini-game-close-button" onClick={handleClose}>
        <img src={buttonCross} alt="Close" />
      </button>

      <div className="game-hud">
        <div className="hud-item">
          <div className="hud-label">Счет</div>
          <div className="hud-value score">{score}</div>
        </div>
        <div className="hud-item">
          <div className="hud-label">Жизни</div>
          <div className="hud-value lives">{lives}</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={400}
        height={600}
      />

      {!isGameRunning && score > 0 && (
        <GameOverModal
          score={score}
          bestScore={score}
          onPlayAgain={() => {
            resetGame()
            setTimeout(() => startGame(), 100)
          }}
          onExit={handleClose}
          visible={true}
        />
      )}
    </div>
  )
}

export default FoodJumpGame

