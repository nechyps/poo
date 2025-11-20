import './ActionButtons.css'
import buttonHouse from '../../assets/hud/buttons/button_house.png'
import buttonMeal from '../../assets/hud/buttons/button_meal.png'
import buttonToilette from '../../assets/hud/buttons/button_toilette.png'
import buttonMoon from '../../assets/hud/buttons/button_moon.png'

function ActionButtons({ 
  onHouseClick, 
  onMealClick, 
  onToiletClick, 
  onSleepClick,
  disabled = false 
}) {
  return (
    <div className="bottom-buttons">
      <button
        className="bottom-button"
        onClick={onHouseClick}
        disabled={disabled}
        title="Home"
      >
        <img src={buttonHouse} alt="House" />
      </button>
      <button
        className="bottom-button"
        onClick={onMealClick}
        disabled={disabled}
        title="Feed"
      >
        <img src={buttonMeal} alt="Meal" />
      </button>
      <button
        className="bottom-button"
        onClick={onToiletClick}
        disabled={disabled}
        title="Clean"
      >
        <img src={buttonToilette} alt="Toilette" />
      </button>
      <button
        className="bottom-button"
        onClick={onSleepClick}
        disabled={disabled}
        title="Sleep"
      >
        <img src={buttonMoon} alt="Moon" />
      </button>
    </div>
  )
}

export default ActionButtons

