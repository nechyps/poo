import './Character.css'

function Character({ image, state, isAnimating }) {
  const getAnimationClass = () => {
    if (isAnimating) {
      switch (state) {
        case 'eating':
          return 'eating'
        case 'jumping':
          return 'jumping'
        case 'sleeping':
          return 'sleeping'
        default:
          return ''
      }
    }
    
    if (state === 'normal' || state === 'happy') {
      return 'idle'
    }
    
    return ''
  }

  return (
    <div className="character-container">
      <img 
        src={image} 
        alt="Character" 
        className={`character ${getAnimationClass()} ${
          state === 'sleeping' || state === 'eating' || state === 'jumping' 
            ? 'no-levitate' 
            : ''
        }`} 
      />
    </div>
  )
}

export default Character

