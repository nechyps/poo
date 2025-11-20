import './Food.css'

function Food({ image, isFlying }) {
  if (!image) return null

  return (
    <img 
      src={image} 
      alt="Food" 
      className={`food-item ${isFlying ? 'flying' : ''}`}
    />
  )
}

export default Food

