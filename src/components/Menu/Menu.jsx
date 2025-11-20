import './Menu.css'
import settings from '../../assets/hud/settings.PNG'
import buttonVolumeOn from '../../assets/hud/buttons/button_volume_ON.PNG'
import buttonVolumeOff from '../../assets/hud/buttons/button_volume_off.PNG'
import buttonLogout from '../../assets/hud/buttons/button_logout.PNG'
import buttonCross from '../../assets/hud/buttons/button_cross.PNG'

function Menu({
  onClose,
  onLogout,
  isMusicOn,
  isSfxOn,
  musicVolume,
  sfxVolume,
  onMusicToggle,
  onSfxToggle,
  onMusicVolumeChange,
  onSfxVolumeChange,
  playClickSound,
  onSave,
  onLoad,
  lastSaveTime
}) {
  const withClick = (callback) => () => {
    playClickSound?.()
    callback?.()
  }

  const sections = [
    {
      title: 'Музыка',
      description: 'Фоновая музыка и громкость',
      isOn: isMusicOn,
      onToggle: onMusicToggle,
      slider: {
        value: musicVolume,
        onChange: (e) => onMusicVolumeChange(parseFloat(e.target.value))
      }
    },
    {
      title: 'Звуки',
      description: 'Эффекты кнопок и действий',
      isOn: isSfxOn,
      onToggle: onSfxToggle,
      slider: {
        value: sfxVolume,
        onChange: (e) => onSfxVolumeChange(parseFloat(e.target.value))
      }
    }
  ]

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div
        className="menu-content"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundImage: `url(${settings})` }}
      >
        <button
          type="button"
          className="menu-close-button"
          onClick={withClick(onClose)}
          aria-label="Закрыть меню"
        >
          <img src={buttonCross} alt="" />
        </button>

        <div className="menu-header">
          <div>
            <h2>Настройки</h2>
            <p>Музыка, звуки и управление сохранениями</p>
          </div>
        </div>

        <div className="menu-scroll">
          {sections.map((section) => (
            <section className="menu-section" key={section.title}>
              <div className="menu-section__head">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
                <button
                  type="button"
                  className={`menu-switch ${section.isOn ? 'is-on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    playClickSound?.()
                    section.onToggle?.()
                  }}
                >
                  {section.isOn ? 'Вкл' : 'Выкл'}
                </button>
              </div>

              <div className="menu-section__body">
                <img
                  src={section.isOn ? buttonVolumeOn : buttonVolumeOff}
                  alt=""
                  className="menu-icon-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    playClickSound?.()
                    section.onToggle?.()
                  }}
                />
                {section.isOn && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={section.slider.value}
                    onChange={section.slider.onChange}
                    className="volume-slider"
                  />
                )}
              </div>
            </section>
          ))}

          <section className="menu-section">
            <div className="menu-section__head">
              <div>
                <h3>Сохранения</h3>
                <p>Ручное сохранение и загрузка</p>
              </div>
            </div>

            <div className="menu-actions">
              <button className="menu-button" onClick={withClick(onSave)}>
                💾 Сохранить
              </button>
              <button className="menu-button ghost" onClick={withClick(onLoad)}>
                📂 Загрузить
              </button>
            </div>

            {lastSaveTime && (
              <div className="menu-save-pill">Последнее сохранение: {lastSaveTime}</div>
            )}
          </section>
        </div>

        <button
          type="button"
          className="menu-logout"
          onClick={withClick(onLogout)}
        >
          <img src={buttonLogout} alt="Выйти в меню" />
          Выйти
        </button>
      </div>
    </div>
  )
}

export default Menu

