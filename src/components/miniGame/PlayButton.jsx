import './PlayButton.css'

function PlayButton({ onClick, visible }) {
  if (!visible) return null

  return (
    <button 
      className="play-button"
      onClick={onClick}
      aria-label="Play Mini-Game"
    >
      <span className="play-icon">▶</span>
      <span className="play-text">Play</span>
    </button>
  )
}

export default PlayButton

