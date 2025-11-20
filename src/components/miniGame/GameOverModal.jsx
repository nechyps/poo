import './GameOverModal.css'

function GameOverModal({ score, bestScore, onPlayAgain, onExit, visible }) {
  if (!visible) return null

  const isNewRecord = score === bestScore && score > 0

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">Game Over!</h2>
        
        {isNewRecord && (
          <div className="new-record-badge">🏆 New Record!</div>
        )}
        
        <div className="score-section">
          <div className="score-item">
            <span className="score-label">Your Score:</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Best Score:</span>
            <span className="score-value best">{bestScore}</span>
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            className="modal-button play-again"
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          <button 
            className="modal-button exit"
            onClick={onExit}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverModal

