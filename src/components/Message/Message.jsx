import './Message.css'

function Message({ text, visible, isError = false }) {
  if (!visible || !text) return null

  return (
    <div className={`message-container ${isError ? 'message-error' : ''}`}>
      <div className={`message-bubble ${isError ? 'message-bubble-error' : ''}`}>
        {text}
      </div>
    </div>
  )
}

export default Message

