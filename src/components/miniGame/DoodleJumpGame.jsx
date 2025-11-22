/**
 * Компонент игры Doodle Jump
 * Персонаж прыгает по платформам из еды
 */

import { useRef, useEffect, useState } from 'react'
import { useDoodleJumpLogic } from '../../hooks/useDoodleJumpLogic'
import GameOverModal from './GameOverModal'
import './DoodleJumpGame.css'
import candies from '../../assets/meal/candies.png'
import dimsam from '../../assets/meal/dimsam.png'
import onigiri from '../../assets/meal/onigiri.png'
import riceWithOmelette from '../../assets/meal/rice_with_omelette.png'
import jumpCharacter from '../../assets/character/jump.PNG'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'

const FOOD_IMAGES = [candies, dimsam, onigiri, riceWithOmelette]

function DoodleJumpGame({ isActive, onGameEnd, onCoinsEarned }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const hasStartedRef = useRef(false)
  const jumpImgRef = useRef(new Image())
  jumpImgRef.current.src = jumpCharacter

  const {
    score,
    lives,
    isGameRunning,
    playerY,
    playerVelocity,
    platforms,
    cameraY,
    startGame,
    resetGame,
  } = useDoodleJumpLogic({
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

      // Draw platforms
      platforms.forEach((platform) => {
        const screenY = platform.y - cameraY
        if (screenY > -50 && screenY < canvas.height + 50) {
          const foodImage = new Image()
          foodImage.src = FOOD_IMAGES[platform.type]
          
          // Draw platform (food)
          ctx.drawImage(
            foodImage,
            platform.x,
            screenY,
            80,
            20
          )
        }
      })

      // Draw player
      const playerScreenY = playerY - cameraY
      if (playerScreenY > -50 && playerScreenY < canvas.height + 50) {
        ctx.drawImage(
          jumpImgRef.current,
          175, // Центр экрана (400/2 - 25)
          playerScreenY,
          50,
          50
        )
      }

      if (isGameRunning) {
        requestAnimationFrame(render)
      }
    }

    render()
  }, [isActive, platforms, playerY, cameraY, isGameRunning])

  const handleClose = () => {
    resetGame()
    onGameEnd?.(score)
  }

  if (!isActive) return null

  return (
    <div className="doodle-jump-game" ref={containerRef}>
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
          onClose={handleClose}
        />
      )}
    </div>
  )
}

export default DoodleJumpGame

