import './GameSelector.css'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'
import moneyIcon from '../../assets/hud/money.png'

function GameSelector({ visible, onSelectGame, onClose }) {
  if (!visible) return null

  const games = [
    {
      id: 'catch-food',
      title: 'Поймай еду',
      description: 'Лови падающую еду',
      icon: '🍔',
      color: '#ff8bb8'
    },
    {
      id: 'click-food',
      title: 'Кликер еды',
      description: 'Быстро кликай на еду',
      icon: '⚡',
      color: '#ffa88c'
    }
  ]

  return (
    <div className="game-selector-overlay" onClick={onClose}>
      <div className="game-selector-modal" onClick={(e) => e.stopPropagation()}>
        <button className="game-selector-close" onClick={onClose}>
          <img src={buttonCross} alt="Закрыть" />
        </button>
        
        <h2 className="game-selector-title">Выбери мини-игру</h2>
        <p className="game-selector-subtitle">Зарабатывай деньги в играх!</p>
        
        <div className="game-selector-grid">
          {games.map((game) => (
            <button
              key={game.id}
              className="game-selector-card"
              onClick={() => onSelectGame(game.id)}
              style={{ '--card-color': game.color }}
            >
              <div className="game-selector-card-icon">{game.icon}</div>
              <h3 className="game-selector-card-title">{game.title}</h3>
              <p className="game-selector-card-desc">{game.description}</p>
              <div className="game-selector-card-reward">
                <img src={moneyIcon} alt="Деньги" />
                <span>+Деньги</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GameSelector

