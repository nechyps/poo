import './PlayButton.css'
import moneyIcon from '../../assets/hud/money.png'

function PlayButton({ onClick, visible }) {
  if (!visible) return null

  return (
    <button 
      className="play-button"
      onClick={onClick}
      aria-label="Играть и зарабатывать монетки"
    >
      <div className="play-button__content">
        <span className="play-icon">🎮</span>
        <div className="play-reward">
          <img src={moneyIcon} alt="Coins" className="play-coin-icon" />
          <span className="play-reward-text">+Монетки</span>
          <img src={moneyIcon} alt="Coins" className="play-coin-icon" />
        </div>
      </div>
    </button>
  )
}

export default PlayButton

