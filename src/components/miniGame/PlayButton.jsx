import './PlayButton.css'
import moneyIcon from '../../assets/hud/money.png'

function PlayButton({ onClick, visible }) {
  if (!visible) return null

  return (
    <div className="play-button-container">
      <button 
        className="play-button"
        onClick={onClick}
        aria-label="Играть и зарабатывать монетки"
      >
        <div className="play-button__content">
          <span className="play-icon">🎮</span>
          <span className="play-text">Играй и зарабатывай</span>
          <div className="play-reward">
            <img src={moneyIcon} alt="Coins" className="play-coin-icon" />
            <span className="play-reward-text">+Монетки</span>
            <img src={moneyIcon} alt="Coins" className="play-coin-icon" />
          </div>
        </div>
      </button>
      <div className="play-hint">👆 Нажми сюда 👆</div>
    </div>
  )
}

export default PlayButton

