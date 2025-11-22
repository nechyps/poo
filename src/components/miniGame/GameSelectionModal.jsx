import './GameSelectionModal.css'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'

function GameSelectionModal({ visible, onSelectGame, onClose }) {
  if (!visible) return null

  return (
    <div className="game-selection-overlay">
      <div className="game-selection-modal">
        <button className="game-selection-close" onClick={onClose}>
          <img src={buttonCross} alt="Close" />
        </button>
        
        <h2 className="game-selection-title">Выберите игру</h2>
        
        <div className="game-selection-options">
          <button 
            className="game-option"
            onClick={() => onSelectGame('catch')}
          >
            <div className="game-option-icon">🍎</div>
            <div className="game-option-title">Лови еду</div>
            <div className="game-option-description">Лови падающую еду</div>
          </button>
          
          <button 
            className="game-option"
            onClick={() => onSelectGame('jump')}
          >
            <div className="game-option-icon">🦘</div>
            <div className="game-option-title">Прыжки по еде</div>
            <div className="game-option-description">Прыгай по платформам и собирай монетки</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameSelectionModal

