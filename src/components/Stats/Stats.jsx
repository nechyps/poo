import './Stats.css'
import moneyIcon from '../../assets/hud/money.png'

const STAT_CONFIG = [
  { key: 'hunger', label: 'Сытость', accent: '#ff9f40', icon: '🍗' },
  { key: 'energy', label: 'Энергия', accent: '#4bc0c0', icon: '⚡' },
  { key: 'happiness', label: 'Счастье', accent: '#f778ba', icon: '✨' }
]

function Stats({ stats = {}, healthLevel = 0, coins = 0 }) {
  return (
    <div className="stats-panel">
      <div className="stats-compact">
        <div className="stat-mini stat-mini--coins">
          <img src={moneyIcon} alt="Coins" className="stat-mini__coin-icon" />
          <span className="stat-mini__value stat-mini__value--coins">{coins}</span>
        </div>
        {STAT_CONFIG.map(({ key, label, accent, icon }) => {
          const value = Math.round(stats?.[key] ?? 0)
          return (
            <div className="stat-mini" key={key}>
              <span className="stat-mini__icon">{icon}</span>
              <span className="stat-mini__value">{value}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Stats

